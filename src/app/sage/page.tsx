"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getSageConversations } from "@/lib/data";
import type { SageConversation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus } from "lucide-react";
import { AskSageDialog } from "@/components/AskSageDialog";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function SagePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<SageConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const convos = await getSageConversations(user.id);
      setConversations(convos);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setDialogOpen(true);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Only refresh if we need updated conversation list
    if (selectedConversationId === null) {
      fetchConversations();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Sage Conversations
          </CardTitle>
          <Button onClick={handleNewChat} size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!loading && user && conversations.length > 0 && (
            <ul className="divide-y">
              {conversations.map((convo) => (
                <li key={convo.id} className="-mx-6">
                  <button
                    onClick={() => handleSelectConversation(convo.id)}
                    className="w-full text-left p-4 px-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate pr-4">
                        {convo.title}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {convo.timestamp
                          ? formatDistanceToNow(new Date(convo.timestamp), {
                              addSuffix: true,
                            })
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {convo.lastMessageText}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && user && conversations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4 text-sm">
                You have no conversations with Sage yet.
              </p>
              <Button 
                onClick={handleNewChat} 
                variant="ghost" 
                className="mt-4"
              >
                Start a new chat
              </Button>
            </div>
          )}
          {!loading && !user && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Please log in to see your Sage conversations.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AskSageDialog
        key={dialogOpen ? "open" : "closed"} // Important for state retention
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        conversationId={selectedConversationId}
        onConversationCreated={(newId) => {
          setSelectedConversationId(newId);
          fetchConversations();
        }}
      />
    </div>
  );
}