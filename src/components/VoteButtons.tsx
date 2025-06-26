"use client";

import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { updateVote } from "@/lib/data";

type VoteButtonsProps = {
  initialVotes: number;
  collection: "questions" | "answers";
  docId: string;
  questionId?: string;
};

export default function VoteButtons({
  initialVotes,
  collection,
  docId,
  questionId,
}: VoteButtonsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const handleVote = (type: "up" | "down") => {
    if (!user) {
      toast({ title: "Please log in to vote", variant: "destructive" });
      return;
    }

    if (voted === type) {
      // Unvote
      const change = type === "up" ? -1 : 1;
      setVoted(null);
      setVotes((v) => v + change);
      updateVote(collection, docId, change as 1 | -1, questionId);
    } else {
      // Vote or change vote
      let change = type === "up" ? 1 : -1;
      if (voted) {
        // If changing vote, it's a 2-point swing
        change = type === "up" ? 2 : -2;
      }
      setVoted(type);
      setVotes((v) => v + change);
      updateVote(collection, docId, change as 1 | -1, questionId);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleVote("up")}
        aria-label="Upvote"
      >
        <ArrowBigUp
          className={cn("h-5 w-5", voted === "up" && "text-accent fill-accent")}
        />
      </Button>
      <span className="font-bold text-lg text-primary w-8 text-center">
        {votes}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleVote("down")}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className={cn(
            "h-5 w-5",
            voted === "down" && "text-destructive fill-destructive"
          )}
        />
      </Button>
    </div>
  );
}
