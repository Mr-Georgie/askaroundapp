"use server";

import { ai } from "@/ai/genkit";
import { findSimilarQuestions } from "@/lib/data";
import { z } from "zod";

export const findRelevantQuestionsTool = ai.defineTool(
  {
    name: "findRelevantQuestions",
    description:
      "Searches the app's community-answered questions to find the most relevant answers for a user's query.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The user query to search for. Should be a descriptive sentence."
        ),
    }),
    outputSchema: z.object({
      answers: z.array(
        z.object({
          questionId: z.string(),
          questionText: z.string(),
          topAnswerText: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    console.log(`[findRelevantQuestionsTool] Searching for: ${input.query}`);
    const relevantQuestions = await findSimilarQuestions(input.query);

    const answers = relevantQuestions
      .map((question) => {
        if (!question.answers || question.answers.length === 0) {
          return null;
        }

        // Find the most voted answer
        const topAnswer = question.answers.reduce((prev, current) => {
          return prev.votes > current.votes ? prev : current;
        });

        return {
          questionId: question.id,
          questionText: question.text,
          topAnswerText: topAnswer.text,
        };
      })
      .filter(
        (
          answer
        ): answer is {
          questionId: string;
          questionText: string;
          topAnswerText: string;
        } => answer !== null
      ) // Remove nulls and type guard
      .slice(0, 3); // Return top 3

    return {
      answers,
    };
  }
);
