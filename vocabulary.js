let sourceData = null;

async function loadVocabulary() {
  const response = await fetch("./vocabulary.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Vocabulary request failed with status ${response.status}.`);
  }

  const candidate = await response.json();
  validateVocabulary(candidate);
  sourceData = candidate;
}

function getLists() {
  requireLoaded();
  return sourceData.lists.map(list => ({
    id: list.id,
    title: list.title,
    wordCount: list.words.length
  }));
}

function getListById(listId) {
  requireLoaded();
  const list = sourceData.lists.find(item => item.id === listId);
  if (!list) throw new Error(`Unknown vocabulary list: ${listId}`);
  return { id: list.id, title: list.title, wordCount: list.words.length };
}

function copyWords(listId) {
  requireLoaded();
  const list = sourceData.lists.find(item => item.id === listId);
  if (!list) throw new Error(`Unknown vocabulary list: ${listId}`);
  return list.words.map(word => ({
    id: word.id,
    word: word.word,
    definition: word.definition
  }));
}

function validateVocabulary(data) {
  assert(isRecord(data), "The vocabulary root must be an object.");
  assert(data.version === 1, "The vocabulary version must be 1.");
  assert(Array.isArray(data.lists), "The vocabulary lists field must be an array.");

  const listIds = new Set();
  for (const list of data.lists) {
    assert(isRecord(list), "Each vocabulary list must be an object.");
    assertNonEmptyString(list.id, "Every list needs a non-empty ID.");
    assert(!listIds.has(list.id), `Duplicate list ID: ${list.id}`);
    listIds.add(list.id);
    assertNonEmptyString(list.title, `List ${list.id} needs a title.`);
    assert(Array.isArray(list.words), `List ${list.id} needs a words array.`);

    const wordIds = new Set();
    for (const word of list.words) {
      assert(isRecord(word), `Every word in list ${list.id} must be an object.`);
      assertNonEmptyString(word.id, `Every word in list ${list.id} needs an ID.`);
      assert(!wordIds.has(word.id), `Duplicate word ID ${word.id} in list ${list.id}.`);
      wordIds.add(word.id);
      assertNonEmptyString(word.word, `Word ${word.id} needs a spelling.`);
      assertNonEmptyString(word.definition, `Word ${word.id} needs a definition.`);
    }
  }
}

function requireLoaded() {
  if (sourceData === null) throw new Error("Vocabulary has not been loaded.");
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertNonEmptyString(value, message) {
  assert(typeof value === "string" && value.trim().length > 0, message);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

window.RobotSpellingLab.vocabulary = Object.freeze({
  loadVocabulary,
  getLists,
  getListById,
  copyWords
});
