const app = document.querySelector("#app");
const services = window.RobotSpellingLab;
let gameEngine;
let navigation;

app.addEventListener("click", event => {
  if (event.target.closest('[data-action="retry-loading"]')) startApplication();
});

function startApplication() {
  app.dataset.screen = "loading";
  app.innerHTML = '<p class="loading-state">Loading your spelling lists…</p>';
  services.vocabulary.loadVocabulary()
    .then(() => {
      const container = document.createElement("div");
      gameEngine = services.createGameEngine({
        registry: services.gameRegistry,
        vocabulary: services.vocabulary,
        container,
        createRobots: services.createRobotController,
        dialogue: services.robotDialogue,
        onExit: () => navigation.showGames()
      });
      navigation = services.createNavigation(app, services.vocabulary, gameEngine, services.gameRegistry);
      navigation.showHome();
    })
    .catch(renderStartupError);
}

function renderStartupError(error) {
  console.error("Vocabulary loading failed.", error);
  app.dataset.screen = "error";
  app.innerHTML = `
    <section class="startup-error" aria-labelledby="startup-error-title" role="alert">
      <p class="eyebrow">Robot Spelling Lab</p>
      <h1 id="startup-error-title">We couldn't load the spelling lists.</h1>
      <p>Please connect to the internet once so Robot Spelling Lab can save the files it needs, then try again.</p>
      <button class="button button--primary" data-action="retry-loading">Try again</button>
    </section>`;
}

startApplication();
