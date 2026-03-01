"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  ArrowLeft,
  Sun,
  Moon,
  MessageSquareHeart,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquareHeart },
  { label: "API (DeepSeek)", href: "/admin/api", icon: Cpu },
];

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col h-screen bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-sidebar-border">
          <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10 shrink-0">
            <Shield className="size-5 text-destructive" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-3 relative",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="admin-active"
                      className="absolute inset-0 rounded-md bg-primary/10"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-sidebar-foreground"
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <AnimatePresence mode="wait">
            <motion.h1
              key={pathname}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-lg font-semibold"
            >
              {adminNavItems.find(
                (item) =>
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href))
              )?.label ?? "Admin"}
            </motion.h1>
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
