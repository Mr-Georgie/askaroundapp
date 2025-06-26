import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, MapPin, User } from "lucide-react";
import VoteButtons from "./VoteButtons";
import type { Question } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import TimeAgo from "./TimeAgo";

type QuestionCardProps = {
  question: Question;
};

export default function QuestionCard({ question }: QuestionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(question.timestamp), {
    addSuffix: true,
  });
  const firstName = question.user.name.split(" ")[0];

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]">
      <Link href={`/question/${question.id}`} className="block">
        <CardHeader className="flex flex-row items-start gap-4 pb-4">
          <div className="text-2xl pt-1">{question.categoryEmoji}</div>
          <div className="flex-1">
            <p className="font-semibold text-card-foreground">
              {question.text}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback>{question.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{firstName}</span>
              <span>&middot;</span>
              <TimeAgo timestamp={question.timestamp} />
            </div>
          </div>
        </CardHeader>
      </Link>
      <CardFooter className="bg-muted/50 px-6 py-3 flex items-center justify-between">
        <VoteButtons
          collection="questions"
          docId={question.id}
          initialVotes={question.votes}
        />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            href={`/question/${question.id}#answers`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{question.answersCount} Answers</span>
          </Link>
          {/* <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="font-medium text-accent">{question.distance}</span>
          </div> */}
        </div>
      </CardFooter>
    </Card>
  );
}
