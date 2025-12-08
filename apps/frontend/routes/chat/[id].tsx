import { define } from "../../utils.ts";
import ChatInterface from "../../islands/ChatInterface.tsx";

export default define.page(function ChatPage({ params }) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <ChatInterface conversationId={params.id} />
    </div>
  );
});
