function normalizeAnswer(value) {
  if (typeof value !== "string") throw new Error("An answer must be a string.");
  return value.trim().toLowerCase();
}

function isCorrectAnswer(input, expected) {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

window.RobotSpellingLab.stringUtils = Object.freeze({ normalizeAnswer, isCorrectAnswer });
