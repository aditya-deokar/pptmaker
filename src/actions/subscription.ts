"use server";

import prisma from "@/lib/prisma";
import lemonSqueezyClient from "@/lib/axios";
import { onAuthenticateUser } from "./user";

/**
 * Subscription Management Actions
 * 
 * Server actions for managing user subscriptions via Lemon Squeezy.
 */

// =========================================
// GET SUBSCRIPTION
// =========================================

/**
 * Get the current user's subscription details
 */
export const getSubscription = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if (checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: "Not authenticated" };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: checkUser.user.id },
        });

        return { status: 200, data: subscription };
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return { status: 500, error: "Internal server error" };
    }
};

// =========================================
// GET CUSTOMER PORTAL URL
// =========================================

/**
 * Get the Lemon Squeezy customer portal URL
 * Allows users to manage their subscription (update payment, cancel, etc.)
 */
export const getCustomerPortalUrl = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if (checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: "Not authenticated" };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: checkUser.user.id },
        });

        if (!subscription) {
            return { status: 404, error: "No subscription found" };
        }

        // Fetch customer portal URL from Lemon Squeezy
        const response = await lemonSqueezyClient(
            process.env.LEMON_SQUEEZY_API_KEY
        ).get(`/customers/${subscription.customerId}`);

        const portalUrl = response.data.data.attributes.urls.customer_portal;

        return { status: 200, url: portalUrl };
    } catch (error) {
        console.error("Error getting portal URL:", error);
        return { status: 500, error: "Internal server error" };
    }
};

// =========================================
// CANCEL SUBSCRIPTION
// =========================================

/**
 * Cancel the current user's subscription
 * This will cancel at end of billing period (not immediately)
 */
export const cancelSubscription = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if (checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: "Not authenticated" };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: checkUser.user.id },
        });

        if (!subscription) {
            return { status: 404, error: "No subscription found" };
        }

        // Cancel via Lemon Squeezy API
        await lemonSqueezyClient(process.env.LEMON_SQUEEZY_API_KEY).delete(
            `/subscriptions/${subscription.lemonSqueezyId}`
        );

        // Update local status (webhook will also fire)
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELLED" },
        });

        return { status: 200, message: "Subscription cancelled" };
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return { status: 500, error: "Internal server error" };
    }
};

// =========================================
// SYNC SUBSCRIPTION STATUS
// =========================================

/**
 * Sync subscription status with Lemon Squeezy
 * Call this on app load to ensure local DB matches LS
 */
export const syncSubscriptionStatus = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if (checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: "Not authenticated" };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: checkUser.user.id },
        });

        if (!subscription) {
            // No subscription, ensure user.subscription is false
            await prisma.user.updateMany({
                where: { id: checkUser.user.id },
                data: { subscription: false },
            });
            return { status: 200, data: null };
        }

        try {
            // Fetch latest from Lemon Squeezy
            const response = await lemonSqueezyClient(
                process.env.LEMON_SQUEEZY_API_KEY
            ).get(`/subscriptions/${subscription.lemonSqueezyId}`);

            const lsSubscription = response.data.data;
            const attributes = lsSubscription.attributes;

            // Map status
            const statusMap: Record<string, any> = {
                active: "ACTIVE",
                cancelled: "CANCELLED",
                expired: "EXPIRED",
                past_due: "PAST_DUE",
                paused: "PAUSED",
                unpaid: "UNPAID",
                on_trial: "ON_TRIAL",
            };

            // Update local record
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: statusMap[attributes.status] || "ACTIVE",
                    renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
                    endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
                    trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
                },
            });

            // Update user flag
            const isActive = ["active", "on_trial"].includes(attributes.status);
            await prisma.user.updateMany({
                where: { id: checkUser.user.id },
                data: { subscription: isActive },
            });

            return { status: 200, data: updatedSubscription };
        } catch (apiError) {
            console.error("Error fetching from Lemon Squeezy:", apiError);
            // If API fails, just return local data
            return { status: 200, data: subscription };
        }
    } catch (error) {
        console.error("Error syncing subscription:", error);
        return { status: 500, error: "Internal server error" };
    }
};

// =========================================
// CHECK SUBSCRIPTION ACCESS
// =========================================

/**
 * Check if user has active subscription
 * Use this for feature gating
 */
export const hasActiveSubscription = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if (checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: "Not authenticated", hasAccess: false };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: checkUser.user.id },
        });

        if (!subscription) {
            return { status: 200, hasAccess: false };
        }

        const activeStatuses = ["ACTIVE", "ON_TRIAL"];
        const hasAccess = activeStatuses.includes(subscription.status);

        return { status: 200, hasAccess, subscription };
    } catch (error) {
        console.error("Error checking subscription access:", error);
        return { status: 500, error: "Internal server error", hasAccess: false };
    }
};
