"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthProvider";
import { getNotifications, markNotificationAsRead } from "@/lib/data";
import type { AppNotification } from "@/lib/types";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TimeAgo from "@/components/TimeAgo";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getNotifications(user.id).then((data) => {
        setNotifications(data);
        setLoading(false);
      });
    } else {
      if (isClient) {
        setLoading(false);
      }
    }
  }, [user, isClient]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      await markNotificationAsRead(user!.id, notification.id);
    }
    router.push(`/question/${notification.questionId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="animate-in fade-in-0 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          )}

          {!loading && user && notifications.length > 0 && (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`${
                    notification.read ? "opacity-60" : "font-semibold"
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left block p-4 -mx-4 hover:bg-muted/50 transition-all hover:pl-6"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={notification.actor.avatarUrl} />
                        <AvatarFallback>
                          {notification.actor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm">
                        <p className="font-normal">
                          <span className="font-semibold">
                            {notification.actor.name}
                          </span>{" "}
                          answered your question: "{notification.questionText}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-normal">
                          <TimeAgo timestamp={notification.timestamp} />
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && user && notifications.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              You have no new notifications.
            </p>
          )}

          {!loading && !user && (
            <p className="text-center text-muted-foreground py-8">
              Please log in to see your notifications.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
