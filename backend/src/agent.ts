import { StateGraph, Annotation } from '@langchain/langgraph';
import { BedrockEmbeddings, ChatBedrockConverse } from '@langchain/aws';
import { retrieveRRF } from './db/rrf';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { BaseMessage } from '@langchain/core/messages';

export const GraphState = Annotation.Root({
  originalQuery: Annotation<string>(),
  searchQueries: Annotation<string[]>({ reducer: (x, y) => y }),
  retrievedDocs: Annotation<any[]>({ reducer: (x, y) => y }),
  contextGraded: Annotation<boolean>({ reducer: (x, y) => y }),
  messages: Annotation<BaseMessage[]>({ reducer: (x, y) => x.concat(y), default: () => [] }),
});

export const embeddings = new BedrockEmbeddings({
  region: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  model: 'amazon.titan-embed-text-v2:0', 
});

export const chatModel = new ChatBedrockConverse({
  region: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  model: 'meta.llama3-8b-instruct-v1:0', 
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
  
  const res = await chatModel.invoke(prompt);
  let queries = [query];
  try {
     const rawText = res.content as string;
     const textResult = rawText.replace(/\`\`\`json/gi,'').replace(/\`\`\`/g,'');
     const parsed = JSON.parse(textResult);
     if (Array.isArray(parsed)) queries = parsed;
  } catch(e) {}
  
  return { searchQueries: queries };
}

async function retrieveNode(state: typeof GraphState.State) {
  const queries = state.searchQueries && state.searchQueries.length > 0 ? state.searchQueries : [state.originalQuery];
  
  const allDocLists: { id: string, content: string, rrf_score: number }[][] = [];
  for (const q of queries) {
     console.log("Embedding:", q);
     const v = await embeddings.embedQuery(q);
     const docs = await retrieveRRF(q, v);
     allDocLists.push(docs);
  }
  const seen = new Set<string>();
  const merged: { id: string, content: string, rrf_score: number }[] = [];
  
  for (const list of allDocLists) {
    for (const doc of list) {
       if (!seen.has(doc.id)) {
          seen.add(doc.id);
          merged.push(doc);
       }
    }
  }
  
  merged.sort((a,b) => b.rrf_score - a.rrf_score);
  return { retrievedDocs: merged.slice(0, 10) };
}

async function gradeContextNode(state: typeof GraphState.State) {
  const docs = state.retrievedDocs || [];
  const query = state.originalQuery;
  
  if (docs.length === 0) return { contextGraded: false };
  
  const ctx = docs.map(d => d.content).join('\n---\n');
  const prompt = `Evaluate if the following context adequately answers the question.
  Context: ${ctx}
  Question: ${query}
  
  Return ONLY "YES" or "NO"`;
  
  const res = await chatModel.invoke(prompt);
  const rawText = res.content as string;
  const isYes = rawText.toUpperCase().includes('YES');
  return { contextGraded: isYes, messages: [{ role: "user", content: "loop" } as any] };
}

async function generateNode(state: typeof GraphState.State) {
  // Logic is usually handled directly by SSE. This state prepares the metadata.
  return {};
}

function decideToGenerate(state: typeof GraphState.State) {
  const loops = state.messages ? state.messages.length : 0;
  console.log("DECIDE:", { graded: state.contextGraded, loops });
  if (state.contextGraded || loops >= 2) {
    return "generate";
  } else {
    return "expand";
  }
}

const workflow = new StateGraph(GraphState)
  .addNode("expand", expandQueryNode)
  .addNode("retrieve", retrieveNode)
  .addNode("grade", gradeContextNode)
  .addNode("generate", generateNode)
  .addEdge("__start__", "expand")
  .addEdge("expand", "retrieve")
  .addEdge("retrieve", "grade")
  .addConditionalEdges("grade", decideToGenerate)
  .addEdge("generate", "__end__");

export const postgresSaver = PostgresSaver.fromConnString(
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/echodb'
);

export const agentWorkflow = workflow.compile({ checkpointer: postgresSaver });
