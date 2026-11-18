function createGameEngine({ registry, vocabulary, container, createRobots, dialogue, onExit }) {
  let activeSession = null;
  let sessionNumber = 0;

  function startGame(gameId, listId, gameContainer = container) {
    endGame();

    const definition = registry.getGame(gameId);
    const instance = definition.create();
    const sessionId = ++sessionNumber;
    const words = vocabulary.copyWords(listId);
    const robot = createRobots({ dialogue, robotIds: definition.robotIds });
    const feedback = window.RobotSpellingLab.createGameFeedback({
      shell: gameContainer.parentElement,
      totalWords: words.length
    });
    const completedIds = new Set();
    const context = Object.freeze({
      container: gameContainer,
      words,
      robot,
      feedback,
      utilities: Object.freeze({
        array: window.RobotSpellingLab.arrayUtils,
        string: window.RobotSpellingLab.stringUtils,
        dom: window.RobotSpellingLab.domUtils
      }),
      callbacks: Object.freeze({
        onQuestionComplete: word => recordQuestion(sessionId, word, words, completedIds),
        onProgressChange: completed => reportProgress(sessionId, completed, words.length),
        onGameComplete: () => completeGame(sessionId),
        onExit: () => requestExit(sessionId)
      })
    });

    activeSession = { id: sessionId, gameId, instance, robot, feedback, context, completedIds };
    try {
      instance.initialize(context);
      const robotMounts = [...gameContainer.querySelectorAll("[data-robot-mount]")];
      robot.mount(robotMounts.length === 1 && !robotMounts[0].dataset.robotMount
        ? robotMounts[0]
        : new Map(robotMounts.map(mount => [mount.dataset.robotMount, mount])));
      instance.start();
    } catch (error) {
      endGame();
      throw error;
    }
    return sessionId;
  }

  function endGame() {
    if (!activeSession) return;
    const session = activeSession;
    activeSession = null;
    try {
      session.instance.destroy();
    } finally {
      try {
        session.robot.destroy();
      } finally {
        session.feedback.destroy();
        session.context = null;
      }
    }
  }

  function getActiveSession() {
    if (!activeSession) return null;
    return { id: activeSession.id, gameId: activeSession.gameId };
  }

  function emit(sessionId, name, detail) {
    if (!activeSession || activeSession.id !== sessionId) return;
    activeSession.context.container.dispatchEvent(new CustomEvent(`robot-spelling:${name}`, {
      bubbles: true,
      detail: { sessionId: activeSession.id, gameId: activeSession.gameId, value: detail }
    }));
  }

  function recordQuestion(sessionId, word, words, completedIds) {
    if (!activeSession || activeSession.id !== sessionId || activeSession.completed) return;
    const entry = words.find(item => item.id === word?.id);
    if (!entry) throw new Error("A game reported a word outside its selected list.");
    if (completedIds.has(entry.id)) return;
    completedIds.add(entry.id);
    reportProgress(sessionId, completedIds.size, words.length);
    activeSession.feedback.show("Nice work! Word practised.", "success");
    emit(sessionId, "questioncomplete", entry);
    if (completedIds.size === words.length) completeGame(sessionId);
  }

  function reportProgress(sessionId, completed, total) {
    if (!activeSession || activeSession.id !== sessionId || activeSession.completed) return;
    activeSession.feedback.reportProgress(completed, total);
    emit(sessionId, "progresschange", { completed, total });
  }

  function completeGame(sessionId) {
    if (!activeSession || activeSession.id !== sessionId || activeSession.completed) return;
    activeSession.completed = true;
    activeSession.feedback.complete();
    emit(sessionId, "gamecomplete");
    requestAnimationFrame(() => {
      rootCompletionHeading()?.focus({ preventScroll: true });
    });
  }

  function rootCompletionHeading() {
    return activeSession?.context.container.parentElement
      ?.querySelector("[data-game-completion] h2");
  }

  function requestExit(sessionId) {
    if (!activeSession || activeSession.id !== sessionId) return;
    endGame();
    onExit();
  }

  return Object.freeze({ startGame, endGame, getActiveSession });
}

window.RobotSpellingLab.createGameEngine = createGameEngine;
