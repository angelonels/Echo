export function hasGroundedAnswer(answer: string, contextText: string) {
  return answer.trim().length > 0 && contextText.trim().length > 0;
}
