function createNavigation(root, vocabulary, gameEngine, gameRegistry) {
  const state = { screen: "home", listId: null, gameId: null };
  root.addEventListener("click", handleAction);

  function handleAction(event) {
    const control = event.target.closest("[data-action]");
    if (!control || !root.contains(control)) return;
    const { action, id } = control.dataset;
    if (action === "lists") showLists();
    if (action === "select-list") selectList(id);
    if (action === "select-game") selectGame(id);
    if (action === "games") showGames();
    if (action === "home") showHome();
    if (action === "exit-game") showGames();
    if (action === "replay-game") selectGame(state.gameId);
  }

  function showHome() {
    gameEngine.endGame();
    state.screen = "home";
    state.listId = null;
    state.gameId = null;
    render(`<section class="welcome__card" aria-labelledby="welcome-title">
      <div class="brand-mark" aria-hidden="true"><span class="brand-mark__antenna"></span><span class="brand-mark__eye brand-mark__eye--left"></span><span class="brand-mark__eye brand-mark__eye--right"></span><span class="brand-mark__smile"></span></div>
      <p class="eyebrow">A little practice goes a long way</p>
      <h1 id="welcome-title">Welcome to<br><span>Robot Spelling Lab</span></h1>
      <p class="welcome__copy">Explore words, build spelling skills, and have fun along the way.</p>
      <button class="button button--primary" data-action="lists">Let’s get started <span aria-hidden="true">→</span></button>
    </section>`);
  }

  function showLists() {
    gameEngine.endGame();
    state.screen = "lists";
    state.gameId = null;
    const lists = vocabulary.getLists();
    render(`${pageHeader("Choose a spelling list", "Pick a set of words to practise.", "home")}
      <div class="choice-grid choice-grid--lists">
        ${lists.map(list => `<button class="choice-card" data-action="select-list" data-id="${list.id}" ${list.wordCount === 0 ? "disabled" : ""}>
          <span class="choice-card__icon" aria-hidden="true">✦</span><span class="choice-card__title">${list.title}</span>
          <span class="choice-card__detail">${list.wordCount === 0 ? "No words yet" : `${list.wordCount} words to practise`}</span>
          <span class="choice-card__arrow" aria-hidden="true">→</span></button>`).join("")}
      </div>${lists.length === 0 ? '<p class="placeholder-note">There are no spelling lists yet.</p>' : ""}`);
  }

  function selectList(id) {
    state.listId = id;
    showGames();
  }

  function showGames() {
    gameEngine.endGame();
    state.screen = "games";
    state.gameId = null;
    const list = vocabulary.getListById(state.listId);
    if (list.wordCount === 0) {
      render(`${pageHeader("No words to practise yet", `${list.title} does not have any words yet.`, "lists")}
        <section class="game-placeholder"><h2>Choose another spelling list</h2>
        <p>This list is empty right now. Pick a list with words to see the practice games.</p>
        <button class="button button--primary" data-action="lists">Choose a different list</button></section>`);
      return;
    }
    render(`${pageHeader("Choose a practice game", `Using ${list.title}. Pick any game to begin.`, "lists")}
      <div class="choice-grid choice-grid--games">${gameRegistry.getGames().map((game, index) => `
        <button class="choice-card game-card" data-action="select-game" data-id="${game.id}">
          <span class="game-card__number" aria-hidden="true">0${index + 1}</span><span class="choice-card__title">${game.name}</span>
          <span class="choice-card__detail">${game.description}</span><span class="choice-card__arrow" aria-hidden="true">→</span>
        </button>`).join("")}</div>`);
  }

  function selectGame(id) {
    const game = gameRegistry.getGame(id);
    const list = vocabulary.getListById(state.listId);
    state.screen = "game";
    state.gameId = id;
    render(`${pageHeader(game.name, list.title, "games", true)}
      <section class="game-session" data-game-session aria-label="Practice session">
        <div class="game-progress">
          <label for="game-progress">Words practised</label>
          <progress id="game-progress" data-session-progress max="${list.wordCount}" value="0"></progress>
          <p data-progress-text aria-live="polite">0 of ${list.wordCount} words practised</p>
        </div>
        <p class="visually-hidden" data-game-feedback role="status" aria-live="polite" hidden></p>
        <section class="game-completion" data-game-completion aria-labelledby="game-completion-title" hidden>
          <h2 id="game-completion-title" tabindex="-1">Activity complete!</h2>
          <p>Great work. Would you like to practise again?</p>
          <div class="game-completion__actions">
            <button class="button button--primary" data-action="replay-game">Play again</button>
            <button class="button game-control-button" data-action="games">Choose another activity</button>
          </div>
        </section>
        <div class="game-container" data-game-container></div>
      </section>`);
    gameEngine.startGame(id, state.listId, root.querySelector("[data-game-container]"));
  }

  function pageHeader(title, subtitle, backAction, showExit = false) {
    const homeControl = backAction === "home" ? "" : `<div class="screen-header__actions">${showExit ? '<button class="home-button" data-action="exit-game">Exit activity</button>' : ""}<button class="home-button" data-action="home">Home</button></div>`;
    const label = backAction === "home" ? "Go to welcome" : backAction === "lists" ? "Back to spelling lists" : "Back to games";
    return `<header class="screen-header"><button class="icon-button" data-action="${backAction}" aria-label="${label}">←</button>
      <div><p class="eyebrow">Robot Spelling Lab</p><h1>${title}</h1><p class="screen-header__subtitle">${subtitle}</p></div>${homeControl}</header>`;
  }

  function render(content) {
    root.dataset.screen = state.screen;
    root.innerHTML = `<div class="welcome__spark welcome__spark--one" aria-hidden="true">✦</div>
      <div class="welcome__spark welcome__spark--two" aria-hidden="true">✧</div><div class="app-content">${content}</div>
      <footer class="welcome__footer">Curious minds welcome <span aria-hidden="true">•</span> Mistakes help us learn</footer>`;
    const heading = root.querySelector("h1");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }

  return { showHome, showLists, showGames };
}

window.RobotSpellingLab.createNavigation = createNavigation;
