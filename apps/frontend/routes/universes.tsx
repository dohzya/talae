import { define } from "../utils.ts";
import UniverseList from "../islands/UniverseList.tsx";

export default define.page(function Universes() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div class="max-w-6xl mx-auto">
        <header class="mb-8 pt-8">
          <a
            href="/"
            class="text-cyan-400 hover:text-cyan-300 mb-4 inline-block"
          >
            ← Back to Home
          </a>
          <h1 class="text-4xl font-bold text-white mb-2">Universes</h1>
          <p class="text-gray-300">
            Explore different fictional worlds and their characters
          </p>
        </header>

        <UniverseList />
      </div>
    </div>
  );
});
