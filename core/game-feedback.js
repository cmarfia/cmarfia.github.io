function createGameFeedback({ shell, totalWords }) {
  const progress = shell.querySelector("[data-session-progress]");
  const progressText = shell.querySelector("[data-progress-text]");
  const status = shell.querySelector("[data-game-feedback]");
  const completion = shell.querySelector("[data-game-completion]");
  let destroyed = false;
  reportProgress(0, totalWords);

  function reportProgress(completed, total = totalWords) {
    if (!Number.isInteger(completed) || !Number.isInteger(total) || total !== totalWords || completed < 0 || completed > total) {
      throw new Error("Game progress must be a whole number within the selected word count.");
    }
    progress.max = total;
    progress.value = completed;
    progressText.textContent = `${completed} of ${total} words practised`;
  }

  function show(message, tone = "info") {
    if (!new Set(["info", "success", "retry"]).has(tone)) {
      throw new Error(`Unknown feedback tone: ${tone}`);
    }
    status.dataset.tone = tone;
    window.RobotSpellingLab.domUtils.announce(status, message);
    status.hidden = false;
  }

  function clear() {
    window.RobotSpellingLab.domUtils.clearElement(status);
    status.hidden = true;
    delete status.dataset.tone;
  }

  function complete() {
    show("Activity complete! Great work.", "success");
    completion.hidden = false;
    window.RobotSpellingLab.domUtils.focusHeading(completion);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    status.hidden = true;
    completion.hidden = true;
  }

  return Object.freeze({ reportProgress, show, clear, complete, destroy });
}

window.RobotSpellingLab.createGameFeedback = createGameFeedback;
