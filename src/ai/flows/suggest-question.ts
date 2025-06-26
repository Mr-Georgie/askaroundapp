// use server'
'use server';

/**
 * @fileOverview Provides question suggestions using Genkit and Gemini.
 *
 * - suggestQuestion - A function to generate question suggestions.
 * - SuggestQuestionInput - The input type for question suggestion.
 * - SuggestQuestionOutput - The output type for question suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQuestionInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate question suggestions.'),
});
export type SuggestQuestionInput = z.infer<typeof SuggestQuestionInputSchema>;

const SuggestQuestionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested questions.'),
});
export type SuggestQuestionOutput = z.infer<typeof SuggestQuestionOutputSchema>;

export async function suggestQuestion(input: SuggestQuestionInput): Promise<SuggestQuestionOutput> {
  return suggestQuestionFlow(input);
}

const suggestQuestionPrompt = ai.definePrompt({
  name: 'suggestQuestionPrompt',
  input: {schema: SuggestQuestionInputSchema},
  output: {schema: SuggestQuestionOutputSchema},
  prompt: `You are an AI assistant designed to suggest questions related to neighborhood recommendations.

  Based on the given topic, generate a list of questions that users might ask to find information or recommendations about their neighborhood.

  Topic: {{{topic}}}

  Suggestions:`, // Keep the suggestions key so that the model formats the output properly
});

const suggestQuestionFlow = ai.defineFlow(
  {
    name: 'suggestQuestionFlow',
    inputSchema: SuggestQuestionInputSchema,
    outputSchema: SuggestQuestionOutputSchema,
  },
  async input => {
    const {output} = await suggestQuestionPrompt(input);
    return output!;
  }
);
