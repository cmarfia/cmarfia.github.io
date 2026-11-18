const wordTyping = Object.freeze({
  id: "word-typing",
  name: "Word Typing",
  description: "Spell a word from its definition.",
  robotIds: ["professor", "helper"],

  create() {
    let context = null;
    let rounds = [];
    let roundIndex = 0;
    let started = false;
    let clueNumber;
    let definition;
    let answerInput;
    let answerBox;
    let characterLimit = 0;
    let lastAcceptedAnswer = "";
    let answerTooLong = false;
    let letterSlots;
    let answerFeedback;
    let answerForm;
    let gameContent;
    let completion;

    return {
      initialize(nextContext) {
        context = nextContext;
        context.container.innerHTML = `
          <h2 class="typing-game__title" id="typing-title">Type the word that matches this meaning.</h2>
          <section class="typing-game" aria-labelledby="typing-title">
            <div class="typing-game__robot" data-robot-slot aria-label="Spelling robot">
              <p class="robot__message" data-robot-message role="status" aria-live="polite"></p>
              <div class="robot-mount" data-robot-mount></div>
            </div>
            <div class="typing-game__content" data-typing-content>
              <p class="eyebrow" data-clue-number></p>
              <p class="typing-game__definition" data-definition></p>
              <form class="typing-game__form" data-answer-form>
                <label for="typing-answer">Your spelling</label>
                <div class="typing-game__answer-box" data-answer-box>
                  <div class="typing-game__letter-slots" data-letter-slots aria-hidden="true"></div>
                  <input id="typing-answer" name="answer" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="typing-feedback" data-answer-input>
                </div>
                <button class="button button--primary" type="submit">Check spelling</button>
              </form>
              <p class="typing-game__feedback" id="typing-feedback" data-answer-feedback aria-live="polite"></p>
            </div>
          </section>`;

        clueNumber = context.container.querySelector("[data-clue-number]");
        definition = context.container.querySelector("[data-definition]");
        answerInput = context.container.querySelector("[data-answer-input]");
        answerBox = context.container.querySelector("[data-answer-box]");
        letterSlots = context.container.querySelector("[data-letter-slots]");
        answerFeedback = context.container.querySelector("[data-answer-feedback]");
        answerForm = context.container.querySelector("[data-answer-form]");
        gameContent = context.container.querySelector("[data-typing-content]");
        completion = context.container.parentElement.querySelector("[data-game-completion]");

        const robotId = context.robot.getSelectedRobotId();
        const robotSlot = context.container.querySelector("[data-robot-slot]");
        robotSlot.setAttribute("aria-label", context.robot.getSelectedRobotName());
        const message = context.robot.getMessageElement();
        message.classList.add(robotId === "helper" ? "robot__message--orange" : "robot__message--blue");
        context.container.querySelector("[data-robot-message]").replaceWith(message);
        answerForm.addEventListener("submit", handleSubmit);
        answerInput.addEventListener("input", renderLetterSlots);
      },

      start() {
        if (!context) throw new Error("Initialize Word Typing before starting it.");
        if (context.words.length === 0) throw new Error("Word Typing needs at least one word.");
        rounds = context.utilities.array.shuffle(context.words);
        roundIndex = 0;
        started = true;
        showRound();
        context.robot.showMessage("greeting");
      },

      destroy() {
        if (!context) return;
        answerForm.removeEventListener("submit", handleSubmit);
        answerInput.removeEventListener("input", renderLetterSlots);
        context.container.replaceChildren();
        context = null;
        rounds = [];
        roundIndex = 0;
        started = false;
      }
    };

    function showRound() {
      const word = rounds[roundIndex];
      clueNumber.textContent = `Clue ${roundIndex + 1} of ${rounds.length}`;
      definition.textContent = word.definition;
      characterLimit = [...word.word].length;
      answerInput.value = "";
      lastAcceptedAnswer = "";
      answerTooLong = false;
      answerBox.classList.remove("typing-game__answer-box--wrong");
      renderLetterSlots();
      answerInput.disabled = false;
      answerForm.querySelector("button[type='submit']").disabled = false;
      answerFeedback.textContent = "Type your answer and press Enter.";
      answerInput.focus({ preventScroll: true });
    }

    function renderLetterSlots() {
      const letters = [...answerInput.value.trim()];
      if (letters.length > characterLimit) {
        answerInput.value = lastAcceptedAnswer;
        answerTooLong = true;
        answerFeedback.textContent = `Answers are limited to ${characterLimit} characters.`;
        answerInput.setSelectionRange(answerInput.value.length, answerInput.value.length);
        return;
      }
      answerTooLong = false;
      lastAcceptedAnswer = answerInput.value;
      answerFeedback.textContent = "Type your answer and press Enter.";
      const slotCount = characterLimit;
      letterSlots.replaceChildren(...Array.from({ length: slotCount }, (_, index) => {
        const slot = document.createElement("span");
        slot.className = "typing-game__letter-slot";
        slot.textContent = letters[index] || "_";
        return slot;
      }));
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (!started) return;
      const word = rounds[roundIndex];
      if (!answerTooLong && context.utilities.string.isCorrectAnswer(answerInput.value, word.word)) {
        answerBox.classList.remove("typing-game__answer-box--wrong");
        answerInput.disabled = true;
        answerForm.querySelector("button[type='submit']").disabled = true;
        answerFeedback.textContent = "Correct! Well done.";
        context.robot.showMessage("celebrate");
        context.robot.animate("celebrate");
        context.callbacks.onQuestionComplete(word);
        roundIndex += 1;
        if (roundIndex === rounds.length) {
          gameContent.replaceWith(completion);
          return;
        }
        showRound();
        return;
      }

      const hasAnswer = Boolean(answerInput.value.trim());
      answerBox.classList.toggle("typing-game__answer-box--wrong", hasAnswer);
      answerFeedback.textContent = answerTooLong
        ? `That answer is too long. Try again with up to ${characterLimit} characters.`
        : hasAnswer
          ? "Not quite yet. Check the spelling and try again."
          : "Type an answer before checking it.";
      context.robot.setExpression("curious");
      context.robot.showMessage("retry");
      context.robot.animate("think");
      answerInput.focus({ preventScroll: true });
      answerInput.setSelectionRange(answerInput.value.length, answerInput.value.length);
    }
  }
});

window.RobotSpellingLab.gameRegistry.registerGame(wordTyping);
