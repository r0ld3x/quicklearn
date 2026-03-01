"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted successfully");
        await logout();
        router.push("/");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete account");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
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
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-amber-500" />
              Notifications
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 ml-1">
                Coming Soon
              </Badge>
            </CardTitle>
            <CardDescription>
              Notification preferences will be available soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-muted-foreground">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your content processing
                </p>
              </div>
              <Switch disabled checked={false} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-muted-foreground">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Summary of your weekly learning activity
                </p>
              </div>
              <Switch disabled checked={false} />
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
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">
                {user?.email || "—"}
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
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting && <Loader2 className="size-4 animate-spin mr-1" />}
                      {deleting ? "Deleting..." : "Delete permanently"}
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
