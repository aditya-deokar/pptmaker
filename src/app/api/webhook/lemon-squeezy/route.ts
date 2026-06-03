import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma";

/**
 * Lemon Squeezy Webhook Handler
 * 
 * Handles subscription lifecycle events from Lemon Squeezy:
 * - subscription_created: New subscription started
 * - subscription_updated: Plan change, renewal, etc.
 * - subscription_cancelled: User cancelled
 * - subscription_expired: Subscription ended
 * - subscription_resumed: Resumed after pause
 * - subscription_paused: Temporarily paused
 */

// Verify webhook signature using HMAC SHA256
function verifySignature(payload: string, signature: string | null): boolean {
    if (!signature || !process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
        console.warn("Missing signature or webhook secret");
        return false;
    }

    try {
        const hmac = crypto.createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);
        const digest = hmac.update(payload).digest("hex");

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

// Map Lemon Squeezy status to our enum
function mapStatus(lsStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
        active: "ACTIVE",
        cancelled: "CANCELLED",
        expired: "EXPIRED",
        past_due: "PAST_DUE",
        paused: "PAUSED",
        unpaid: "UNPAID",
        on_trial: "ON_TRIAL",
    };
    return statusMap[lsStatus] || "ACTIVE";
}

// Check if status grants access to premium features
function isActiveStatus(status: string): boolean {
    return ["active", "on_trial"].includes(status);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-signature");

        // Verify webhook signature
        if (!verifySignature(body, signature)) {
            console.error("🔴 Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(body);
        const eventName = event.meta?.event_name;
        const data = event.data;
        const attributes = data?.attributes;
        const customData = event.meta?.custom_data;

        console.log(`📦 Processing webhook: ${eventName}`);
        console.log(`   Subscription ID: ${data?.id}`);
        console.log(`   Customer ID: ${attributes?.customer_id}`);

        switch (eventName) {
            // =========================================
            // SUBSCRIPTION CREATED
            // =========================================
            case "subscription_created": {
                const userId = customData?.buyerUserId;

                if (!userId) {
                    console.error("🔴 No user ID in custom data");
                    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
                }

                // Check if subscription already exists (idempotency)
                const existingSubscription = await prisma.subscription.findUnique({
                    where: { lemonSqueezyId: String(data.id) },
                });

                if (existingSubscription) {
                    console.log("⚠️ Subscription already exists, skipping creation");
                    return NextResponse.json({ received: true, skipped: true });
                }

                // Create subscription record
                await prisma.subscription.create({
                    data: {
                        userId,
                        lemonSqueezyId: String(data.id),
                        customerId: String(attributes.customer_id),
                        orderId: attributes.order_id ? String(attributes.order_id) : null,
                        variantId: String(attributes.variant_id),
                        status: mapStatus(attributes.status),
                        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
                        endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
                        trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
                    },
                });

                // Update user subscription flag
                await prisma.user.updateMany({
                    where: { id: userId },
                    data: { subscription: true },
                });

                console.log(`✅ Subscription created for user ${userId}`);
                break;
            }

            // =========================================
            // SUBSCRIPTION UPDATED
            // =========================================
            case "subscription_updated": {
                const subscriptionId = String(data.id);

                const subscription = await prisma.subscription.findUnique({
                    where: { lemonSqueezyId: subscriptionId },
                });

                if (!subscription) {
                    console.error(`🔴 Subscription ${subscriptionId} not found`);
                    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
                }

                // Update subscription record
                await prisma.subscription.update({
                    where: { lemonSqueezyId: subscriptionId },
                    data: {
                        status: mapStatus(attributes.status),
                        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
                        endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
                        trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
                    },
                });

                // Update user subscription flag based on status
                await prisma.user.updateMany({
                    where: { id: subscription.userId },
                    data: { subscription: isActiveStatus(attributes.status) },
                });

                console.log(`✅ Subscription ${subscriptionId} updated to status: ${attributes.status}`);
                break;
            }

            // =========================================
            // SUBSCRIPTION CANCELLED / EXPIRED
            // =========================================
            case "subscription_cancelled":
            case "subscription_expired": {
                const subscriptionId = String(data.id);

                const subscription = await prisma.subscription.findUnique({
                    where: { lemonSqueezyId: subscriptionId },
                });

                if (!subscription) {
                    console.warn(`⚠️ Subscription ${subscriptionId} not found for ${eventName}`);
                    return NextResponse.json({ received: true, warning: "Subscription not found" });
                }

                const newStatus = eventName === "subscription_cancelled" ? "CANCELLED" : "EXPIRED";

                // Update subscription status
                await prisma.subscription.update({
                    where: { lemonSqueezyId: subscriptionId },
                    data: {
                        status: newStatus,
                        endsAt: attributes.ends_at ? new Date(attributes.ends_at) : new Date(),
                    },
                });

                // Revoke access
                await prisma.user.updateMany({
                    where: { id: subscription.userId },
                    data: { subscription: false },
                });

                console.log(`✅ Subscription ${subscriptionId} ${eventName.replace("subscription_", "")}`);
                break;
            }

            // =========================================
            // SUBSCRIPTION RESUMED / UNPAUSED
            // =========================================
            case "subscription_resumed":
            case "subscription_unpaused": {
                const subscriptionId = String(data.id);

                const subscription = await prisma.subscription.findUnique({
                    where: { lemonSqueezyId: subscriptionId },
                });

                if (!subscription) {
                    console.warn(`⚠️ Subscription ${subscriptionId} not found for ${eventName}`);
                    return NextResponse.json({ received: true, warning: "Subscription not found" });
                }

                // Restore subscription
                await prisma.subscription.update({
                    where: { lemonSqueezyId: subscriptionId },
                    data: {
                        status: "ACTIVE",
                        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
                    },
                });

                // Restore access
                await prisma.user.updateMany({
                    where: { id: subscription.userId },
                    data: { subscription: true },
                });

                console.log(`✅ Subscription ${subscriptionId} resumed`);
                break;
            }

            // =========================================
            // SUBSCRIPTION PAUSED
            // =========================================
            case "subscription_paused": {
                const subscriptionId = String(data.id);

                const subscription = await prisma.subscription.findUnique({
                    where: { lemonSqueezyId: subscriptionId },
                });

                if (!subscription) {
                    console.warn(`⚠️ Subscription ${subscriptionId} not found for pause`);
                    return NextResponse.json({ received: true, warning: "Subscription not found" });
                }

                // Pause subscription
                await prisma.subscription.update({
                    where: { lemonSqueezyId: subscriptionId },
                    data: {
                        status: "PAUSED",
                    },
                });

                // Revoke access during pause
                await prisma.user.updateMany({
                    where: { id: subscription.userId },
                    data: { subscription: false },
                });

                console.log(`✅ Subscription ${subscriptionId} paused`);
                break;
            }

            // =========================================
            // UNHANDLED EVENTS
            // =========================================
            default:
                console.log(`ℹ️ Unhandled webhook event: ${eventName}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("🔴 Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
