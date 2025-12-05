import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Universe {
  id: string;
  name: string;
  description: string;
  currentState: string;
}

interface Character {
  id: string;
  universeId: string;
  name: string;
  description: string;
  currentState: string;
  availability: "Available" | "NonAvailable";
  availableUntil: string | null;
}

const EMOJI_MAP: Record<string, string> = {
  "Medieval Kingdom": "🏰",
  "Space Station Alpha": "🚀",
  "Enchanted Forest": "🌿",
};

const AVAILABILITY_COLORS = {
  Available: "bg-green-500",
  NonAvailable: "bg-gray-500",
};

const AVAILABILITY_TEXT = {
  Available: "Available",
  NonAvailable: "Not Available",
};

const DEMO_USER_ID = "67045504-7d81-4f27-ae3f-a2b599d36b75";

interface Props {
  universeId: string;
}

export default function UniverseDetail({ universeId }: Props) {
  const universe = useSignal<Universe | null>(null);
  const characters = useSignal<Character[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const univResponse = await fetch(
          `http://localhost:11001/api/universes/${universeId}`,
        );
        if (!univResponse.ok) {
          error.value = "Universe not found";
          loading.value = false;
          return;
        }

        const univData: Universe = await univResponse.json();
        universe.value = univData;

        const charResponse = await fetch(
          `http://localhost:11001/api/universe/${universeId}/characters`,
        );
        if (charResponse.ok) {
          characters.value = await charResponse.json();
        }
      } catch (err) {
        console.error("Error loading universe:", err);
        error.value = "Failed to load universe";
      } finally {
        loading.value = false;
      }
    }

    loadData();
  }, [universeId]);

  async function startConversation(characterId: string) {
    try {
      const response = await fetch(
        `http://localhost:11001/api/universe/${universeId}/conversations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: DEMO_USER_ID, characterId }),
        },
      );

      if (!response.ok) {
        console.error("Failed to create conversation");
        return;
      }

      const conversation = await response.json();
      globalThis.location.href = `/chat/${conversation.id}`;
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  }

  if (loading.value) {
    return (
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400">
        </div>
        <p class="mt-4 text-gray-300">Loading universe...</p>
      </div>
    );
  }

  if (error.value || !universe.value) {
    return (
      <div class="text-center py-12">
        <p class="text-red-400 text-xl">
          {error.value || "Universe not found"}
        </p>

        <a
          href="/universes"
          class="text-cyan-400 hover:underline mt-4 inline-block"
        >
          ← Back to Universes
        </a>
      </div>
    );
  }

  return (
    <div class="max-w-6xl mx-auto">
      <header class="mb-8 pt-8">
        <a
          href="/universes"
          class="text-cyan-400 hover:text-cyan-300 mb-4 inline-block"
        >
          ← Back to Universes
        </a>
        <div class="flex items-center gap-4 mb-4">
          <div class="text-5xl">
            {EMOJI_MAP[universe.value.name] || "🌍"}
          </div>
          <div>
            <h1 class="text-4xl font-bold text-white mb-2">
              {universe.value.name}
            </h1>
            <p class="text-gray-300">{universe.value.description}</p>
          </div>
        </div>
        <div class="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <h2 class="text-sm font-semibold text-cyan-400 mb-1">
            Current State
          </h2>
          <p class="text-white">{universe.value.currentState}</p>
        </div>
      </header>

      <section>
        <h2 class="text-2xl font-bold text-white mb-4">
          Characters ({characters.value.length})
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          {characters.value.map((character) => (
            <div
              key={character.id}
              class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all"
            >
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-white">
                  {character.name}
                </h3>
                <div class="flex items-center gap-2">
                  <span
                    class={`w-2 h-2 rounded-full ${
                      AVAILABILITY_COLORS[character.availability]
                    }`}
                  >
                  </span>
                  <span class="text-xs text-gray-400">
                    {AVAILABILITY_TEXT[character.availability]}
                  </span>
                </div>
              </div>
              <p class="text-gray-300 text-sm mb-3">
                {character.description}
              </p>
              <div class="bg-white/5 rounded-lg p-3 mb-4">
                <p class="text-xs text-cyan-400 mb-1">Currently:</p>
                <p class="text-sm text-white">{character.currentState}</p>
              </div>
              {character.availability === "Available" && (
                <button
                  type="button"
                  onClick={() => startConversation(character.id)}
                  class="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Start Conversation
                </button>
              )}
              {character.availability === "NonAvailable" && (
                <div class="w-full bg-gray-500/20 text-gray-300 font-semibold py-2 px-4 rounded-lg text-center">
                  Not available
                  {character.availableUntil &&
                    ` until ${
                      new Date(character.availableUntil).toLocaleString()
                    }`}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
