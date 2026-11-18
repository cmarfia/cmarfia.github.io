function createRobotController({ dialogue, robotIds }) {
  const stagingArea = document.createDocumentFragment();
  const profiles = new Map([
    ["professor", { name: "Professor Bot", variant: "professor" }],
    ["helper", { name: "Helper Bot", variant: "helper" }]
  ]);
  if (!Array.isArray(robotIds) || robotIds.length === 0) {
    throw new Error("A robot controller needs at least one robot ID.");
  }
  const uniqueIds = new Set(robotIds);
  if (uniqueIds.size !== robotIds.length) throw new Error("Robot IDs must be unique.");
  for (const id of robotIds) {
    if (!profiles.has(id)) throw new Error(`Unknown robot: ${id}`);
  }
  const selectedRobotId = robotIds[Math.floor(Math.random() * robotIds.length)];
  const profile = profiles.get(selectedRobotId);
  const selectedRobot = window.RobotSpellingLab.createRobot({
    id: selectedRobotId, name: profile.name, variant: profile.variant, mount: stagingArea
  });
  const robots = new Map([[selectedRobotId, selectedRobot]]);
  const timers = new Map();
  let destroyed = false;

  function getRobot(robotId = selectedRobotId) {
    if (destroyed) throw new Error("This robot controller has been destroyed.");
    const robot = robots.get(robotId);
    if (!robot) throw new Error(`Unknown robot: ${robotId}`);
    return robot;
  }

  function say(message, options = {}) {
    const robot = getRobot(options.robotId);
    robot.message.textContent = message;
  }

  function showMessage(category, options = {}) {
    say(dialogue.getDialogue(category), options);
  }

  function setExpression(expression, options = {}) {
    if (!["happy", "curious", "excited", "neutral"].includes(expression)) {
      throw new Error(`Unknown robot expression: ${expression}`);
    }
    getRobot(options.robotId).root.dataset.expression = expression;
  }

  function animate(animation, options = {}) {
    const robot = getRobot(options.robotId);
    const durations = { idle: 0, wave: 2900, think: 2200, celebrate: 1300 };
    if (!(animation in durations)) throw new Error(`Unknown robot animation: ${animation}`);
    clearTimeout(timers.get(robot.id));
    robot.root.dataset.animation = animation;
    if (animation !== "idle") {
      timers.set(robot.id, setTimeout(() => {
        robot.root.dataset.animation = "idle";
        timers.delete(robot.id);
      }, durations[animation]));
    }
  }

  function setVisible(visible, options = {}) {
    getRobot(options.robotId).root.hidden = !visible;
  }

  function mount(target) {
    if (!target) throw new Error("The game must provide a robot mount point.");
    if (target instanceof Map) {
      for (const [robotId, mountPoint] of target) mountPoint.append(getRobot(robotId).root);
      return;
    }
    for (const robot of robots.values()) target.append(robot.root);
  }

  function getMessageElement(robotId = selectedRobotId) {
    return getRobot(robotId).message;
  }

  function getSelectedRobotId() {
    if (destroyed) throw new Error("This robot controller has been destroyed.");
    return selectedRobotId;
  }

  function getSelectedRobotName() {
    return getRobot(selectedRobotId).root.getAttribute("aria-label");
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    for (const robot of robots.values()) robot.destroy();
    robots.clear();
  }

  return Object.freeze({
    say, showMessage, setExpression, animate, setVisible, mount,
    getMessageElement, getSelectedRobotId, getSelectedRobotName, destroy
  });
}

window.RobotSpellingLab.createRobotController = createRobotController;
