# TALAE v0 – Specification

Talking Avatar in a Living Artificial Environment

Version : 0.1 Scope : MVP conceptuel + modèle de données + pipeline d’appel au
LLM

---

## 1. Objectif

TALAE est une application de chat où l’utilisateur discute avec un
**personnage** qui évolue dans un **univers fictif persistant**.

Propriétés clés :

- La conversation est **dialoguée** (on parle, on ne décrit pas d’actions à la
  3ᵉ personne).
- Le **personnage** vit dans un **univers** qui continue d’exister entre les
  messages (état global + mémoire du monde).
- Le personnage dispose d’une **mémoire personnelle** persistante et de
  l’**historique de conversation**.
- L’univers évolue via une fonction `evolveWorld` qui peut modifier l’état du
  monde et des personnages.
- Le temps est **1:1** avec le temps réel (pas de time model spécifique en v0).
- La disponibilité du personnage est gérée via une enum technique simple.

---

## 2. Modèle de données (conceptuel)

### 2.1. User

Un utilisateur possède plusieurs univers et plusieurs conversations.

```ts
type UserId = string;

type User = {
  id: UserId;
  // champs additionnels (auth, profil, etc.) hors scope de cette spec
  createdAt: Date;
  updatedAt: Date;
};
```

Relations :

- `User 1:N Universe`
- `User 1:N Conversation`

---

### 2.2. Universe

Un univers appartient à un utilisateur, contient un état actuel textuel, et une
liste d’entrées de mémoire (canon du monde).

```ts
type UniverseId = string;

type Universe = {
  id: UniverseId;
  userId: UserId;

  name: string;

  /**
   * Description statique de l’univers :
   * - tone (léger, sombre, etc.)
   * - genre (SF dure, cyberpunk, médiéval…)
   * - tech_level
   * - contraintes (pas de magie, etc.)
   * - lore de base (contexte politique, techno, menaces…)
   */
  description: string;

  /**
   * État actuel du monde, de haut niveau.
   * Exemple : "La guerre froide entre l’Alliance A et le Bloc B vient
   * de passer un cap après l’attentat sur la station K-17."
   */
  currentState: string;

  /**
   * Mémoire canon du monde : événements, changements géopolitiques, etc.
   * Utilisée par evolveWorld pour faire évoluer l’univers.
   */
  memories: UniverseMemoryEntry[];

  createdAt: Date;
  updatedAt: Date;
};
```

---

### 2.3. Character

Un personnage appartient à un univers. Il a un état courant textuel, une
disponibilité, et une mémoire personnelle.

```ts
type CharacterId = string;

type Availability =
  | { kind: "Available" }
  | { kind: "NonAvailable"; until: Date };

type Character = {
  id: CharacterId;
  universeId: UniverseId;

  name: string;

  /**
   * Description statique du personnage :
   * - rôle (espionne corporatiste, contrebandier, archiviste…)
   * - backstory (événements structurants de son passé)
   */
  description: string;

  /**
   * État courant diégétique :
   * Exemple : "En planque dans un bar miteux du niveau gamma, en train
   * d’observer les vas-et-viens des agents de sécurité."
   */
  currentState: string;

  /**
   * Disponibilité technique :
   * - Available : le perso est théoriquement joignable.
   * - NonAvailable(until) : indisponible jusqu’à une certaine date/heure
   *   (sommeil, mission, etc.). Le détail diégétique reste dans currentState.
   */
  availability: Availability;

  /**
   * Mémoire personnelle du personnage :
   * - ce qu’il sait sur lui-même
   * - ce qu’il sait sur l’utilisateur
   * - ce qu’il sait (ou croit savoir) sur le monde
   *
   * Contenu destiné à être injecté (full ou via RAG) dans le prompt de
   * génération de la réponse.
   */
  memories: CharacterMemoryEntry[];

  createdAt: Date;
  updatedAt: Date;
};
```

Relations :

- `Universe 1:N Character`
- `Character 1:N Conversation` (chaque perso peut avoir plusieurs conversations
  avec différents utilisateurs).

---

### 2.4. Conversation & Message

Une conversation lie un utilisateur et un personnage.

```ts
type ConversationId = string;
type MessageId = string;

type Conversation = {
  id: ConversationId;
  userId: UserId;
  characterId: CharacterId;

  createdAt: Date;
  updatedAt: Date; // dernière activité (user ou character)
};
```

```ts
type MessageAuthor = "user" | "character";

type Message = {
  id: MessageId;
  conversationId: ConversationId;
  author: MessageAuthor;
  content: string;
  createdAt: Date;
};
```

Relations :

- `Conversation 1:N Message`
- `User 1:N Conversation`
- `Character 1:N Conversation`

---

### 2.5. Mémoire (perso & monde)

Les mémoires sont des entrées textuelles, potentiellement indexées pour RAG.

```ts
type MemoryEntryId = string;

type BaseMemoryEntry = {
  id: MemoryEntryId;

  /**
   * Contenu textuel directement utilisable dans un prompt :
   * - "J’ai perdu ma sœur lors de l’attaque de la station K-17."
   * - "Étienne aime les IA mais reste méfiant vis-à-vis des corpos."
   */
  content: string;

  /**
   * Importance de cette entrée (0–1).
   * Sert à décider quels éléments injecter "en dur" dans le prompt.
   */
  salience: number;

  /**
   * Tags optionnels pour filtrage / clustering.
   */
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
};

type CharacterMemoryEntry = BaseMemoryEntry & {
  // champs extensibles plus tard (source, userId, etc.)
};

type UniverseMemoryEntry = BaseMemoryEntry & {
  // champs extensibles plus tard (scope, région, etc.)
};
```

Indexation possible (hors modélisation stricte) :

- Index sémantique sur les `Message` (par conversation) pour la **mémoire longue
  conversationnelle**.
- Index sémantique sur `CharacterMemoryEntry` et `UniverseMemoryEntry` pour du
  **RAG ciblé** quand nécessaire.

---

## 3. Modèle de temps

En v0 :

- Le temps est **1:1 avec le temps réel**.
- Il n’y a pas de factor de timewarp (pas de time_model spécifique).

Pour la logique métier :

- `elapsedMs` est calculé à partir de la dernière mise à jour pertinente :
  - soit `lastWorldUpdateAt` (si stocké),
  - soit `conversation.updatedAt` comme fallback.

Ce `elapsedMs` est passé à `evolveWorld` pour informer la simulation de la durée
écoulée depuis la dernière évolution.

---

## 4. Simulation du monde : `evolveWorld`

`evolveWorld` est la fonction qui fait évoluer l’univers et les personnages en
fonction du temps écoulé.

### 4.1. Signature conceptuelle

```ts
type WorldEvolutionContext = {
  universe: Universe;
  characters: Character[]; // au minimum le personnage associé à la conversation
  elapsedMs: number;
};

type WorldEvolutionResult = {
  universe: Universe;
  characters: Character[];
};
```

### 4.2. Rôle de `evolveWorld`

Entrée :

- `universe` : inclut `description`, `currentState`, `memories`.
- `characters` : inclut `currentState`, `availability`, `memories`.
- `elapsedMs` : durée écoulée depuis la dernière évolution.

Logique :

1. Construire un prompt pour le LLM avec :
   - `universe.description`
   - `universe.currentState`
   - une sélection de `universe.memories` :
     - entrées à forte salience
     -
       - éventuellement quelques entrées supplémentaires via RAG
   - pour chaque personnage concerné :
     - `character.description`
     - `character.currentState`
     - éventuellement quelques `character.memories` si utile pour la simulation
   - `elapsedMs` (ex : "Il s’est écoulé environ X heures / jours depuis la
     dernière étape.")

2. Demander au LLM de retourner une structure d’updates :
   - nouvelle valeur de `universe.currentState`
   - nouvelles entrées pour `universe.memories` (événements majeurs)
   - pour chaque personnage :
     - nouvelle valeur de `character.currentState`
     - nouvelles entrées pour `character.memories`
     - nouvelle valeur de `availability` (par exemple passer à `NonAvailable`
       pendant une mission)

3. Appliquer les updates :
   - `universe.currentState = newUniverseState`
   - `universe.memories.push(...newUniverseMemories)`
   - pour chaque `character` :
     - `character.currentState = newCharacterState`
     - `character.memories.push(...newCharacterMemories)`
     - `character.availability = newAvailability`

4. Retourner les versions mises à jour.

### 4.3. Règle importante : séparation monde / perso

- Le personnage **n’a pas accès directement** à `Universe.memories`.
- `Universe.memories` est utilisée uniquement par `evolveWorld`.
- Si un événement global doit devenir connu du personnage, `evolveWorld` doit :
  - créer une ou plusieurs `CharacterMemoryEntry` correspondantes,
  - par exemple : "J’ai reçu un rapport disant que la station K-17 a explosé
    hier."

---

## 5. Pipeline de traitement d’un message

Ce pipeline décrit ce qui se passe quand l’utilisateur envoie un message dans
une conversation.

### 5.1. Étapes

1. **Réception du message utilisateur**

   - Entrée : `conversationId`, `userMessageContent`.
   - Lecture de la `Conversation`, du `User`, du `Character` et de l’`Universe`
     associés.
   - Timestamp courant : `now`.

2. **Calcul du temps écoulé**

   - `elapsedMs = now - (lastWorldUpdateAt || conversation.updatedAt)`
   - `lastWorldUpdateAt` peut être stocké séparément ou inféré.

3. **Évolution du monde**

   - Construire un `WorldEvolutionContext` avec :
     - `universe`
     - `[character]`
     - `elapsedMs`
   - Appeler `evolveWorld(context)`.
   - Persister `universe` et `character` mis à jour.
   - Mettre à jour `lastWorldUpdateAt = now`.

4. **Gestion de la disponibilité**

   - Lire `character.availability` après la mise à jour.
   - Si `availability.kind === "NonAvailable"` et `now < availability.until` :
     - **v0 simple** :
       - enregistrer le message utilisateur (offline),
       - **ne pas appeler le LLM** pour une réponse du personnage,
       - retourner au client une indication technique :
         - `characterUnavailable: true`
         - `availableAgainAt: availability.until`
       - ces messages seront présents dans l’historique et pris en compte lors
         d’un prochain échange où le personnage sera `Available`.
   - Si `availability.kind === "Available"` ou `now >= availability.until` :
     - passer à l’étape suivante (génération de la réponse).

5. **Construction du contexte pour la réponse du personnage**

   Sources de contexte :

   - **Infos système / règles de style** (voir §6).
   - **Infos d’univers** :
     - `universe.description`
     - éventuellement un extrait de `universe.currentState` (décor global)
   - **Infos de personnage** :
     - `character.description`
     - `character.currentState`
   - **Mémoire courte conversationnelle** :
     - derniers N messages de `Message` pour cette conversation.
   - **Mémoire personnelle du personnage** :
     - top K `character.memories` par salience (injectés en dur),
     -
       - éventuellement quelques entrées supplémentaires via RAG sémantique si
         nécessaire.
   - **Mémoire longue conversationnelle** (optionnelle en v0) :
     - si besoin, faire une recherche sémantique dans tous les `Message` de la
       conversation pour des passages pertinents (RAG).

   Important :

   - La mémoire du monde (`universe.memories`) n’est **pas** injectée
     directement dans ce prompt.
   - Seules les informations qui ont été propagées au personnage via
     `character.memories` sont disponibles pour lui.

6. **Génération de la réponse**

   - Appel au LLM avec :
     - rôle système : règles du personnage + contraintes de style.
     - rôle assistant : ce personnage, dans cet univers, avec ce contexte.
     - rôle user : message utilisateur courant + historique pertinent.
   - Réception d’un `characterReplyContent`.

7. **Persistance**

   - Créer un `Message` pour l’utilisateur :
     ```ts
     {
       author: "user",
       content: userMessageContent,
       createdAt: now
     }
     ```
   - Créer un `Message` pour le personnage :
     ```ts
     {
       author: "character",
       content: characterReplyContent,
       createdAt: now
     }
     ```
   - Mettre à jour `conversation.updatedAt = now`.

8. **Retour au client**

   - Retourner le message du personnage,
   - plus les métadonnées utiles (disponibilité actuelle, etc.).

---

## 6. Contraintes de style pour le LLM (personnage)

Ces contraintes doivent être incluses dans le rôle système du LLM pour la
génération des réponses de personnage.

### 6.1. Narration et point de vue

- Le personnage **ne doit jamais** décrire ses propres actions à la 3ᵉ personne
  ou avec des balises d’action type RP :

  - Interdit :
    - `*Liora se lève et traverse le couloir*`
    - `Liora se lève et traverse le couloir.`

- Le personnage parle en **je / tu**, en mode conversation directe :

  - Autorisé :
    - `Je viens de traverser le couloir, j’ai une meilleure vue sur la baie maintenant.`
    - `J’étais avec Liora, elle s’est levée et a traversé le couloir, ça a mis tout le monde mal à l’aise.`

- La narration d’actions est toujours intégrée dans la parole du personnage, pas
  dans une méta-narration externe.

### 6.2. Métaniveau

- Le personnage doit rester **in-universe** :
  - Il ne doit pas dire qu’il est un modèle de langage, une IA de chat
    générique, etc.
- L’application peut afficher un message hors-diégèse du type :
  - “Ceci est un jeu de rôle, pas la réalité.”
  - mais ce message vient de l’UI, pas du personnage.

### 6.3. Conseil / relation à l’utilisateur

- Le personnage peut :
  - donner des conseils,
  - commenter l’état émotionnel apparent de l’utilisateur,
  - parler de la relation qu’il a avec lui (en se basant sur
    `character.memories`).
- Il reste cependant dans son rôle fictionnel (espion, pilote, archiviste, etc.)
  et s’exprime à partir de son contexte.

---

## 7. Mémoire – résumé des catégories

Pour clarifier :

1. **Mémoire courte conversationnelle** :
   - Les N derniers `Message` d’une `Conversation`.
   - Sert à maintenir le fil de la discussion en cours.

2. **Mémoire longue conversationnelle** :
   - Tous les `Message` d’une `Conversation` indexés sémantiquement.
   - Accès via RAG quand nécessaire (recherche ciblée dans l’historique).

3. **Mémoire personnelle du personnage** :
   - `Character.memories : CharacterMemoryEntry[]`.
   - Contient ce que le personnage sait/pense sur lui-même, sur l’utilisateur et
     sur le monde.
   - Alimentée à partir :
     - des conversations (promotions d’informations importantes),
     - de `evolveWorld` (événements appris, changements de situation).

4. **Mémoire du monde** :
   - `Universe.memories : UniverseMemoryEntry[]`.
   - Canon global de l’univers (événements, guerre, catastrophes, changements
     politiques).
   - Utilisée uniquement par `evolveWorld`.
   - Propage des éléments vers les personnages via création de
     `CharacterMemoryEntry`.

---

## 8. Hors scope v0 (mais compatibles)

Non inclus dans cette spec v0, mais la structure actuelle le permet :

- Factions, lieux structurés, timelines détaillées.
- Multiples personnages dans une même conversation.
- Time model non 1:1 (accéléré / ralenti).
- Typage plus fin de la mémoire (`source`, `scope`, `visibility`, etc.).
- Système de quêtes / arcs narratifs structurés.

---
