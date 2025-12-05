import { define } from "../../utils.ts";
import UniverseDetail from "../../islands/UniverseDetail.tsx";

export default define.page(function UniversePage({ params }) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <UniverseDetail universeId={params.id} />
    </div>
  );
});
