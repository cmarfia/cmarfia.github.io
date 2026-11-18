function createRobot({ id, name, variant, mount }) {
  if (!id || !name || !["professor", "helper"].includes(variant) || !mount) {
    throw new Error("Robot creation requires an id, name, supported variant, and mount element.");
  }

  const root = makeElement("div", `robot robot--${variant}`);
  root.dataset.robotId = id;
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", name);

  const art = makeElement("div", "robot__art");
  art.setAttribute("aria-hidden", "true");
  art.append(
    makeElement("span", "robot__antenna"),
    makeElement("span", "robot__ear robot__ear--left"),
    makeElement("span", "robot__ear robot__ear--right")
  );

  const head = makeElement("span", "robot__head");
  const face = makeElement("span", "robot__face");
  const eyes = [makeElement("span", "robot__eye"), makeElement("span", "robot__eye")];
  const mouth = makeElement("span", "robot__mouth");
  face.append(...eyes, mouth);
  head.append(face);

  const body = makeElement("span", "robot__body");
  const leftArm = makeElement("span", "robot__arm robot__arm--left");
  const rightArm = makeElement("span", "robot__arm robot__arm--right");
  leftArm.append(makeElement("span", "robot__hand"));
  rightArm.append(makeElement("span", "robot__hand"));
  art.append(head, leftArm, rightArm, body,
    makeElement("span", "robot__foot robot__foot--left"),
    makeElement("span", "robot__foot robot__foot--right"));

  const message = makeElement("p", "robot__message");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  root.append(art, message);
  mount.append(root);

  return Object.freeze({
    id,
    root,
    message,
    elements: Object.freeze({ head, eyes, mouth, leftArm, rightArm }),
    destroy() { root.remove(); }
  });
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

window.RobotSpellingLab.createRobot = createRobot;
