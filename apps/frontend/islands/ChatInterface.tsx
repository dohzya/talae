import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { BACKEND_URL } from "../config.ts";

interface Message {
  id: string;
  role: "user" | "character";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  characterId: string;
  createdAt: string;
  lastMessageAt: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
}

interface Props {
  conversationId: string;
}

export default function ChatInterface({ conversationId }: Props) {
  const messages = useSignal<Message[]>([]);
  const inputValue = useSignal("");
  const isStreaming = useSignal(false);
  const loading = useSignal(true);
  const conversation = useSignal<Conversation | null>(null);
  const character = useSignal<Character | null>(null);
  const universeId = useSignal<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.value]);

  useEffect(() => {
    async function loadConversation() {
      try {
        // Load all universes to search for the conversation
        const universesResponse = await fetch(
          "http://localhost:11001/api/universes",
        );
        const universes = await universesResponse.json();

        let foundConv = null;
        let foundChar = null;
        let foundUniverse = null;

        // Search for the conversation and its character across all universes
        for (const univ of universes) {
          const convResponse = await fetch(
            `${BACKEND_URL}/api/universe/${univ.id}/conversations/${conversationId}`,
          );
          if (convResponse.ok) {
            const conv = await convResponse.json();

            // Load characters of this universe to find the right one
            const charResponse = await fetch(
              `${BACKEND_URL}/api/universe/${univ.id}/characters`,
            );
            const characters = await charResponse.json();
            const char = characters.find((c: Character) =>
              c.id === conv.characterId
            );

            // Only accept if the character belongs to this universe
            if (char) {
              foundConv = conv;
              foundChar = char;
              foundUniverse = univ.id;
              break;
            }
          }
        }

        if (!foundConv || !foundChar || !foundUniverse) {
          console.error("Conversation not found");
          loading.value = false;
          return;
        }

        conversation.value = foundConv;
        character.value = foundChar;
        universeId.value = foundUniverse;

        // Load messages
        const messagesResponse = await fetch(
          `${BACKEND_URL}/api/universe/${foundUniverse}/conversations/${conversationId}/messages`,
        );
        const data = await messagesResponse.json();
        messages.value = data.messages || [];
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        loading.value = false;
      }
    }

    loadConversation();
  }, [conversationId]);

  async function sendMessage() {
    if (!inputValue.value.trim() || isStreaming.value || !universeId.value) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.value,
      createdAt: new Date().toISOString(),
    };

    messages.value = [...messages.value, userMessage];
    const userContent = inputValue.value;
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
      const response = await fetch(
        `${BACKEND_URL}/api/universe/${universeId.value}/conversations/${conversationId}/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId,
            role: "user",
            content: userContent,
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

  if (loading.value) {
    return (
      <div class="flex items-center justify-center h-screen">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4">
          </div>
          <p class="text-gray-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation.value || !character.value) {
    return (
      <div class="flex items-center justify-center h-screen">
        <div class="text-center">
          <p class="text-red-400 text-xl mb-4">Conversation not found</p>
          <a href="/universes" class="text-cyan-400 hover:underline">
            ← Back to Universes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="flex flex-col h-screen">
      <div class="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <a
          href="/universes"
          class="text-cyan-400 hover:text-cyan-300 text-sm mb-2 inline-block"
        >
          ← Back to Universes
        </a>
        <h1 class="text-2xl font-bold text-white">{character.value.name}</h1>
        <p class="text-gray-300 text-sm">{character.value.description}</p>
      </div>

      <div
        class="flex-1 overflow-y-auto p-4 space-y-4"
        style="background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))"
      >
        {messages.value.length === 0
          ? (
            <div class="flex items-center justify-center h-full text-gray-400">
              <p>Start a conversation with {character.value.name}...</p>
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
