import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { BaseMessage } from "@langchain/core/messages";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { env } from "../config/env.js";
import { retrieveRrf } from "./rrf.js";

export const GraphState = Annotation.Root({
  originalQuery: Annotation<string>(),
  searchQueries: Annotation<string[]>({ reducer: (_previous, next) => next }),
  retrievedDocs: Annotation<any[]>({ reducer: (_previous, next) => next }),
  contextGraded: Annotation<boolean>({ reducer: (_previous, next) => next }),
  messages: Annotation<BaseMessage[]>({
    reducer: (previous, next) => previous.concat(next),
    default: () => [],
  }),
});

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const embeddings = new BedrockEmbeddings({
  region: env.AWS_DEFAULT_REGION,
  credentials,
  model: "amazon.titan-embed-text-v2:0",
});

export const chatModel = new ChatBedrockConverse({
  region: env.AWS_DEFAULT_REGION,
  credentials,
  model: "meta.llama3-8b-instruct-v1:0",
});

async function expandQueryNode(state: typeof GraphState.State) {
  const query = state.originalQuery;
  const loops = state.messages ? state.messages.length : 0;

  if (loops > 0) {
    return { searchQueries: [query, "fallback broader search"] };
  }

  const prompt = `You are a query expansion engine. Generate 3 variations of this query for search (Semantic, Keyword, Action).
Return ONLY a raw JSON array of strings.
Query: ${query}`;

  const response = await chatModel.invoke(prompt);
  let queries = [query];

  try {
    const rawText = response.content as string;
    const clean = rawText.replace(/```json/gi, "").replace(/```/g, "");
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) {
      queries = parsed;
    }
  } catch {
    queries = [query];
  }

  return { searchQueries: queries };
}

async function retrieveNode(state: typeof GraphState.State) {
  const queries = state.searchQueries?.length ? state.searchQueries : [state.originalQuery];
  const allDocLists: { id: string; content: string; rrf_score: number }[][] = [];

  for (const query of queries) {
    const vector = await embeddings.embedQuery(query);
    const docs = await retrieveRrf(query, vector);
    allDocLists.push(docs);
  }

  const seen = new Set<string>();
  const merged: { id: string; content: string; rrf_score: number }[] = [];

  for (const list of allDocLists) {
    for (const doc of list) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        merged.push(doc);
      }
    }
  }

  merged.sort((left, right) => right.rrf_score - left.rrf_score);
  return { retrievedDocs: merged.slice(0, 10) };
}

async function gradeContextNode(state: typeof GraphState.State) {
  const docs = state.retrievedDocs || [];
  const query = state.originalQuery;

  if (docs.length === 0) {
    return { contextGraded: false };
  }

  const context = docs.map((doc) => doc.content).join("\n---\n");
  const prompt = `Evaluate if the following context adequately answers the question.
Context: ${context}
Question: ${query}

Return ONLY "YES" or "NO"`;

  const response = await chatModel.invoke(prompt);
  const rawText = response.content as string;

  return {
    contextGraded: rawText.toUpperCase().includes("YES"),
    messages: [{ role: "user", content: "loop" } as any],
  };
}

function decideToGenerate(state: typeof GraphState.State) {
  const loops = state.messages ? state.messages.length : 0;
  return state.contextGraded || loops >= 2 ? "generate" : "expand";
}

const workflow = new StateGraph(GraphState)
  .addNode("expand", expandQueryNode)
  .addNode("retrieve", retrieveNode)
  .addNode("grade", gradeContextNode)
  .addNode("generate", async () => ({}))
  .addEdge("__start__", "expand")
  .addEdge("expand", "retrieve")
  .addEdge("retrieve", "grade")
  .addConditionalEdges("grade", decideToGenerate)
  .addEdge("generate", "__end__");

export const postgresSaver = PostgresSaver.fromConnString(env.DATABASE_URL);
export const agentWorkflow = workflow.compile({ checkpointer: postgresSaver });
