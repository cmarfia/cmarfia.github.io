const wordDetective = Object.freeze({
  id: "word-detective",
  name: "Word Detective",
  description: "Solve a definition clue.",
  robotIds: ["professor"],

  create() {
    let context = null;
    let rounds = [];
    let roundIndex = 0;
    let started = false;
    let clueNumber;
    let definition;
    let prompt;
    let choices;
    let gameContent;
    let completion;

    return {
      initialize(nextContext) {
        context = nextContext;
        context.container.innerHTML = `
          <section class="detective-game" aria-labelledby="detective-title">
            <div class="detective-game__robot" data-robot-slot="professor" aria-label="Professor Bot">
              <p class="robot__message robot__message--blue" data-robot-message="professor" role="status" aria-live="polite"></p>
              <div class="robot-mount" data-robot-mount="professor"></div>
            </div>
            <div class="detective-game__content" data-detective-content>
              <p class="eyebrow" data-clue-number></p>
              <h2 id="detective-title">Which word matches this meaning?</h2>
              <p class="detective-game__definition" data-definition></p>
              <div class="detective-game__choices" data-answer-choices role="group" aria-label="Word choices"></div>
              <p class="detective-game__prompt" data-question-prompt aria-live="polite"></p>
            </div>
          </section>`;
        clueNumber = context.container.querySelector("[data-clue-number]");
        definition = context.container.querySelector("[data-definition]");
        prompt = context.container.querySelector("[data-question-prompt]");
        choices = context.container.querySelector("[data-answer-choices]");
        gameContent = context.container.querySelector("[data-detective-content]");
        completion = context.container.parentElement.querySelector("[data-game-completion]");
        context.container.querySelectorAll("[data-robot-message]").forEach(message => {
          message.replaceWith(context.robot.getMessageElement(message.dataset.robotMessage));
        });
        context.container.addEventListener("click", handleClick);
      },

      start() {
        if (!context) throw new Error("Initialize Word Detective before starting it.");
        if (context.words.length === 0) throw new Error("Word Detective needs at least one word.");
        rounds = context.utilities.array.shuffle(context.words);
        roundIndex = 0;
        started = true;
        showRound();
        context.robot.showMessage("greeting", { robotId: "professor" });
      },

      destroy() {
        if (!context) return;
        context.container.removeEventListener("click", handleClick);
        context.container.replaceChildren();
        context = null;
        rounds = [];
        roundIndex = 0;
        started = false;
      }
    };

    function showRound() {
      const answer = rounds[roundIndex];
      clueNumber.textContent = `Clue ${roundIndex + 1} of ${rounds.length}`;
      definition.textContent = answer.definition;
      prompt.textContent = "Choose the word that fits the clue.";
      choices.replaceChildren(...createChoices(answer));
      choices.querySelector("button").focus({ preventScroll: true });
    }

    function createChoices(answer) {
      const normalize = context.utilities.string.normalizeAnswer;
      const seen = new Set([normalize(answer.word)]);
      const distractors = context.words.filter(word => {
        const key = normalize(word.word);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const selected = context.utilities.array.sample(distractors, Math.min(3, distractors.length));
      const options = context.utilities.array.shuffle([answer, ...selected]);
      return options.map(word => {
        const button = document.createElement("button");
        button.className = "detective-choice";
        button.type = "button";
        button.dataset.answerId = word.id;
        button.textContent = word.word;
        return button;
      });
    }

    function handleClick(event) {
      if (!started) return;
      const choice = event.target.closest("[data-answer-id]");
      if (!choice || !choices.contains(choice)) return;
      const answer = rounds[roundIndex];
      if (choice.dataset.answerId !== answer.id) {
        choice.classList.add("detective-choice--eliminated");
        choice.disabled = true;
        choice.setAttribute("aria-label", `${choice.textContent}, eliminated. Try another choice.`);
        prompt.textContent = `${choice.textContent} is not the answer. Choose another word.`;
        context.robot.setExpression("curious", { robotId: "professor" });
        context.robot.animate("think", { robotId: "professor" });
        choices.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
        return;
      }

      choices.querySelectorAll("button").forEach(button => { button.disabled = true; });
      context.callbacks.onQuestionComplete(answer);
      context.robot.showMessage("celebrate", { robotId: "professor" });
      context.robot.animate("celebrate", { robotId: "professor" });
      roundIndex += 1;
      if (roundIndex === rounds.length) {
        gameContent.replaceWith(completion);
        return;
      }
      showRound();
    }
  }
});

window.RobotSpellingLab.gameRegistry.registerGame(wordDetective);
