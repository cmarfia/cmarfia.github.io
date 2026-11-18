const wordScramble = Object.freeze({
  id: "word-scramble",
  name: "Word Scramble",
  description: "Rebuild a word from shuffled letter tiles.",
  robotIds: ["professor", "helper"],

  create() {
    let context = null;
    let rounds = [];
    let roundIndex = 0;
    let started = false;
    let definition;
    let clueNumber;
    let availableTiles;
    let answerTiles;
    let answerFeedback;
    let answerForm;
    let clearButton;
    let gameContent;
    let completion;
    let tiles = [];
    let answerTileIds = [];

    return {
      initialize(nextContext) {
        context = nextContext;
        context.container.innerHTML = `
          <h2 class="word-scramble__title" id="word-scramble-title">Rebuild the word from its letters.</h2>
          <section class="word-scramble-game" aria-labelledby="word-scramble-title">
            <div class="word-scramble__robot" data-robot-slot aria-label="Spelling robot">
              <p class="robot__message" data-robot-message role="status" aria-live="polite"></p>
              <div class="robot-mount" data-robot-mount></div>
            </div>
            <div class="word-scramble__content" data-scramble-content>
              <p class="eyebrow" data-clue-number></p>
              <p class="word-scramble__definition" data-definition></p>
              <form class="word-scramble__form" data-answer-form>
                <div class="word-scramble__answer" data-answer-tiles role="group" aria-label="Your answer"></div>
                <div class="word-scramble__available" data-available-tiles role="group" aria-label="Available letter tiles"></div>
                <p class="word-scramble__feedback" data-answer-feedback aria-live="polite"></p>
                <div class="word-scramble__actions">
                  <button class="button game-control-button" type="button" data-clear-selection disabled>Clear selection</button>
                  <button class="button button--primary" type="submit">Check spelling</button>
                </div>
              </form>
            </div>
          </section>`;

        definition = context.container.querySelector("[data-definition]");
        clueNumber = context.container.querySelector("[data-clue-number]");
        availableTiles = context.container.querySelector("[data-available-tiles]");
        answerTiles = context.container.querySelector("[data-answer-tiles]");
        answerFeedback = context.container.querySelector("[data-answer-feedback]");
        answerForm = context.container.querySelector("[data-answer-form]");
        clearButton = context.container.querySelector("[data-clear-selection]");
        gameContent = context.container.querySelector("[data-scramble-content]");
        completion = context.container.parentElement.querySelector("[data-game-completion]");

        const robotId = context.robot.getSelectedRobotId();
        const robotSlot = context.container.querySelector("[data-robot-slot]");
        robotSlot.setAttribute("aria-label", context.robot.getSelectedRobotName());
        const message = context.robot.getMessageElement();
        message.classList.add(robotId === "helper" ? "robot__message--orange" : "robot__message--blue");
        context.container.querySelector("[data-robot-message]").replaceWith(message);
        context.container.addEventListener("click", handleClick);
        answerForm.addEventListener("submit", handleSubmit);
      },

      start() {
        if (!context) throw new Error("Initialize Word Scramble before starting it.");
        if (context.words.length === 0) throw new Error("Word Scramble needs at least one word.");
        rounds = context.utilities.array.shuffle(context.words);
        roundIndex = 0;
        started = true;
        showRound();
        context.robot.showMessage("greeting");
      },

      destroy() {
        if (!context) return;
        context.container.removeEventListener("click", handleClick);
        answerForm.removeEventListener("submit", handleSubmit);
        context.container.replaceChildren();
        context = null;
        rounds = [];
        tiles = [];
        answerTileIds = [];
        roundIndex = 0;
        started = false;
      }
    };

    function showRound() {
      const word = rounds[roundIndex];
      clueNumber.textContent = `Word ${roundIndex + 1} of ${rounds.length}`;
      definition.textContent = word.definition;
      tiles = context.utilities.array.shuffle([...word.word].map((character, index) => ({
        tileId: `${word.id}-tile-${index}`,
        character,
        used: false
      })));
      if (tiles.length > 1 && tiles.every((tile, index) => tile.tileId === `${word.id}-tile-${index}`)) {
        tiles.push(tiles.shift());
      }
      answerTileIds = [];
      answerFeedback.textContent = "Select the letters in the correct order.";
      answerFeedback.removeAttribute("data-tone");
      renderTiles();
      focusFirstAvailableTile();
    }

    function renderTiles() {
      const unused = tiles.filter(tile => !tile.used);
      const selected = answerTileIds.map(tileId => tiles.find(tile => tile.tileId === tileId));
      availableTiles.replaceChildren(...unused.map(tile => createTileButton(tile, "available")));
      answerTiles.replaceChildren(...selected.map(tile => createTileButton(tile, "selected")));
      clearButton.disabled = answerTileIds.length === 0;
    }

    function createTileButton(tile, placement) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `word-scramble__tile word-scramble__tile--${placement}`;
      button.dataset.tileId = tile.tileId;
      button.dataset.tileAction = placement === "available" ? "select" : "remove";
      button.textContent = tile.character;
      const tileNumber = tiles.indexOf(tile) + 1;
      button.setAttribute("aria-label", placement === "available"
        ? `Select letter ${tile.character}, tile ${tileNumber}`
        : `Remove letter ${tile.character} from your answer`);
      if (placement === "selected") button.title = "Select to remove this letter";
      return button;
    }

    function handleClick(event) {
      if (!started) return;
      if (event.target.closest("[data-clear-selection]")) {
        answerTileIds = [];
        tiles.forEach(tile => { tile.used = false; });
        answerFeedback.textContent = "Selection cleared. Choose the letters in order.";
        answerFeedback.removeAttribute("data-tone");
        renderTiles();
        focusFirstAvailableTile();
        return;
      }

      const tileButton = event.target.closest("[data-tile-id]");
      if (!tileButton || !context.container.contains(tileButton)) return;
      const tile = tiles.find(item => item.tileId === tileButton.dataset.tileId);
      if (tileButton.dataset.tileAction === "select" && !tile.used) {
        tile.used = true;
        answerTileIds.push(tile.tileId);
      } else if (tileButton.dataset.tileAction === "remove" && tile.used) {
        tile.used = false;
        answerTileIds.splice(answerTileIds.indexOf(tile.tileId), 1);
      }
      answerFeedback.textContent = "Select the letters in the correct order.";
      answerFeedback.removeAttribute("data-tone");
      renderTiles();
      focusFirstAvailableTile();
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (!started) return;
      const word = rounds[roundIndex];
      const answer = answerTileIds
        .map(tileId => tiles.find(tile => tile.tileId === tileId).character)
        .join("");

      if (context.utilities.string.isCorrectAnswer(answer, word.word)) {
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

      answerFeedback.textContent = "Not quite yet. Remove a tile or try another order.";
      answerFeedback.dataset.tone = "retry";
      context.robot.setExpression("curious");
      context.robot.showMessage("retry");
      context.robot.animate("think");
    }

    function focusFirstAvailableTile() {
      const tileButton = availableTiles.querySelector("[data-tile-id]");
      if (tileButton) tileButton.focus({ preventScroll: true });
      else answerForm.querySelector("button[type='submit']").focus({ preventScroll: true });
    }
  }
});

window.RobotSpellingLab.gameRegistry.registerGame(wordScramble);
