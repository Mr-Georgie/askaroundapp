"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/ask", icon: PlusCircle, label: "Ask" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, hasUnreadNotifications } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isNotifications = item.href === "/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-20 h-16 rounded-lg transition-colors duration-200",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
              {isNotifications && user && hasUnreadNotifications && (
                <span className="absolute top-2 right-5 h-2.5 w-2.5 rounded-full bg-accent animate-pulse"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
