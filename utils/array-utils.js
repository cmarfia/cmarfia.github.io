function shuffle(items) {
  requireArray(items);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sample(items, count) {
  requireArray(items);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("Sample count must be a non-negative integer.");
  }
  return shuffle(items).slice(0, count);
}

function requireArray(items) {
  if (!Array.isArray(items)) throw new Error("Expected an array.");
}

window.RobotSpellingLab.arrayUtils = Object.freeze({ shuffle, sample });
