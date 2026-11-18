const dialogue = Object.freeze({
  greeting: ["Ready to learn?", "Let's explore some words!"],
  encouragement: ["You've got this!", "Every try helps you learn."],
  thinking: ["Ooh, let's think it through!", "Hmm, I have an idea!"],
  celebrate: ["You did it! Woo-hoo!", "Awesome job, word wizard!"],
  retry: ["Good try. Let's look again!", "Keep going. You're learning!"]
});

const nextMessage = new Map();

function getDialogue(category) {
  const messages = dialogue[category];
  if (!messages) throw new Error(`Unknown robot dialogue category: ${category}`);
  const index = nextMessage.get(category) ?? 0;
  nextMessage.set(category, (index + 1) % messages.length);
  return messages[index];
}

window.RobotSpellingLab.robotDialogue = Object.freeze({ getDialogue });
