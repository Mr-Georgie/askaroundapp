'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { findSimilarQuestions, addQuestion } from '@/lib/data';
import type { Question } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const EMOJIS = ['🍕', '✂️', '🏃', '☕', '🛍️', '🎨', '🎵', '🌳', '🛠️', '💡', '🐾', '📚'];

export default function AskPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💡');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const [isFinding, startFindingTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    startFindingTransition(async () => {
      if(newQuery.trim().length > 2) {
        const questions = await findSimilarQuestions(newQuery);
        setSimilarQuestions(questions);
      } else {
        setSimilarQuestions([]);
      }
    });
  };

  const handleAskQuestion = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to ask a question.',
        variant: 'destructive'
      });
      return;
    }
    if (!query.trim()) return;

    setIsSubmitting(true);
    try {
      await addQuestion({ text: query, categoryEmoji: selectedEmoji, user });
      toast({
        title: 'Success!',
        description: 'Your question has been posted.',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not post your question. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="transition-all duration-500 ease-in-out hover:shadow-xl">
        <CardHeader>
          <CardTitle>Ask the neighborhood</CardTitle>
          <CardDescription>
            First, pick an emoji for your question, then see if it's already been answered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative w-full">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="absolute left-2 top-2 h-10 w-10 text-2xl shrink-0 transition-transform hover:scale-110 active:scale-100 z-10">
                    {selectedEmoji}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <p className="text-sm font-medium text-muted-foreground px-1 pb-2">Choose a tag</p>
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setPopoverOpen(false);
                        }}
                        className="text-2xl p-2 rounded-md hover:bg-accent transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Textarea
                placeholder="e.g., Best place for brunch with a patio?"
                value={query}
                onChange={handleInputChange}
                className="pl-14 pr-32 py-3 min-h-[56px] resize-none"
                rows={2}
                disabled={isSubmitting}
              />
              <Button onClick={handleAskQuestion} disabled={isSubmitting || !query.trim()} className="absolute right-2 top-2 h-10" size="sm">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask Question'}
              </Button>
            </div>
            
            {isFinding && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

            {!isFinding && similarQuestions.length > 0 && (
              <div className="space-y-2 pt-2 animate-in fade-in-0 duration-300">
                <h3 className="text-sm font-semibold text-muted-foreground">Similar Questions</h3>
                <ul className="divide-y rounded-md border">
                  {similarQuestions.map(q => (
                    <li key={q.id}>
                      <Link href={`/question/${q.id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-all text-sm hover:pl-4">
                        <span className="flex items-center gap-3">
                          <span className="text-lg">{q.categoryEmoji}</span>
                          <span>{q.text}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {!isFinding && query.length > 2 && similarQuestions.length === 0 && (
                 <div className="text-center text-sm text-muted-foreground pt-4">
                    <p>Looks like a new question! Go ahead and ask.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
