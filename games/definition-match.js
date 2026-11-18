const definitionMatch = Object.freeze({
  id: "definition-match",
  name: "Definition Match",
  description: "Match each word to its meaning.",
  robotIds: ["professor", "helper"],

  create() {
    let context = null;
    let words = [];
    let definitions = [];
    let matchedIds = new Set();
    let selectedWordId = null;
    let retryWordId = null;
    let retryDefinitionId = null;
    let started = false;
    let wordChoices;
    let definitionChoices;
    let choiceColumns;
    let connectorSvg;
    let resizeObserver;
    let prompt;
    let gameContent;
    let completion;

    return {
      initialize(nextContext) {
        context = nextContext;
        context.container.innerHTML = `
          <h2 class="definition-match__title" id="definition-match-title">Connect each word to its meaning.</h2>
          <section class="definition-match-game" aria-labelledby="definition-match-title">
            <div class="definition-match__robot" data-robot-slot aria-label="Spelling robot">
              <p class="robot__message" data-robot-message role="status" aria-live="polite"></p>
              <div class="robot-mount" data-robot-mount></div>
            </div>
            <div class="definition-match__content" data-match-content>
              <p class="definition-match__prompt" data-match-prompt aria-live="polite"></p>
              <div class="definition-match__columns" data-match-columns>
                <svg class="definition-match__connectors" data-match-connectors aria-hidden="true"></svg>
                <div class="definition-match__list" data-word-choices role="group" aria-label="Words"></div>
                <div class="definition-match__list" data-definition-choices role="group" aria-label="Definitions"></div>
              </div>
            </div>
          </section>`;
        wordChoices = context.container.querySelector("[data-word-choices]");
        definitionChoices = context.container.querySelector("[data-definition-choices]");
        choiceColumns = context.container.querySelector("[data-match-columns]");
        connectorSvg = context.container.querySelector("[data-match-connectors]");
        prompt = context.container.querySelector("[data-match-prompt]");
        gameContent = context.container.querySelector("[data-match-content]");
        completion = context.container.parentElement.querySelector("[data-game-completion]");

        const robotId = context.robot.getSelectedRobotId();
        const robotSlot = context.container.querySelector("[data-robot-slot]");
        robotSlot.setAttribute("aria-label", context.robot.getSelectedRobotName());
        const message = context.robot.getMessageElement();
        message.classList.add(robotId === "helper" ? "robot__message--orange" : "robot__message--blue");
        context.container.querySelector("[data-robot-message]").replaceWith(message);
        context.container.addEventListener("click", handleClick);
        resizeObserver = new ResizeObserver(drawMatchedLines);
        resizeObserver.observe(choiceColumns);
      },

      start() {
        if (!context) throw new Error("Initialize Definition Match before starting it.");
        if (context.words.length === 0) throw new Error("Definition Match needs at least one word.");
        const shuffledWords = context.utilities.array.shuffle(context.words);
        words = shuffledWords.map(word => ({ id: word.id, label: word.word }));
        definitions = context.utilities.array.shuffle(shuffledWords.map(word => ({
          id: word.id,
          label: word.definition
        })));
        matchedIds = new Set();
        selectedWordId = null;
        started = true;
        prompt.textContent = "Choose a word, then choose its matching definition.";
        renderChoices();
        context.robot.showMessage("greeting");
      },

      destroy() {
        if (!context) return;
        context.container.removeEventListener("click", handleClick);
        resizeObserver.disconnect();
        resizeObserver = null;
        context.container.replaceChildren();
        context = null;
        words = [];
        definitions = [];
        matchedIds.clear();
        selectedWordId = null;
        retryWordId = null;
        retryDefinitionId = null;
        started = false;
        choiceColumns = null;
        connectorSvg = null;
      }
    };

    function renderChoices() {
      wordChoices.replaceChildren(...words.map(word => createChoice(word, "word")));
      definitionChoices.replaceChildren(...definitions.map(definition => createChoice(definition, "definition")));
      drawMatchedLines();
    }

    function drawMatchedLines() {
      if (!choiceColumns || !connectorSvg) return;
      const bounds = choiceColumns.getBoundingClientRect();
      connectorSvg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      connectorSvg.replaceChildren();
      for (const id of matchedIds) {
        const word = [...wordChoices.querySelectorAll("[data-match-id]")]
          .find(button => button.dataset.matchId === id);
        const definition = [...definitionChoices.querySelectorAll("[data-match-id]")]
          .find(button => button.dataset.matchId === id);
        if (!word || !definition) throw new Error(`Matched pair ${id} is missing a choice.`);
        const wordBounds = word.getBoundingClientRect();
        const definitionBounds = definition.getBoundingClientRect();
        const startX = wordBounds.right - bounds.left;
        const startY = wordBounds.top + wordBounds.height / 2 - bounds.top;
        const endX = definitionBounds.left - bounds.left;
        const endY = definitionBounds.top + definitionBounds.height / 2 - bounds.top;
        const curve = (endX - startX) * 0.45;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("d", `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`);
        line.setAttribute("class", "definition-match__connector");
        connectorSvg.append(line);
      }
    }

    function createChoice(item, kind) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "definition-match__choice";
      button.dataset.matchId = item.id;
      button.dataset.matchKind = kind;
      button.textContent = item.label;
      button.disabled = matchedIds.has(item.id);
      if (matchedIds.has(item.id)) button.classList.add("definition-match__choice--matched");
      if (kind === "word" && item.id === selectedWordId) button.classList.add("definition-match__choice--selected");
      if (kind === "word" && item.id === selectedWordId) button.setAttribute("aria-pressed", "true");
      if (matchedIds.has(item.id)) button.setAttribute("aria-label", `${item.label}, matched`);
      if ((kind === "word" && item.id === retryWordId) ||
          (kind === "definition" && item.id === retryDefinitionId)) {
        button.classList.add("definition-match__choice--retry");
      }
      return button;
    }

    function handleClick(event) {
      if (!started) return;
      const choice = event.target.closest("[data-match-id]");
      if (!choice || !context.container.contains(choice) || choice.disabled) return;
      clearRetry();

      if (choice.dataset.matchKind === "word") {
        selectedWordId = selectedWordId === choice.dataset.matchId ? null : choice.dataset.matchId;
        prompt.textContent = selectedWordId
          ? "Now choose its matching definition."
          : "Choose a word, then choose its matching definition.";
        renderChoices();
        if (selectedWordId) wordChoices.querySelector(`[data-match-id="${CSS.escape(selectedWordId)}"]`)?.focus({ preventScroll: true });
        return;
      }

      if (!selectedWordId) {
        prompt.textContent = "Choose a word first, then find its definition.";
        return;
      }

      if (choice.dataset.matchId !== selectedWordId) {
        retryWordId = selectedWordId;
        retryDefinitionId = choice.dataset.matchId;
        prompt.textContent = "Those do not match yet. Try another definition or choose a different word.";
        context.robot.setExpression("curious");
        context.robot.showMessage("retry");
        context.robot.animate("think");
        renderChoices();
        definitionChoices.querySelector(`[data-match-id="${CSS.escape(retryDefinitionId)}"]`)?.focus({ preventScroll: true });
        return;
      }

      matchedIds.add(selectedWordId);
      const completedWord = context.words.find(word => word.id === selectedWordId);
      selectedWordId = null;
      retryWordId = null;
      retryDefinitionId = null;
      context.callbacks.onQuestionComplete(completedWord);
      context.robot.showMessage("celebrate");
      context.robot.animate("celebrate");
      if (matchedIds.size === words.length) {
        gameContent.replaceWith(completion);
        return;
      }
      prompt.textContent = "Nice match! Choose another word to continue.";
      renderChoices();
      wordChoices.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }

    function clearRetry() {
      retryWordId = null;
      retryDefinitionId = null;
    }
  }
});

window.RobotSpellingLab.gameRegistry.registerGame(definitionMatch);
