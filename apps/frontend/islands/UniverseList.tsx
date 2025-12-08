import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { BACKEND_URL } from "../config.ts";

interface Universe {
  id: string;
  name: string;
  description: string;
  currentState: string;
}

interface UniverseWithCount extends Universe {
  characterCount: number;
}

const EMOJI_MAP: Record<string, string> = {
  "Medieval Kingdom": "🏰",
  "Space Station Alpha": "🚀",
  "Enchanted Forest": "🌿",
};

export default function UniverseList() {
  const universes = useSignal<UniverseWithCount[]>([]);
  const loading = useSignal(true);

  useEffect(() => {
    async function loadUniverses() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/universes`);
        if (!response.ok) {
          console.error("Failed to fetch universes");
          loading.value = false;
          return;
        }

        const data: Universe[] = await response.json();

        const withCounts = await Promise.all(
          data.map(async (universe) => {
            const charResponse = await fetch(
              `${BACKEND_URL}/api/universe/${universe.id}/characters`,
            );
            const characters = charResponse.ok ? await charResponse.json() : [];

            return {
              ...universe,
              characterCount: characters.length,
            };
          }),
        );

        universes.value = withCounts;
      } catch (error) {
        console.error("Error loading universes:", error);
      } finally {
        loading.value = false;
      }
    }

    loadUniverses();
  }, []);

  if (loading.value) {
    return (
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400">
        </div>
        <p class="mt-4 text-gray-300">Loading universes...</p>
      </div>
    );
  }

  return (
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {universes.value.map((universe) => (
        <div
          key={universe.id}
          class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all"
        >
          <div class="text-4xl mb-4">
            {EMOJI_MAP[universe.name] || "🌍"}
          </div>
          <h2 class="text-xl font-bold text-white mb-2">
            {universe.name}
          </h2>
          <p class="text-gray-300 text-sm mb-4">
            {universe.description}
          </p>
          <div class="flex items-center text-sm text-gray-400">
            <span>
              {universe.characterCount}{" "}
              character{universe.characterCount !== 1 &&
                "s"} available
            </span>
          </div>
          <a
            href={`/universe/${universe.id}`}
            class="mt-4 block w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-center"
          >
            Enter Universe
          </a>
        </div>
      ))}

      <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-dashed border-white/30 hover:border-cyan-400/50 transition-all flex items-center justify-center cursor-pointer">
        <div class="text-center">
          <div class="text-4xl mb-2">➕</div>
          <p class="text-white font-semibold">Create New Universe</p>
          <p class="text-gray-400 text-sm mt-1">Design your own world</p>
        </div>
      </div>
    </div>
  );
}
