import { define } from "../utils.ts";

export default define.page(function Home() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div class="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-white">
        <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          TALAE
        </h1>
        <p class="text-xl mb-8 text-gray-200">
          Talking Avatar in a Living Artificial Environment
        </p>

        <div class="space-y-6">
          <div class="bg-white/5 rounded-xl p-6 border border-white/20">
            <h2 class="text-2xl font-semibold mb-3">What is TALAE?</h2>
            <p class="text-gray-300">
              TALAE is a chat application where you converse with characters
              living in persistent fictional universes. Each character has their
              own memories, personality, and availability, and the world evolves
              over time.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white/5 rounded-xl p-5 border border-white/20">
              <h3 class="text-lg font-semibold mb-2">
                🌍 Persistent Universes
              </h3>
              <p class="text-sm text-gray-300">
                Each universe has its own state that evolves independently
                between conversations.
              </p>
            </div>

            <div class="bg-white/5 rounded-xl p-5 border border-white/20">
              <h3 class="text-lg font-semibold mb-2">💭 Character Memory</h3>
              <p class="text-sm text-gray-300">
                Characters remember past interactions and have their own
                knowledge and perspectives.
              </p>
            </div>

            <div class="bg-white/5 rounded-xl p-5 border border-white/20">
              <h3 class="text-lg font-semibold mb-2">
                ⏱️ Real-Time Experience
              </h3>
              <p class="text-sm text-gray-300">
                Time flows naturally in the universe, with characters having
                their own availability.
              </p>
            </div>

            <div class="bg-white/5 rounded-xl p-5 border border-white/20">
              <h3 class="text-lg font-semibold mb-2">
                💬 Dialogued Conversations
              </h3>
              <p class="text-sm text-gray-300">
                Characters speak directly to you in first-person, creating
                immersive conversations.
              </p>
            </div>
          </div>

          <div class="pt-4">
            <a
              href="/universes"
              class="inline-block bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Explore Universes →
            </a>
          </div>
        </div>

        <footer class="mt-12 pt-6 border-t border-white/20 text-center text-gray-400 text-sm">
          <p>
            Backend API:{" "}
            <a
              href="http://localhost:8000"
              class="text-cyan-400 hover:text-cyan-300"
            >
              http://localhost:8000
            </a>
          </p>
          <p class="mt-2">Built with Fresh 2 & Hono</p>
        </footer>
      </div>
    </div>
  );
});
