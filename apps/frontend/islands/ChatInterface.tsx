import { signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface Message {
  id: string;
  role: "user" | "character";
  content: string;
  createdAt: string;
}

const messages = signal<Message[]>([]);
const inputValue = signal("");
const isStreaming = signal(false);

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.value]);

  async function sendMessage() {
    if (!inputValue.value.trim() || isStreaming.value) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.value,
      createdAt: new Date().toISOString(),
    };

    messages.value = [...messages.value, userMessage];
    inputValue.value = "";
    isStreaming.value = true;

    const characterMessageId = crypto.randomUUID();
    const characterMessage: Message = {
      id: characterMessageId,
      role: "character",
      content: "",
      createdAt: new Date().toISOString(),
    };

    messages.value = [...messages.value, characterMessage];

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch(
        "http://localhost:8000/api/universe/test-uuid/conversations/test-conv-uuid/stream",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: "test-conv-uuid",
            role: "user",
            content: userMessage.content,
          }),
        },
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                const currentMessages = messages.value;
                const lastMessage = currentMessages[currentMessages.length - 1];
                if (lastMessage && lastMessage.role === "character") {
                  lastMessage.content += data.content;
                  messages.value = [...currentMessages];
                }
              }
              if (data.done) {
                break;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      isStreaming.value = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div class="flex flex-col h-[600px] bg-white/5 backdrop-blur-lg rounded-xl border border-white/20">
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.value.length === 0
          ? (
            <div class="flex items-center justify-center h-full text-gray-400">
              <p>Start a conversation...</p>
            </div>
          )
          : (
            messages.value.map((msg) => (
              <div
                key={msg.id}
                class={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  class={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-cyan-500 text-white"
                      : "bg-white/10 text-gray-200"
                  }`}
                >
                  <p class="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        <div ref={messagesEndRef} />
      </div>

      <div class="p-4 border-t border-white/20">
        <div class="flex gap-2">
          <textarea
            value={inputValue.value}
            onInput={(
              e,
            ) => (inputValue.value = (e.target as HTMLTextAreaElement).value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isStreaming.value}
            class="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            rows={2}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isStreaming.value || !inputValue.value.trim()}
            class="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold px-6 rounded-lg transition-all"
          >
            {isStreaming.value ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
