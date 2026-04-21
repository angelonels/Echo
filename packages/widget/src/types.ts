export type EchoWidgetTheme = {
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  greeting?: string;
};

export type EchoWidgetProps = {
  agentKey: string;
  apiBaseUrl: string;
  customerId?: string;
  customerMetadata?: Record<string, unknown>;
  theme?: EchoWidgetTheme;
};

export type WidgetConfigResponse = {
  agentId?: string;
  agentName?: string;
  greeting?: string;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  isEnabled?: boolean;
};

export type EchoWidgetMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  status?: "pending" | "streaming" | "done" | "error";
};

export type WidgetChatRequest = {
  agentKey: string;
  conversationId: string;
  customerId?: string;
  customerMetadata?: Record<string, unknown>;
  sessionId: string;
  message: string;
};

export type WidgetChatResponse = {
  conversationId?: string;
  message?: string;
  reply?: string;
  answer?: string;
};
