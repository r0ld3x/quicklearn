"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  plan: string;
  credits: number;
  totalCreditsUsed: number;
  emailVerified: boolean;
  createdAt: string;
  _count: { contents: number; subscriptions: number };
}

interface UsersResponse {
  data: UserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ITEMS_PER_PAGE = 20;

const planColors: Record<string, string> = {
  FREE: "bg-zinc-500/10 text-zinc-500",
  PRO: "bg-blue-500/10 text-blue-500",
  ENTERPRISE: "bg-amber-500/10 text-amber-500",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editPlan, setEditPlan] = useState<string>("");
  const [editCredits, setEditCredits] = useState<string>("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(
      (globalThis as unknown as Record<string, ReturnType<typeof setTimeout>>)
        .__adminSearchTimer,
    );
    (
      globalThis as unknown as Record<string, ReturnType<typeof setTimeout>>
    ).__adminSearchTimer = setTimeout(() => {
      setSearchDebounced(value);
    }, 300);
  };

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: [
      "admin",
      "users",
      { page, search: searchDebounced, plan: planFilter },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (searchDebounced) params.set("search", searchDebounced);
      if (planFilter !== "all") params.set("plan", planFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const updateUser = useMutation({
    mutationFn: async (payload: {
      userId: string;
      role?: string;
      plan?: string;
      credits?: number;
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPlan(user.plan);
    setEditCredits(String(user.credits));
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    const payload: {
      userId: string;
      role?: string;
      plan?: string;
      credits?: number;
    } = { userId: selectedUser.id };
    if (editRole !== selectedUser.role)
      payload.role = editRole as "USER" | "ADMIN";
    if (editPlan !== selectedUser.plan)
      payload.plan = editPlan as "FREE" | "PRO" | "ENTERPRISE";
    const cred = parseInt(editCredits, 10);
    if (!Number.isNaN(cred) && cred !== selectedUser.credits)
      payload.credits = cred;
    if (Object.keys(payload).length === 1) return;
    updateUser.mutate(payload);
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    if (
      !confirm(
        `Delete user "${selectedUser.name || selectedUser.email}"? This cannot be undone.`,
      )
    )
      return;
    deleteUser.mutate(selectedUser.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>User Management</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-56 h-9"
                />
              </div>
              <Select
                value={planFilter}
                onValueChange={(v) => {
                  setPlanFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          Name <ArrowUpDown className="size-3" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Plan
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                        Credits Used
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                        Content
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => openEdit(user)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(user.name || "U")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">
                                {user.name || "Unnamed"}
                              </span>
                              {user.role === "ADMIN" && (
                                <Badge className="ml-2 bg-red-500/10 text-red-500 text-[10px]">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={planColors[user.plan] || ""}>
                            {user.plan}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                          {user.totalCreditsUsed}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                          {user._count.contents}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(user);
                                }}
                              >
                                <Pencil className="size-4" />
                                Edit user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No users found.
                </div>
              )}

              {pagination && pagination.total > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(page * ITEMS_PER_PAGE, pagination.total)} of{" "}
                    {pagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedUser.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedUser.name || "Unnamed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={editPlan} onValueChange={setEditPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credits (current balance)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={999999}
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Content: {selectedUser._count.contents} · Used:{" "}
                {selectedUser.totalCreditsUsed} · Joined:{" "}
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                  className="mr-auto"
                >
                  {deleteUser.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Delete user
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={
                      updateUser.isPending ||
                      (editRole === selectedUser.role &&
                        editPlan === selectedUser.plan &&
                        String(selectedUser.credits) === editCredits)
                    }
                  >
                    {updateUser.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
