function announce(region, message) {
  region.textContent = message;
}

function clearElement(element) {
  element.replaceChildren();
}

function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading) throw new Error("A focusable heading is required in this container.");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

window.RobotSpellingLab.domUtils = Object.freeze({ announce, clearElement, focusHeading });
