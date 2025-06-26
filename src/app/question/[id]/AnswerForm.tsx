'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { addAnswer } from "@/lib/data";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AnswerForm({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
       toast({
        title: 'Please log in',
        description: 'You need to be logged in to answer a question.',
        variant: 'destructive'
      });
      return;
    }
    if (!answerText.trim()) return;

    setIsSubmitting(true);
    try {
        await addAnswer(questionId, { text: answerText, user });
        setAnswerText('');
        toast({ title: 'Thank you!', description: 'Your answer has been posted.'});
        router.refresh(); // Reload the page to show the new answer
    } catch (error) {
        toast({ title: 'Error', description: 'Could not post your answer.', variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-4">
      <Textarea 
        placeholder={user ? "Share your recommendation..." : "Please log in to answer."}
        rows={4}
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        disabled={!user || isSubmitting}
      />
      <div className='flex justify-between items-center'>
        <Button variant="outline" size="sm" disabled>
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Photo
        </Button>
         <Button onClick={handleSubmit} disabled={!user || isSubmitting || !answerText.trim()}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
