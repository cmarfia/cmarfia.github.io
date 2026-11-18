const missingLettersGame = Object.freeze({
  id: "missing-letters",
  name: "Missing Letters",
  description: "Complete each word one letter at a time.",
  robotIds: ["professor", "helper"],

  create() {
    let context = null;
    let rounds = [];
    let roundIndex = 0;
    let started = false;
    let wordDisplay;
    let definition;
    let clueNumber;
    let feedback;
    let answerForm;
    let gameContent;
    let completion;
    let missingPositions = [];

    return {
      initialize(nextContext) {
        context = nextContext;
        context.container.innerHTML = `
          <h2 class="missing-letters__title" id="missing-letters-title">Fill in the missing letters.</h2>
          <section class="missing-letters-game" aria-labelledby="missing-letters-title">
            <div class="missing-letters__robot" data-robot-slot aria-label="Spelling robot">
              <p class="robot__message" data-robot-message role="status" aria-live="polite"></p>
              <div class="robot-mount" data-robot-mount></div>
            </div>
            <div class="missing-letters__content" data-missing-content>
              <p class="eyebrow" data-clue-number></p>
              <p class="missing-letters__definition" data-definition></p>
              <form class="missing-letters__form" data-answer-form>
                <div class="missing-letters__word" data-word-display aria-label="Word with missing letters"></div>
                <p class="missing-letters__feedback" data-answer-feedback aria-live="polite"></p>
                <button class="button button--primary" type="submit">Check letters</button>
              </form>
            </div>
          </section>`;

        wordDisplay = context.container.querySelector("[data-word-display]");
        definition = context.container.querySelector("[data-definition]");
        clueNumber = context.container.querySelector("[data-clue-number]");
        feedback = context.container.querySelector("[data-answer-feedback]");
        answerForm = context.container.querySelector("[data-answer-form]");
        gameContent = context.container.querySelector("[data-missing-content]");
        completion = context.container.parentElement.querySelector("[data-game-completion]");

        const robotId = context.robot.getSelectedRobotId();
        const robotSlot = context.container.querySelector("[data-robot-slot]");
        robotSlot.setAttribute("aria-label", context.robot.getSelectedRobotName());
        const message = context.robot.getMessageElement();
        message.classList.add(robotId === "helper" ? "robot__message--orange" : "robot__message--blue");
        context.container.querySelector("[data-robot-message]").replaceWith(message);
        answerForm.addEventListener("submit", handleSubmit);
        context.container.addEventListener("input", handleInput);
      },

      start() {
        if (!context) throw new Error("Initialize Missing Letters before starting it.");
        if (context.words.length === 0) throw new Error("Missing Letters needs at least one word.");
        rounds = context.utilities.array.shuffle(context.words);
        roundIndex = 0;
        started = true;
        showRound();
        context.robot.showMessage("greeting");
      },

      destroy() {
        if (!context) return;
        answerForm.removeEventListener("submit", handleSubmit);
        context.container.removeEventListener("input", handleInput);
        context.container.replaceChildren();
        context = null;
        rounds = [];
        missingPositions = [];
        roundIndex = 0;
        started = false;
      }
    };

    function showRound() {
      const word = rounds[roundIndex];
      const characters = [...word.word];
      const eligible = characters
        .map((character, index) => ({ character, index }))
        .filter(item => /\p{L}/u.test(item.character));
      const maxHidden = Math.max(0, eligible.length - 1);
      const desiredCount = eligible.length === 1
        ? 0
        : Math.min(maxHidden, Math.max(1, Math.round(eligible.length * 0.3)));
      missingPositions = context.utilities.array.sample(eligible, desiredCount)
        .map(item => item.index)
        .sort((a, b) => a - b);

      clueNumber.textContent = `Word ${roundIndex + 1} of ${rounds.length}`;
      definition.textContent = word.definition;
      feedback.textContent = missingPositions.length === 0
        ? "This word has no letters to uncover. Select Continue."
        : "Fill each blank in the correct order.";
      wordDisplay.replaceChildren(...characters.map((character, index) => {
        if (!missingPositions.includes(index)) {
          const visibleLetter = document.createElement("span");
          visibleLetter.className = "missing-letters__visible-letter";
          visibleLetter.textContent = character;
          visibleLetter.setAttribute("aria-hidden", "true");
          return visibleLetter;
        }
        return createMissingInput(index, missingPositions.indexOf(index), missingPositions.length);
      }));
      answerForm.querySelector("button[type='submit']").textContent = missingPositions.length === 0
        ? "Continue"
        : "Check letters";
      const firstInput = wordDisplay.querySelector("[data-missing-index]");
      if (firstInput) firstInput.focus({ preventScroll: true });
      else answerForm.querySelector("button[type='submit']").focus({ preventScroll: true });
    }

    function createMissingInput(position, inputIndex, totalInputs) {
      const input = document.createElement("input");
      input.className = "missing-letters__input";
      input.type = "text";
      input.inputMode = "text";
      input.placeholder = "_";
      input.autocomplete = "off";
      input.autocapitalize = "none";
      input.spellcheck = false;
      input.maxLength = 2;
      input.dataset.missingIndex = String(position);
      input.setAttribute("aria-label", `Missing letter ${inputIndex + 1} of ${totalInputs}`);
      input.setAttribute("aria-invalid", "false");
      return input;
    }

    function handleInput(event) {
      const input = event.target.closest("[data-missing-index]");
      if (!input || !wordDisplay.contains(input)) return;
      input.value = [...input.value.trim()].slice(0, 1).join("");
      input.classList.remove("missing-letters__input--wrong");
      input.setAttribute("aria-invalid", "false");
      feedback.textContent = "Fill each blank in the correct order.";
      if (input.value) {
        const inputs = [...wordDisplay.querySelectorAll("[data-missing-index]")];
        inputs[inputs.indexOf(input) + 1]?.focus({ preventScroll: true });
      }
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (!started) return;
      const word = rounds[roundIndex];
      const inputs = [...wordDisplay.querySelectorAll("[data-missing-index]")];
      const characters = [...word.word];
      const incorrectInputs = inputs.filter(input => {
        const position = Number(input.dataset.missingIndex);
        return context.utilities.string.normalizeAnswer(input.value) !==
          context.utilities.string.normalizeAnswer(characters[position]);
      });

      if (incorrectInputs.length > 0) {
        inputs.forEach(input => {
          const isWrong = incorrectInputs.includes(input);
          input.classList.toggle("missing-letters__input--wrong", isWrong);
          input.setAttribute("aria-invalid", String(isWrong));
        });
        feedback.textContent = "Not quite yet. Check the highlighted letters and try again.";
        context.robot.setExpression("curious");
        context.robot.showMessage("retry");
        context.robot.animate("think");
        incorrectInputs[0].focus({ preventScroll: true });
        return;
      }

      context.robot.showMessage("celebrate");
      context.robot.animate("celebrate");
      context.callbacks.onQuestionComplete(word);
      roundIndex += 1;
      if (roundIndex === rounds.length) {
        gameContent.replaceWith(completion);
        return;
      }
      showRound();
    }
  }
});

window.RobotSpellingLab.gameRegistry.registerGame(missingLettersGame);
