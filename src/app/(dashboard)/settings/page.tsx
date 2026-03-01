"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Palette,
  Bell,
  Shield,
  CreditCard,
  AlertTriangle,
  Monitor,
  Sun,
  Moon,
  Crown,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const planLabels: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const planCredits: Record<string, string> = {
  FREE: "5 credits per day",
  PRO: "50 credits per day",
  ENTERPRISE: "Unlimited credits",
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    setSavingEmail(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingEmail(false);
    setNewEmail("");
    toast.success("Verification email sent to your new address");
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and account settings
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how QuickLearn looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    theme === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <t.icon
                    className={cn(
                      "size-6",
                      theme === t.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      theme === t.value ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-amber-500" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifs" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your content processing
                </p>
              </div>
              <Switch
                id="email-notifs"
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                  toast.success(
                    `Email notifications ${checked ? "enabled" : "disabled"}`
                  );
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-digest" className="font-medium">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Summary of your weekly learning activity
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={weeklyDigest}
                onCheckedChange={(checked) => {
                  setWeeklyDigest(checked);
                  toast.success(
                    `Weekly digest ${checked ? "enabled" : "disabled"}`
                  );
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-500" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account details and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change-email">Change Email</Label>
              <div className="flex gap-2">
                <Input
                  id="change-email"
                  type="email"
                  placeholder="new@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button onClick={handleChangeEmail} disabled={savingEmail || !newEmail}>
                  {savingEmail && <Loader2 className="size-4 animate-spin" />}
                  {savingEmail ? "Sending..." : "Update"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A verification link will be sent to your new email
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Delete Account
                </p>
                <p className="text-sm text-muted-foreground">
                  Permanently remove your account and all data
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      This action is irreversible. All your data, content, and
                      summaries will be permanently deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive">
                      Delete permanently
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-purple-500" />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your plan and billing details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Crown className="size-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{planLabels[user?.plan || "FREE"]} Plan</p>
                    <Badge className="bg-blue-500/10 text-blue-500">
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {planCredits[user?.plan || "FREE"]}
                  </p>
                </div>
              </div>
              {user?.plan === "FREE" ? (
                <Button asChild className="gap-2">
                  <Link href="/pricing">
                    Upgrade plan
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : user?.plan !== "ENTERPRISE" ? (
                <Button variant="outline" asChild>
                  <Link href="/pricing">Upgrade</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
