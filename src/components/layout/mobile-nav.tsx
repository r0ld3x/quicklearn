"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Zap,
  LayoutDashboard,
  PlusCircle,
  Library,
  Trophy,
  User,
  Settings,
  MessageSquareHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAtom } from "jotai";
import { mobileNavOpenAtom } from "@/store/atoms";

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

export function MobileNav() {
  const [open, setOpen] = useAtom(mobileNavOpenAtom);
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
              <Zap className="size-5 text-primary" />
            </div>
            <span className="font-bold text-lg">QuickLearn</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </Button>
            );
          })}

          <Separator className="my-3 opacity-50" />

          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg p-2 bg-sidebar-accent/50">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {user?.plan || "FREE"}
            </Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
