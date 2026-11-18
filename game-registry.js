const gameDefinitions = new Map();

function registerGame(definition) {
  validateDefinition(definition);
  if (gameDefinitions.has(definition.id)) {
    throw new Error(`A game is already registered with ID ${definition.id}.`);
  }
  gameDefinitions.set(definition.id, Object.freeze({ ...definition }));
}

function getGame(gameId) {
  const definition = gameDefinitions.get(gameId);
  if (!definition) throw new Error(`Unknown game: ${gameId}`);
  return definition;
}

function getGames() {
  return [...gameDefinitions.values()].map(({ id, name, description }) => ({
    id,
    name,
    description
  }));
}

function validateDefinition(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("A game definition must be an object.");
  }
  for (const field of ["id", "name", "description"]) {
    if (typeof definition[field] !== "string" || !definition[field].trim()) {
      throw new Error(`A game definition needs a non-empty ${field}.`);
    }
  }
  if (typeof definition.create !== "function") {
    throw new Error(`Game ${definition.id} must provide a create() function.`);
  }
  if (!Array.isArray(definition.robotIds) || definition.robotIds.length === 0) {
    throw new Error(`Game ${definition.id} must list at least one robot ID.`);
  }
  if (new Set(definition.robotIds).size !== definition.robotIds.length) {
    throw new Error(`Game ${definition.id} must list unique robot IDs.`);
  }
}

window.RobotSpellingLab.gameRegistry = Object.freeze({
  registerGame,
  getGame,
  getGames
});
