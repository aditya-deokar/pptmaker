"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { themes } from "@/lib/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Account Settings State
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [receiveMarketing, setReceiveMarketing] = useState(false);

  // State for Change Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Placeholder Functions
  const handleRegenerateApiKey = () => {
    // Placeholder for API key regeneration logic
    alert("API Key regeneration requested!");
  };

  const handleDeleteAccount = () => {
    // Placeholder for account deletion logic
    if (confirm("Are you sure you want to delete your account?")) {
      alert("Account deletion requested!");
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-semibold dark:text-primary backdrop-blur-lg">
            Settings
          </h1>
          <p className="text-base font-normal dark:text-secondary">
            All your settings
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>API Keys</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input type="password" value="••••••••••••••••" readOnly />
                    <Button variant="outline" onClick={handleRegenerateApiKey}>Regenerate</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <Button onClick={() => toast.success("Password changed successfully!")}>Save Password</Button>
              </div>

              <div className="pt-4">
                <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}