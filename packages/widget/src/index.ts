export type EchoWidgetConfig = {
  apiBaseUrl: string;
  agentKey: string;
  mountSelector: string;
};

export function createEchoWidget(config: EchoWidgetConfig) {
  return {
    mount() {
      return {
        mounted: true,
        ...config,
      };
    },
  };
}
