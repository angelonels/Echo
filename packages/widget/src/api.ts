import type {
  WidgetChatRequest,
  WidgetChatResponse,
  WidgetConfigResponse,
} from "./types";

type JsonRecord = Record<string, unknown>;

function normalizeBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/+$/, "");
}

function mapConfigResponse(payload: unknown): WidgetConfigResponse {
  const record = (payload ?? {}) as JsonRecord;
  const widget = (record.widget ?? {}) as JsonRecord;
  const agent = (record.agent ?? {}) as JsonRecord;

  return {
    agentId: stringOrUndefined(record.agentId ?? agent.id),
    agentName: stringOrUndefined(record.agentName ?? agent.name),
    greeting: stringOrUndefined(record.greeting ?? widget.greeting),
    primaryColor: stringOrUndefined(record.primaryColor ?? widget.primaryColor),
    position: positionOrUndefined(record.position ?? widget.position),
    isEnabled: booleanOrUndefined(record.isEnabled ?? widget.isEnabled),
  };
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanOrUndefined(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function positionOrUndefined(value: unknown) {
  return value === "bottom-left" || value === "bottom-right" ? value : undefined;
}

function pickReplyText(payload: unknown) {
  const record = (payload ?? {}) as JsonRecord;
  const message = record.message;
  const reply = record.reply;
  const answer = record.answer;

  if (typeof reply === "string" && reply.length > 0) {
    return reply;
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  if (typeof answer === "string" && answer.length > 0) {
    return answer;
  }

  return "";
}

export async function fetchWidgetConfig(apiBaseUrl: string, agentKey: string) {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/api/v1/widget/config?agentKey=${encodeURIComponent(agentKey)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load widget config (${response.status})`);
  }

  return mapConfigResponse(await response.json());
}

export async function sendWidgetChat(
  apiBaseUrl: string,
  payload: WidgetChatRequest,
  onTextChunk: (chunk: string) => void,
) {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/v1/widget/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Widget chat request failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/event-stream")) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (!reader) {
      return {
        conversationId: payload.conversationId,
        message: "",
      } satisfies WidgetChatResponse;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const line = event
          .split("\n")
          .find((candidate) => candidate.startsWith("data: "));

        if (!line) {
          continue;
        }

        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(data) as JsonRecord;
          if (typeof parsed.text === "string" && parsed.text.length > 0) {
            onTextChunk(parsed.text);
          }
        } catch {
          // Ignore partial or non-JSON events.
        }
      }
    }

    return {
      conversationId: payload.conversationId,
    } satisfies WidgetChatResponse;
  }

  const json = (await response.json()) as JsonRecord;
  const reply = pickReplyText(json);
  if (reply) {
    onTextChunk(reply);
  }

  return {
    conversationId:
      typeof json.conversationId === "string" && json.conversationId.length > 0
        ? json.conversationId
        : payload.conversationId,
    message: reply,
  } satisfies WidgetChatResponse;
}
