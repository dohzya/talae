import { define } from "../utils.ts";

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

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all">
            <div class="text-4xl mb-4">🏰</div>
            <h2 class="text-xl font-bold text-white mb-2">Medieval Kingdom</h2>
            <p class="text-gray-300 text-sm mb-4">
              A realm of knights, castles, and courtly intrigue in the age of
              chivalry.
            </p>
            <div class="flex items-center text-sm text-gray-400">
              <span>3 characters available</span>
            </div>
            <button
              type="button"
              class="mt-4 w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Enter Universe
            </button>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all">
            <div class="text-4xl mb-4">🚀</div>
            <h2 class="text-xl font-bold text-white mb-2">
              Space Station Alpha
            </h2>
            <p class="text-gray-300 text-sm mb-4">
              A distant orbital station where humanity explores the final
              frontier.
            </p>
            <div class="flex items-center text-sm text-gray-400">
              <span>5 characters available</span>
            </div>
            <button
              type="button"
              class="mt-4 w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Enter Universe
            </button>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all">
            <div class="text-4xl mb-4">🌿</div>
            <h2 class="text-xl font-bold text-white mb-2">Enchanted Forest</h2>
            <p class="text-gray-300 text-sm mb-4">
              A magical woodland inhabited by mythical creatures and ancient
              spirits.
            </p>
            <div class="flex items-center text-sm text-gray-400">
              <span>4 characters available</span>
            </div>
            <button
              type="button"
              class="mt-4 w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Enter Universe
            </button>
          </div>

          <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-dashed border-white/30 hover:border-cyan-400/50 transition-all flex items-center justify-center cursor-pointer">
            <div class="text-center">
              <div class="text-4xl mb-2">➕</div>
              <p class="text-white font-semibold">Create New Universe</p>
              <p class="text-gray-400 text-sm mt-1">Design your own world</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
