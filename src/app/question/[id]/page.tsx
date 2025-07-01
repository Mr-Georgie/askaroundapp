import { notFound } from "next/navigation";
import { getQuestionById } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Info, MapPin } from "lucide-react";
import VoteButtons from "@/components/VoteButtons";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import AnswerForm from "./AnswerForm";
import TimeAgo from "@/components/TimeAgo";
import { Badge } from "@/components/ui/badge";

export default async function QuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const getParams = await params;
  const question = await getQuestionById(getParams.id);

  if (!question) {
    notFound();
  }

  const timeAgo = formatDistanceToNow(new Date(question.timestamp), {
    addSuffix: true,
  });

  const firstName = question.user.name.split(" ")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-row items-start gap-4 pb-4">
          <div className="text-3xl pt-1">{question.categoryEmoji}</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-card-foreground">
              {question.text}
            </h1>
            {question.isFlagged && (
              <Badge variant="destructive" className="mt-2 text-xs font-normal">
                <Info className="mr-1 h-3 w-3" />
                This content is under review. Downvote if you find it inappropriate.
              </Badge>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{question.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{firstName}</span>
              <span>&middot;</span>
              <TimeAgo timestamp={question.timestamp} />
            </div>
          </div>
        </CardHeader>
        <CardFooter className="bg-muted/50 px-6 py-3 flex items-center justify-between">
          <VoteButtons
            collection="questions"
            docId={question.id}
            initialVotes={question.votes}
          />
          {/* <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="font-medium text-accent">{question.distance}</span>
          </div> */}
        </CardFooter>
      </Card>

      <Card
        id="answers"
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150"
      >
        <CardHeader>
          <h2 className="text-lg font-semibold">
            {question.answersCount} Answers
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.answers.map((answer, index) => (
            <div key={answer.id}>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage
                    src={answer.user.avatarUrl}
                    alt={answer.user.name}
                  />
                  <AvatarFallback>{answer.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{answer.user.name}</p>
                    <span className="text-xs text-muted-foreground">
                      <TimeAgo timestamp={answer.timestamp} />
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{answer.text}</p>
                  {answer.isFlagged && (
                       <Badge variant="destructive" className="mt-2 text-xs font-normal">
                         <Info className="mr-1 h-3 w-3" />
                         This content is under review.
                       </Badge>
                    )}
                  {answer.photoDataUrl && (
                    <div className="relative mt-2 aspect-video overflow-hidden rounded-lg border">
                      <Image src={answer.photoDataUrl} alt="User submitted photo" fill className="object-cover" data-ai-hint="neighborhood scene" />
                    </div>
                  )}
                  <div className="pt-2">
                    <VoteButtons
                      collection="answers"
                      docId={answer.id}
                      questionId={question.id}
                      initialVotes={answer.votes}
                    />
                  </div>
                </div>
              </div>
              {index < question.answers.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
          {question.answers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Be the first to answer this question!
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
        <CardHeader>
          <h2 className="text-lg font-semibold">Your Answer</h2>
        </CardHeader>
        <CardContent>
          <AnswerForm questionId={question.id} />
        </CardContent>
      </Card>
    </div>
  );
}
