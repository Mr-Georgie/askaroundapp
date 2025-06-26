"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, History, Loader2, Send, Sparkles, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { neighborhoodConcierge } from "@/lib/actions";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "./ui/skeleton";
import {
  addSageMessage,
  getSageMessages,
  createSageConversation,
} from "@/lib/data";
import type { SageMessage } from "@/lib/types";
import Link from "next/link";

const MarkdownText = ({ text }: { text: string }) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(linkRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 3 === 1) {
          const href = parts[i + 1];
          const isExternal =
            href.startsWith("http://") || href.startsWith("https://");

          if (isExternal) {
            return (
              <a
                key={i}
                href={href}
                className="text-primary underline hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                {part}
              </a>
            );
          }

          return (
            <Link
              key={i}
              href={href}
              className="text-primary underline hover:opacity-80 transition-opacity"
            >
              {part}
            </Link>
          );
        }
        if (i % 3 === 2) {
          return null;
        }
        return part.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            {index < part.split("\n").length - 1 && <br />}
          </span>
        ));
      })}
    </>
  );
};

interface AskSageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversationId: string | null;
  onConversationCreated: (newId: string) => void;
}

export function AskSageDialog({
  isOpen,
  onOpenChange,
  conversationId: initialConversationId,
  onConversationCreated,
}: AskSageDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(
    initialConversationId
  );

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentConversationId(initialConversationId);
      setMessages([]);
      setHistoryLoaded(false);

      if (user && initialConversationId) {
        const fetchHistory = async () => {
          try {
            const history = await getSageMessages(user.id, initialConversationId);
            setMessages(history);
          } catch (error) {
            console.error("Error fetching messages:", error);
          } finally {
            setHistoryLoaded(true);
            scrollToBottom();
          }
        };
        fetchHistory();
      } else {
        setHistoryLoaded(true);
      }
    }
  }, [isOpen, initialConversationId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput("");
    setIsLoading(true);

    let conversationIdToUse = currentConversationId;

    // For logged in users, create a conversation record if it's a new chat
    if (user && !conversationIdToUse) {
      try {
        const newConversationId = await createSageConversation(user.id, userText);
        setCurrentConversationId(newConversationId);
        onConversationCreated(newConversationId);
        conversationIdToUse = newConversationId;
      } catch (error) {
        console.error("Error creating conversation:", error);
        setIsLoading(false);
        return;
      }
    }

    // Add user message optimistically
    const userMessage: SageMessage = {
      id: `user-${Date.now()}`,
      conversationId: conversationIdToUse || "guest-session",
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message to DB (fire-and-forget for better performance)
      if (user && conversationIdToUse) {
        addSageMessage(user.id, conversationIdToUse, {
          sender: "user",
          text: userText,
          timestamp: userMessage.timestamp,
        }).catch(console.error);
      }

      // Get Sage's response
      const sageText = await neighborhoodConcierge({query: userText});
      const sageMessage: SageMessage = {
        id: `sage-${Date.now()}`,
        conversationId: conversationIdToUse || "guest-session",
        sender: "sage",
        text: sageText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, sageMessage]);

      // Save Sage's response to DB (fire-and-forget)
      if (user && conversationIdToUse) {
        addSageMessage(user.id, conversationIdToUse, {
          sender: "sage",
          text: sageText,
          timestamp: sageMessage.timestamp,
        }).catch(console.error);
      }

    } catch (error) {
      console.error("Error with Sage:", error);
      const errorText =
        "I'm having a little trouble connecting right now. Please try again later.";
      const errorMessage: SageMessage = {
        id: `error-${Date.now()}`,
        conversationId: conversationIdToUse || "guest-session",
        sender: "sage",
        text: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      if (user && conversationIdToUse) {
        addSageMessage(user.id, conversationIdToUse, {
          sender: "sage",
          text: errorText,
          timestamp: errorMessage.timestamp,
        }).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg p-0 h-[80vh] flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            Ask Sage
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>Your AI neighborhood concierge. Ask me anything!</span>
            {user && (
              <Button
                asChild
                variant="link"
                size="sm"
                className="text-muted-foreground -mr-3 h-auto py-0 text-xs"
              >
                <Link href="/sage" onClick={() => onOpenChange(false)}>
                  <History className="mr-1 h-3 w-3" />
                  History
                </Link>
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pt-4 pb-8">
            {!historyLoaded && !user && <Skeleton className="h-16 w-full" />}

            {historyLoaded && messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground pt-8">
                <p className="font-semibold mb-2">
                  What can I help you find in the neighborhood?
                </p>
                {!user && (
                  <p className="text-xs mt-2">
                    Log in to save your conversations.
                  </p>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
              >
                {message.sender === "sage" && (
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <MarkdownText text={message.text} />
                </div>
                {message.sender === "user" && (
                  <Avatar className="w-8 h-8">
                    {user ? (
                      <>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-8 h-8 border-2 border-primary">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-xl px-4 py-2 bg-muted flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Best place for tacos?"
              autoComplete="off"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}