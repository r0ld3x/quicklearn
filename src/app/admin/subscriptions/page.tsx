"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard,
  IndianRupee,
  Loader2,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
interface SubscriptionItem {
  id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface SubscriptionsResponse {
  data: SubscriptionItem[];
  summary: {
    totalActive: number;
    totalRevenue: number;
    byPlan: { plan: string; count: number }[];
  };
}

const planColors: Record<string, string> = {
  PRO: "bg-blue-500/10 text-blue-500",
  ENTERPRISE: "bg-amber-500/10 text-amber-500",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-red-500/10 text-red-500",
  EXPIRED: "bg-zinc-500/10 text-zinc-500",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const { data, isLoading } = useQuery<SubscriptionsResponse>({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
  });

  const summary = data?.summary;

  const filtered = useMemo(() => {
    const subscriptions = data?.data ?? [];
    return subscriptions.filter((sub) => {
      const matchesSearch =
        (sub.user.name || "").toLowerCase().includes(search.toLowerCase()) ||
        sub.user.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || sub.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [data?.data, search, planFilter]);

  const proCount = summary?.byPlan.find((p) => p.plan === "PRO")?.count ?? 0;
  const entCount =
    summary?.byPlan.find((p) => p.plan === "ENTERPRISE")?.count ?? 0;

  const summaryCards = [
    {
      label: "Total Active",
      value: summary?.totalActive ?? 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pro Subscribers",
      value: proCount,
      icon: CreditCard,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Enterprise",
      value: entCount,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Total Revenue",
      value: `₹${(summary?.totalRevenue ?? 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <card.icon className={`size-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      {typeof card.value === "number"
                        ? card.value.toLocaleString()
                        : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>All subscription records</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscribers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-56 h-9"
                  />
                </div>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Subscriber
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                      Start Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                      End Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(sub.user.name || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {sub.user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sub.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={planColors[sub.plan] || ""}>
                          {sub.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium hidden md:table-cell">
                        ₹{sub.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {new Date(sub.startDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {sub.endDate
                          ? new Date(sub.endDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[sub.status] || ""}>
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {filtered.length === 0
                  ? "No subscriptions yet."
                  : "No subscriptions found matching your filters."}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
