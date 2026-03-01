"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Library,
  MessageSquareHeart,
  Moon,
  PlusCircle,
  Settings,
  Sun,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { sidebarCollapsedAtom } from "@/store/atoms";

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Content", href: "/content/new", icon: PlusCircle },
  { label: "Library", href: "/library", icon: Library },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

const bottomNavItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Feedback", href: "/feedback", icon: MessageSquareHeart },
];

const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 72 },
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  return (
    <motion.aside
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border relative z-30"
    >
      <div
        className="flex items-center gap-2.5 px-4 h-16 shrink-0 cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 shrink-0">
          <Zap className="size-5 text-primary" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-lg text-sidebar-foreground overflow-hidden whitespace-nowrap"
            >
              QuickLearn
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}

        <Separator className="my-3 opacity-50" />

        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border px-3 py-3 space-y-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "text-muted-foreground hover:text-sidebar-foreground",
                collapsed ? "mx-auto" : "w-full justify-start gap-2",
              )}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Toggle theme
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Toggle theme</TooltipContent>
          )}
        </Tooltip>

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 bg-sidebar-accent/50",
            collapsed && "justify-center p-1.5",
          )}
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || "User"}
                </p>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {user?.plan || "FREE"}
                  </Badge>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-20 size-7 rounded-full border border-sidebar-border bg-sidebar text-muted-foreground hover:text-sidebar-foreground shadow-sm"
          >
            {collapsed ? (
              <ChevronsRight className="size-3.5" />
            ) : (
              <ChevronsLeft className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {collapsed ? "Expand" : "Collapse"}
        </TooltipContent>
      </Tooltip>
    </motion.aside>
  );
}

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Button
      asChild
      variant="ghost"
      size={collapsed ? "icon" : "sm"}
      className={cn(
        "relative",
        collapsed ? "mx-auto" : "w-full justify-start gap-3",
        isActive
          ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      <Link href={item.href}>
        <Icon className="size-4 shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-md bg-primary/10"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
      </Link>
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
