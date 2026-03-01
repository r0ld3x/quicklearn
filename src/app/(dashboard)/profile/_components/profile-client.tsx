"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import type { AuthUser } from "@/lib/queries";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Camera,
  Crown,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface Props {
  initialUser: AuthUser | null;
  initialTotalDocs: number;
}

const planConfig = {
  FREE: { label: "Free", color: "bg-zinc-500/10 text-zinc-500", icon: null },
  PRO: { label: "Pro", color: "bg-blue-500/10 text-blue-500", icon: Crown },
  ENTERPRISE: {
    label: "Enterprise",
    color: "bg-amber-500/10 text-amber-500",
    icon: Crown,
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ProfileClient({ initialUser, initialTotalDocs }: Props) {
  const {
    user,
    loading: authLoading,
    refetch,
  } = useAuth(initialUser ?? undefined);
  const [name, setName] = useState(initialUser?.name ?? "");

  useEffect(() => {
    const next = user?.name ?? "";
    if (next === name) return;
    const id = requestAnimationFrame(() => setName(next));
    return () => cancelAnimationFrame(id);
  }, [user?.name]);

  const router = useRouter();

  const updateProfile = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile.mutate(name.trim());
  };

  if (authLoading && !initialUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const plan = (user.plan as keyof typeof planConfig) || "FREE";
  const planInfo = planConfig[plan];
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                <Avatar className="size-24 text-2xl">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-6 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">
                    {user.name || "User"}
                  </h2>
                  <Badge className={planInfo.color}>
                    {planInfo.icon && <planInfo.icon className="size-3 mr-1" />}
                    {planInfo.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {plan === "FREE" && (
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Crown className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Upgrade to Pro</p>
                  <p className="text-sm text-muted-foreground">
                    Get more credits, YouTube & audio support, and chat with content.
                  </p>
                </div>
              </div>
              <Button asChild className="gap-2 shrink-0">
                <Link href="/pricing">
                  Upgrade plan
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || name.trim() === user.name}
            >
              {updateProfile.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Account Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Calendar className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-semibold">{memberSince}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <div className="p-2.5 rounded-lg bg-emerald-500/10">
                  <FileText className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Documents
                  </p>
                  <p className="font-semibold">{initialTotalDocs}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <Sparkles className="size-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="font-semibold">{user.totalCreditsUsed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are on the {planInfo.label} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Crown className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{planInfo.label} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {plan === "FREE"
                      ? "5 credits per day"
                      : plan === "PRO"
                        ? "50 credits per day"
                        : "Unlimited credits"}
                  </p>
                </div>
              </div>
              {plan !== "ENTERPRISE" && (
                <Button onClick={() => router.push("/pricing")}>
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all associated data.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button variant="destructive">
                      Yes, delete my account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
