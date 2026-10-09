export async function loadConversations() {
  const response = await fetch("/api/chat")
  if (!response.ok) throw new Error("Conversation service unavailable")
  return (await response.json()).conversations as Record<string, { role: string; text: string }[]>
}
export async function requestReply(message: string, channel: string, name: string, context: unknown, fallback: string) {
  const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, channel, name, context, fallback }) })
  if (!response.ok) throw new Error("Conversation service unavailable")
  return await response.json() as { answer: string; engine: string; messages: { role: string; text: string }[] }
}
