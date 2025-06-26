"use server";
/**
 * @fileOverview An AI-powered neighborhood concierge that answers questions by summarizing existing community knowledge.
 *
 * - neighborhoodConcierge - A function that processes neighborhood-related questions.
 * - NeighborhoodConciergeInput - The input type for the neighborhoodConcierge function.
 * - NeighborhoodConciergeOutput - The return type for the neighborhoodConcierge function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { findSimilarQuestions } from "@/lib/data";
import { createHash } from "crypto";
import admin, { dbAdmin } from "@/lib/firebaseAdmin";

const NeighborhoodConciergeInputSchema = z.object({
  query: z.string().describe("The question about the neighborhood."),
});
export type NeighborhoodConciergeInput = z.infer<
  typeof NeighborhoodConciergeInputSchema
>;

// The output is now a simple string.
export type NeighborhoodConciergeOutput = string;

export async function neighborhoodConcierge(
  input: NeighborhoodConciergeInput
): Promise<NeighborhoodConciergeOutput> {
  const cacheKey = createHash("md5")
    .update(input.query.toLowerCase().trim())
    .digest("hex");
  const cacheRef = dbAdmin.collection("sageCache").doc(cacheKey);

  try {
    const cacheDoc = await cacheRef.get();
    if (cacheDoc.exists) {
      const cachedData = cacheDoc.data();
      if (cachedData && cachedData.response) {
        console.log(`[Sage Cache] HIT for query: "${input.query}"`);
        return cachedData.response;
      }
    }
  } catch (error) {
    console.error("[Sage Cache] Error reading from cache:", error);
    // Proceed without cache if there's an error
  }

  console.log(`[Sage Cache] MISS for query: "${input.query}"`);
  const response = await neighborhoodConciergeFlow(input);

  try {
    // Cache the new response. Don't let caching errors block the response.
    await cacheRef.set({
      query: input.query,
      response: response,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[Sage Cache] Error writing to cache:", error);
  }

  return response;
}

const findCommunityKnowledge = ai.defineTool(
  {
    name: "findCommunityKnowledge",
    description:
      "Searches the community knowledge base for questions and answers related to the user's query.",
    inputSchema: z.object({
      query: z.string().describe("The user's search query."),
    }),
    outputSchema: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
          answers: z
            .array(
              z.object({
                text: z.string(),
                votes: z.number(),
              })
            )
            .describe("The top-voted answers for the question."),
        })
      )
      .describe("A list of relevant questions and their top answers."),
  },
  async ({ query }) => {
    const questions = await findSimilarQuestions(query);
    // Format the data to be concise for the AI model
    return questions.slice(0, 3).map((q) => ({
      // Limit to top 3 similar questions
      id: q.id,
      text: q.text,
      answers: q.answers
        .sort((a, b) => b.votes - a.votes) // Sort answers by votes
        .slice(0, 2) // Limit to top 2 answers for each question
        .map((a) => ({ text: a.text, votes: a.votes })),
    }));
  }
);

const systemPrompt = `You are Sage, a helpful and friendly AI neighborhood concierge. Your purpose is to answer user queries (questions) by summarizing existing answers from the community knowledge base.

When a user asks a question:
1.  You MUST use the \`findCommunityKnowledge\` tool to search for relevant questions and answers. Do not answer from your own knowledge.
2.  Analyze the information returned by the tool.
3.  Provide a concise, helpful summary of the most relevant findings.
4.  When you cite information from an answer, you MUST include a markdown link to the original question using its ID, like this: \`...based on one answer, [Luigi's Pizzeria is a great choice](/question/the_question_id).\`
5.  If the tool returns no relevant information, or the information is not relevant to the user's query, you MUST state that you couldn't find anything related in the community and suggest they ask a new question to the community.
6.  Do not invent information. Stick strictly to the data provided by the tool. Your entire response must be based on the tool's output.
7.  However, you can introduce yourself to users who asks about who you are and what you can help them with. 
8.  When introducing your self (if asked), do not include the inner workings (algorithm) of your functionality in your response`;

const neighborhoodConciergePrompt = ai.definePrompt({
  name: "neighborhoodConciergePrompt",
  system: systemPrompt,
  tools: [findCommunityKnowledge],
  input: { schema: NeighborhoodConciergeInputSchema },
  // We no longer specify an output schema, so the model will return raw text.
  prompt: `Please answer this question: {{{query}}}`,
});

const neighborhoodConciergeFlow = ai.defineFlow(
  {
    name: "neighborhoodConciergeFlow",
    inputSchema: NeighborhoodConciergeInputSchema,
    outputSchema: z.string(), // The flow now returns a simple string.
  },
  async (input) => {
    const response = await neighborhoodConciergePrompt(input);
    const text = response.text;

    if (!text) {
      console.error(
        "AI response validation failed. The output text was empty."
      );
      throw new Error(
        "I'm sorry, I had trouble formulating a response. Please try asking in a different way."
      );
    }
    return text;
  }
);
