export interface ChatModelProvider {
  generateText(prompt: string): Promise<string>;
}
