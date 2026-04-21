"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchWidgetConfig, sendWidgetChat } from "./api";
import { buildStorageKey, generateClientId, readStorage, writeStorage } from "./storage";
import type { EchoWidgetMessage, EchoWidgetProps, EchoWidgetTheme, WidgetConfigResponse } from "./types";

const FALLBACK_GREETING = "Hi, I'm Echo. Ask me anything about this company's support content.";
const DEFAULT_PRIMARY_COLOR = "#0f766e";
const DEFAULT_POSITION = "bottom-right";

function createTimestamp() {
  return new Date().toISOString();
}

function mergeConfig(config: WidgetConfigResponse | null, theme?: EchoWidgetTheme) {
  return {
    agentName: config?.agentName ?? "Echo Assistant",
    greeting: theme?.greeting ?? config?.greeting ?? FALLBACK_GREETING,
    primaryColor: theme?.primaryColor ?? config?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    position: theme?.position ?? config?.position ?? DEFAULT_POSITION,
    isEnabled: config?.isEnabled ?? true,
  };
}

function createMessage(role: EchoWidgetMessage["role"], text: string): EchoWidgetMessage {
  return {
    id: generateClientId("msg"),
    role,
    text,
    timestamp: createTimestamp(),
    status: role === "assistant" ? "done" : undefined,
  };
}

function appendAssistantChunk(
  messages: EchoWidgetMessage[],
  textChunk: string,
): EchoWidgetMessage[] {
  const next = [...messages];
  const last = next[next.length - 1];

  if (!last || last.role !== "assistant" || last.status === "done") {
    next.push({
      id: generateClientId("msg"),
      role: "assistant",
      text: textChunk,
      timestamp: createTimestamp(),
      status: "streaming",
    });
    return next;
  }

  last.text += textChunk;
  last.status = "streaming";
  return next;
}

export function EchoWidget(props: EchoWidgetProps) {
  const { agentKey, apiBaseUrl, customerId, customerMetadata, theme } = props;
  const themeGreeting = theme?.greeting;
  const themePosition = theme?.position;
  const themePrimaryColor = theme?.primaryColor;
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<EchoWidgetMessage[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<WidgetConfigResponse | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const resolvedTheme = useMemo(
    () => ({
      greeting: themeGreeting,
      position: themePosition,
      primaryColor: themePrimaryColor,
    }),
    [themeGreeting, themePosition, themePrimaryColor],
  );

  const customerKey = customerId ?? "anonymous";
  const sessionStorageKey = useMemo(
    () => buildStorageKey("session", agentKey, customerKey),
    [agentKey, customerKey],
  );
  const conversationStorageKey = useMemo(
    () => buildStorageKey("conversation", agentKey, customerKey),
    [agentKey, customerKey],
  );

  const mergedConfig = useMemo(
    () =>
      mergeConfig(config, resolvedTheme),
    [config, resolvedTheme],
  );

  useEffect(() => {
    const resolvedSessionId =
      customerId ?? readStorage(sessionStorageKey) ?? generateClientId("anon");
    const resolvedConversationId =
      readStorage(conversationStorageKey) ?? generateClientId("conv");

    if (!customerId) {
      writeStorage(sessionStorageKey, resolvedSessionId);
    }
    writeStorage(conversationStorageKey, resolvedConversationId);

    setSessionId(resolvedSessionId);
    setConversationId(resolvedConversationId);
  }, [conversationStorageKey, customerId, sessionStorageKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      setIsConfigLoading(true);
      setConfigError(null);

      try {
        const nextConfig = await fetchWidgetConfig(apiBaseUrl, agentKey);
        if (cancelled) {
          return;
        }
        setConfig(nextConfig);
        setMessages((current) =>
          current.length > 0
            ? current
            : [
                createMessage(
                  "assistant",
                  mergeConfig(nextConfig, resolvedTheme).greeting,
                ),
              ],
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to load widget configuration.";
        setConfigError(message);
        setMessages((current) =>
          current.length > 0
            ? current
            : [
                createMessage(
                  "assistant",
                  mergeConfig(null, resolvedTheme).greeting,
                ),
              ],
        );
      } finally {
        if (!cancelled) {
          setIsConfigLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [agentKey, apiBaseUrl, resolvedTheme]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim() || isSending || !sessionId || !conversationId || !mergedConfig.isEnabled) {
      return;
    }

    const outgoingMessage = draft.trim();
    setDraft("");
    setChatError(null);
    setIsSending(true);
    setMessages((current) => [...current, createMessage("user", outgoingMessage)]);

    try {
      setMessages((current) => [
        ...current,
        {
          id: generateClientId("msg"),
          role: "assistant",
          text: "",
          timestamp: createTimestamp(),
          status: "streaming",
        },
      ]);

      const response = await sendWidgetChat(
        apiBaseUrl,
        {
          agentKey,
          conversationId,
          customerId,
          customerMetadata,
          sessionId,
          message: outgoingMessage,
        },
        (chunk) => {
          setMessages((current) => appendAssistantChunk(current, chunk));
        },
      );

      const nextConversationId = response.conversationId ?? conversationId;
      setConversationId(nextConversationId);
      writeStorage(conversationStorageKey, nextConversationId);
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];

        if (last?.role === "assistant") {
          last.status = "done";
          if (!last.text.trim()) {
            last.text = "I could not generate a response for that request.";
            last.status = "error";
          }
        }

        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send message right now.";
      setChatError(message);
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];

        if (last?.role === "assistant") {
          last.text = "I'm having trouble reaching the Echo service right now.";
          last.status = "error";
        }

        return next;
      });
    } finally {
      setIsSending(false);
    }
  }

  const placementStyle =
    mergedConfig.position === "bottom-left"
      ? ({ left: 24, right: "auto" } as const)
      : ({ right: 24, left: "auto" } as const);

  return (
    <div style={{ ...styles.shell, ...placementStyle }}>
      {isOpen ? (
        <section style={styles.panel}>
          <header style={{ ...styles.header, backgroundColor: mergedConfig.primaryColor }}>
            <div>
              <strong style={styles.title}>{mergedConfig.agentName}</strong>
              <p style={styles.subtitle}>Embedded Echo support assistant</p>
            </div>
            <button aria-label="Close chat" onClick={() => setIsOpen(false)} style={styles.iconButton} type="button">
              X
            </button>
          </header>

          {isConfigLoading ? (
            <div style={styles.stateBlock}>Loading widget configuration...</div>
          ) : !mergedConfig.isEnabled ? (
            <div style={styles.stateBlock}>This chat widget is currently unavailable.</div>
          ) : (
            <>
              {configError ? (
                <div style={styles.warningBlock}>
                  <strong style={styles.warningTitle}>Configuration fallback in use</strong>
                  <span>{configError}</span>
                </div>
              ) : null}

              <div style={styles.transcript}>
                {messages.map((message) => (
                  <article
                    key={message.id}
                    style={{
                      ...styles.message,
                      ...(message.role === "user" ? styles.userMessage : styles.assistantMessage),
                    }}
                  >
                    <div style={styles.messageLabel}>
                      {message.role === "user" ? "You" : mergedConfig.agentName}
                    </div>
                    <div>{message.text || (message.status === "streaming" ? "Thinking..." : "")}</div>
                  </article>
                ))}
              </div>

              {chatError ? <div style={styles.errorBlock}>{chatError}</div> : null}

              <form onSubmit={handleSend} style={styles.form}>
                <textarea
                  aria-label="Message Echo"
                  disabled={isSending}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask a question..."
                  rows={3}
                  style={styles.textarea}
                  value={draft}
                />
                <button
                  disabled={!draft.trim() || isSending}
                  style={{ ...styles.sendButton, backgroundColor: mergedConfig.primaryColor }}
                  type="submit"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="Open Echo chat widget"
        onClick={() => setIsOpen((current) => !current)}
        style={{ ...styles.launcher, backgroundColor: mergedConfig.primaryColor }}
        type="button"
      >
        {isOpen ? "Close" : "Chat with Echo"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: "fixed",
    bottom: 24,
    zIndex: 2147483000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  launcher: {
    border: "none",
    borderRadius: 999,
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    padding: "14px 20px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
  },
  panel: {
    width: 360,
    maxWidth: "calc(100vw - 32px)",
    height: 560,
    maxHeight: "min(560px, calc(100vh - 96px))",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 28px 70px rgba(15, 23, 42, 0.26)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
  },
  header: {
    color: "#ffffff",
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    display: "block",
    fontSize: 16,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 12,
    opacity: 0.88,
  },
  iconButton: {
    background: "rgba(255, 255, 255, 0.16)",
    border: "none",
    color: "#ffffff",
    width: 32,
    height: 32,
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
  },
  transcript: {
    flex: 1,
    overflowY: "auto",
    backgroundColor: "#f8fafc",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  message: {
    maxWidth: "88%",
    borderRadius: 18,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  userMessage: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  assistantMessage: {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    alignSelf: "flex-start",
    border: "1px solid #e2e8f0",
    borderBottomLeftRadius: 6,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.72,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  form: {
    padding: 16,
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    backgroundColor: "#ffffff",
  },
  textarea: {
    width: "100%",
    resize: "none",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    outline: "none",
    minHeight: 80,
  },
  sendButton: {
    alignSelf: "flex-end",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
    borderRadius: 999,
    padding: "11px 18px",
  },
  stateBlock: {
    padding: 24,
    color: "#334155",
    fontSize: 14,
  },
  warningBlock: {
    backgroundColor: "#fff7ed",
    color: "#9a3412",
    padding: "12px 16px",
    borderBottom: "1px solid #fdba74",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  warningTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  errorBlock: {
    color: "#b91c1c",
    padding: "0 16px 8px",
    fontSize: 13,
  },
};
