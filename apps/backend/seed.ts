import { loadEnvConfigOrThrow } from "@talae/core";
import { DenoKvAdapter } from "./adapters/persistence/mod.ts";
import type { CreateCharacter, CreateUniverse, CreateUser } from "@talae/core";

const config = loadEnvConfigOrThrow();

// Resolve database path relative to project root
const projectRoot = new URL("../../", import.meta.url).pathname;
const dbPath = config.DATABASE_PATH
  ? `${projectRoot}${config.DATABASE_PATH}`
  : undefined;

const db = await DenoKvAdapter.create(dbPath);

console.log("🌱 Seeding database...");

// Create a demo user
const demoUser: CreateUser = {
  name: "Demo User",
  email: "demo@talae.app",
};

const user = await db.createUser(demoUser);
console.log(`✓ Created user: ${user.name} (${user.id})`);

// Create universes
const medievalUniverse: CreateUniverse = {
  ownerId: user.id,
  name: "Medieval Kingdom",
  description:
    "A realm of knights, castles, and courtly intrigue in the age of chivalry.",
  currentState:
    "The kingdom is at peace after the recent dragon threat was neutralized. The annual harvest festival is approaching.",
};

const spaceUniverse: CreateUniverse = {
  ownerId: user.id,
  name: "Space Station Alpha",
  description:
    "A distant orbital station where humanity explores the final frontier.",
  currentState:
    "The station is operating normally. A supply ship is scheduled to arrive in 3 days. Research teams are analyzing samples from a recent asteroid survey.",
};

const forestUniverse: CreateUniverse = {
  ownerId: user.id,
  name: "Enchanted Forest",
  description:
    "A magical woodland inhabited by mythical creatures and ancient spirits.",
  currentState:
    "The forest is in autumn bloom, with magical energies flowing stronger than usual. The Great Tree has begun whispering ancient prophecies.",
};

const medieval = await db.createUniverse(medievalUniverse);
const space = await db.createUniverse(spaceUniverse);
const forest = await db.createUniverse(forestUniverse);

console.log(`✓ Created universe: ${medieval.name} (${medieval.id})`);
console.log(`✓ Created universe: ${space.name} (${space.id})`);
console.log(`✓ Created universe: ${forest.name} (${forest.id})`);

// Create characters for Medieval Kingdom
const medievalCharacters: CreateCharacter[] = [
  {
    universeId: medieval.id,
    name: "Sir Roland",
    description:
      "A veteran knight known for his honor and tactical brilliance. He served in the dragon wars and now trains the royal guard.",
    currentState: "Overseeing training exercises in the castle courtyard.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: medieval.id,
    name: "Lady Elara",
    description:
      "The court wizard and advisor to the king. She is versed in ancient magic and political intrigue.",
    currentState: "Studying scrolls in her tower library.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: medieval.id,
    name: "Gareth the Blacksmith",
    description:
      "A master craftsman who forges the finest weapons and armor in the realm. He has a jovial personality but takes his work seriously.",
    currentState: "Working on a new ceremonial sword for the festival.",
    availability: "Available",
    availableUntil: null,
  },
];

// Create characters for Space Station Alpha
const spaceCharacters: CreateCharacter[] = [
  {
    universeId: space.id,
    name: "Commander Chen",
    description:
      "The station commander with 20 years of space service. Pragmatic, decisive, and deeply cares about her crew.",
    currentState: "Reviewing supply manifests in the command center.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: space.id,
    name: "Dr. Yuki Tanaka",
    description:
      "Chief scientist specializing in astrobiology. Enthusiastic about discoveries but sometimes forgets social conventions.",
    currentState: "Analyzing mineral samples in the research lab.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: space.id,
    name: "Engineer Marcus Webb",
    description:
      "Head of station maintenance. Knows every pipe and wire on the station. Dry sense of humor.",
    currentState: "Running diagnostics on life support systems.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: space.id,
    name: "Pilot Sarah Kim",
    description:
      "Lead shuttle pilot for station operations. Adventurous spirit, excellent reflexes, tells great stories.",
    currentState: "Pre-flight checks on shuttle bay 2.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: space.id,
    name: "AI Assistant ARIA",
    description:
      "The station's artificial intelligence. Helpful, curious about humans, occasionally displays unexpected creativity.",
    currentState: "Monitoring station systems.",
    availability: "Available",
    availableUntil: null,
  },
];

// Create characters for Enchanted Forest
const forestCharacters: CreateCharacter[] = [
  {
    universeId: forest.id,
    name: "Thornwick the Dryad",
    description:
      "Ancient guardian of the forest, bound to the Great Tree. Wise but speaks in riddles and metaphors.",
    currentState: "Listening to the whispers of the Great Tree.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: forest.id,
    name: "Pip the Pixie",
    description:
      "Mischievous but good-hearted forest sprite. Loves pranks, gossip, and shiny objects.",
    currentState: "Dancing among the autumn leaves.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: forest.id,
    name: "Moonshadow",
    description:
      "A mystical wolf who can speak. Noble, protective of the forest, and sees into the hearts of visitors.",
    currentState: "Patrolling the forest paths.",
    availability: "Available",
    availableUntil: null,
  },
  {
    universeId: forest.id,
    name: "Elder Willow",
    description:
      "The oldest tree spirit in the forest. Speaks slowly and rarely, but her words carry great weight.",
    currentState: "Resting at the heart of the forest.",
    availability: "Available",
    availableUntil: null,
  },
];

// Create all characters
for (const char of medievalCharacters) {
  const created = await db.createCharacter(char);
  console.log(`  ✓ Created character: ${created.name}`);
}

for (const char of spaceCharacters) {
  const created = await db.createCharacter(char);
  console.log(`  ✓ Created character: ${created.name}`);
}

for (const char of forestCharacters) {
  const created = await db.createCharacter(char);
  console.log(`  ✓ Created character: ${created.name}`);
}

console.log("\n🎉 Database seeded successfully!");
console.log(`\nYou can now:\n- Visit http://localhost:5173/universes`);
console.log(`- Select "${space.name}" to start chatting`);

Deno.exit(0);
