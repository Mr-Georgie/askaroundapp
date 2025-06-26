"use server";

import {
  neighborhoodConcierge as neighborhoodConciergeFlow,
  type NeighborhoodConciergeInput,
  type NeighborhoodConciergeOutput,
} from "@/ai/flows/neighborhood-concierge";
import {
  suggestQuestion as suggestQuestionFlow,
  type SuggestQuestionInput,
} from "@/ai/flows/suggest-question";

export async function neighborhoodConcierge(
  input: NeighborhoodConciergeInput
): Promise<NeighborhoodConciergeOutput> {
  // All logic is now handled inside the Genkit flow, which uses tools.
  return await neighborhoodConciergeFlow(input);
}

export async function suggestQuestion(input: SuggestQuestionInput) {
  return await suggestQuestionFlow(input);
}
