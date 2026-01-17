"use client";

import { useEffect, useState, useMemo } from "react";
import QuestionCard from "@/components/QuestionCard";
import { getQuestions, getKeywords } from "@/lib/data";
import type { Question, Keyword } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { STOP_WORDS } from "../../scripts/keywordExtractor";

const KeywordTags = ({
  keywords,
  onKeywordSelect,
}: {
  keywords: Keyword[];
  onKeywordSelect: (keyword: string) => void;
}) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md">
      <div className="flex w-max space-x-2 pb-2">
        {keywords.map((kw) => (
          <button
            key={kw.id}
            onClick={() => onKeywordSelect(kw.id)}
            className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            #{kw.id}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [q, k] = await Promise.all([getQuestions(), getKeywords(10)]);
      setQuestions(q);
      setKeywords(k);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredQuestions = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return questions;
    }

    // Handle tag search if the term starts with #
    if (trimmedSearch.startsWith("#")) {
      const tag = trimmedSearch.substring(1);
      if (!tag) return questions;
      return questions.filter((q) =>
        q.keywords.some((kw) => kw.toLowerCase() === tag)
      );
    }

    // Handle general text search
    const searchWords = trimmedSearch
      .split(/\s+/)
      .filter((word) => word && !STOP_WORDS.has(word));

    if (searchWords.length === 0) {
      return questions;
    }

    return questions.filter((q) => {
      const questionTextLower = q.text.toLowerCase();
      // Check if all search words are present in the question text.
      return searchWords.every((word) => questionTextLower.includes(word));
    });
  }, [searchTerm, questions]);

  const handleKeywordSelect = (keyword: string) => {
    setSearchTerm(`#${keyword}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-4 p-4 rounded-lg bg-card border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search questions or #tags..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <KeywordTags
          keywords={keywords}
          onKeywordSelect={handleKeywordSelect}
        />
      </div>

      <div className="space-y-4">
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-card border space-y-3"
            >
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}

        {!loading &&
          filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <QuestionCard question={question} />
            </div>
          ))}

        {!loading && filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold">No questions found</p>
            <p className="text-sm mt-1">
              Try a different search term or{" "}
              <a href="/ask" className="text-primary">
                ask a new question!
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
