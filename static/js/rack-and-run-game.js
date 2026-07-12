"use strict";

(() => {
  const gameplayScreen = document.getElementById("gameplayScreen");
  const liveMenu = document.getElementById("liveMenu");
  const splashScreen = document.getElementById("splashScreen");
  const primaryPlay = document.getElementById("primaryPlay");
  const leaveGame = document.getElementById("leaveGame");
  const gameCanvas = document.getElementById("gameCanvas");
  const shotPower = document.getElementById("shotPower");
  const shootButton = document.getElementById("shootButton");
  const gameMessage = document.getElementById("gameMessage");
  const turnLabel = document.getElementById("turnLabel");
  const rotateGate = document.getElementById("rotateGate");

  if (!gameplayScreen || !gameCanvas) {
    return;
  }

  const context = gameCanvas.getContext("2d");

  if (!context) {
    return;
  }

  const state = {
    width: 0,
    height: 0,
    scale: 1,
    aiming: false,
    aimAngle: 0,
    shotPower: 55,
    shotTaken: false,
  };

  const ballColors = {
    1: "#e4bd08",
    2: "#1661cb",
    3: "#c9252b",
    4: "#6f31a0",
    5: "#e67619",
    6: "#19834a",
    7: "#731a20",
    8: "#090b0d",
    9: "#e4bd08",
    10: "#1661cb",
    11: "#c9252b",
    12: "#6f31a0",
    13: "#e67619",
    14: "#19834a",
    15: "#731a20",
  };

  function tableGeometry() {
    const margin = Math.max(16, state.width * 0.035);
    const outerX = margin;
    const outerY = margin;
    const outerWidth = state.width - margin * 2;
    const outerHeight = state.height - margin * 2;

    const rail = Math.max(24, Math.min(52, outerWidth * 0.062));

    return {
      outerX,
      outerY,
      outerWidth,
      outerHeight,
      rail,
      clothX: outerX + rail,
      clothY: outerY + rail,
      clothWidth: outerWidth - rail * 2,
      clothHeight: outerHeight - rail * 2,
    };
  }

  function roundedRect(x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.roundRect(x, y, width, height, safeRadius);
  }

  function drawTableBase(geometry) {
    const {
      outerX,
      outerY,
      outerWidth,
      outerHeight,
      rail,
      clothX,
      clothY,
      clothWidth,
      clothHeight,
    } = geometry;

    const frameGradient = context.createLinearGradient(
      outerX,
      outerY,
      outerX,
      outerY + outerHeight
    );

    frameGradient.addColorStop(0, "#192b35");
    frameGradient.addColorStop(0.18, "#07141c");
    frameGradient.addColorStop(0.5, "#02090e");
    frameGradient.addColorStop(0.82, "#07141c");
    frameGradient.addColorStop(1, "#1a2d37");

    roundedRect(
      outerX,
      outerY,
      outerWidth,
      outerHeight,
      Math.max(18, rail * 0.65)
    );

    context.fillStyle = frameGradient;
    context.fill();

    context.lineWidth = Math.max(2, state.scale * 2);
    context.strokeStyle = "rgba(66, 210, 242, .72)";
    context.stroke();

    const railGradient = context.createLinearGradient(
      outerX,
      outerY,
      outerX + outerWidth,
      outerY + outerHeight
    );

    railGradient.addColorStop(0, "#083d54");
    railGradient.addColorStop(0.45, "#051c28");
    railGradient.addColorStop(1, "#001019");

    roundedRect(
      outerX + rail * 0.22,
      outerY + rail * 0.22,
      outerWidth - rail * 0.44,
      outerHeight - rail * 0.44,
      Math.max(14, rail * 0.5)
    );

    context.fillStyle = railGradient;
    context.fill();

    const clothGradient = context.createRadialGradient(
      clothX + clothWidth * 0.5,
      clothY + clothHeight * 0.42,
      clothWidth * 0.05,
      clothX + clothWidth * 0.5,
      clothY + clothHeight * 0.5,
      clothWidth * 0.68
    );

    clothGradient.addColorStop(0, "#08789a");
    clothGradient.addColorStop(0.5, "#04566f");
    clothGradient.addColorStop(1, "#012f42");

    roundedRect(
      clothX,
      clothY,
      clothWidth,
      clothHeight,
      Math.max(8, rail * 0.18)
    );

    context.fillStyle = clothGradient;
    context.fill();

    context.save();
    roundedRect(
      clothX,
      clothY,
      clothWidth,
      clothHeight,
      Math.max(8, rail * 0.18)
    );
    context.clip();

    for (let index = 0; index < 44; index += 1) {
      const x = clothX + Math.random() * clothWidth;
      const y = clothY + Math.random() * clothHeight;
      const alpha = 0.015 + Math.random() * 0.025;

      context.beginPath();
      context.strokeStyle = `rgba(255,255,255,${alpha})`;
      context.moveTo(x, y);
      context.lineTo(x + clothWidth * 0.12, y + clothHeight * 0.04);
      context.stroke();
    }

    context.restore();
  }

  function drawPockets(geometry) {
    const {
      clothX,
      clothY,
      clothWidth,
      clothHeight,
      rail,
    } = geometry;

    const cornerRadius = Math.max(14, rail * 0.42);
    const sideRadius = Math.max(13, rail * 0.36);

    const pockets = [
      [clothX, clothY, cornerRadius],
      [clothX + clothWidth / 2, clothY, sideRadius],
      [clothX + clothWidth, clothY, cornerRadius],
      [clothX, clothY + clothHeight, cornerRadius],
      [clothX + clothWidth / 2, clothY + clothHeight, sideRadius],
      [clothX + clothWidth, clothY + clothHeight, cornerRadius],
    ];

    pockets.forEach(([x, y, radius]) => {
      const gradient = context.createRadialGradient(
        x - radius * 0.22,
        y - radius * 0.2,
        radius * 0.1,
        x,
        y,
        radius
      );

      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(0.7, "#000000");
      gradient.addColorStop(1, "#15252d");

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.fill();
    });
  }

  function drawDiamonds(geometry) {
    const {
      outerX,
      outerY,
      outerWidth,
      outerHeight,
      rail,
    } = geometry;

    const diamondSize = Math.max(3.5, rail * 0.11);
    const horizontalFractions = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
    const verticalFractions = [0.25, 0.5, 0.75];

    context.fillStyle = "rgba(211, 239, 246, .86)";

    horizontalFractions.forEach((fraction) => {
      const x = outerX + outerWidth * fraction;
      const topY = outerY + rail * 0.48;
      const bottomY = outerY + outerHeight - rail * 0.48;

      drawDiamond(x, topY, diamondSize);
      drawDiamond(x, bottomY, diamondSize);
    });

    verticalFractions.forEach((fraction) => {
      const y = outerY + outerHeight * fraction;
      const leftX = outerX + rail * 0.48;
      const rightX = outerX + outerWidth - rail * 0.48;

      drawDiamond(leftX, y, diamondSize);
      drawDiamond(rightX, y, diamondSize);
    });
  }

  function drawDiamond(x, y, size) {
    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x + size, y);
    context.lineTo(x, y + size);
    context.lineTo(x - size, y);
    context.closePath();
    context.fill();
  }

  function ballRadius(geometry) {
    return Math.max(
      8,
      Math.min(
        geometry.clothWidth / 36,
        geometry.clothHeight / 18
      )
    );
  }

  function drawBall(x, y, radius, number) {
    const color = ballColors[number] || "#ffffff";
    const stripe = number >= 9;

    context.save();

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();

    const baseGradient = context.createRadialGradient(
      x - radius * 0.34,
      y - radius * 0.36,
      radius * 0.08,
      x,
      y,
      radius
    );

    baseGradient.addColorStop(0, "#ffffff");
    baseGradient.addColorStop(0.14, color);
    baseGradient.addColorStop(0.7, color);
    baseGradient.addColorStop(1, "#071017");

    context.fillStyle = baseGradient;
    context.fillRect(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );

    if (stripe) {
      context.fillStyle = "rgba(247, 247, 239, .96)";
      context.fillRect(
        x - radius,
        y - radius * 0.36,
        radius * 2,
        radius * 0.72
      );
    }

    context.restore();

    context.beginPath();
    context.arc(x, y, radius * 0.39, 0, Math.PI * 2);
    context.fillStyle = "#f7f6ed";
    context.fill();

    context.fillStyle = "#111111";
    context.font = `900 ${Math.max(8, radius * 0.62)}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(number), x, y + radius * 0.03);

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.lineWidth = Math.max(1, radius * 0.08);
    context.strokeStyle = "rgba(255,255,255,.45)";
    context.stroke();
  }

  function drawCueBall(x, y, radius) {
    const gradient = context.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.38,
      radius * 0.06,
      x,
      y,
      radius
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.42, "#f7f7f1");
    gradient.addColorStop(0.76, "#c5d0d4");
    gradient.addColorStop(1, "#586971");

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();

    context.lineWidth = Math.max(1, radius * 0.08);
    context.strokeStyle = "rgba(255,255,255,.6)";
    context.stroke();
  }

  function rackPositions(geometry, radius) {
    const centerY = geometry.clothY + geometry.clothHeight / 2;
    const apexX = geometry.clothX + geometry.clothWidth * 0.68;
    const stepX = radius * 1.74;
    const stepY = radius * 2.02;

    const rack = [
      [1, 0, 0],
      [2, 1, -0.5],
      [3, 1, 0.5],
      [4, 2, -1],
      [8, 2, 0],
      [5, 2, 1],
      [6, 3, -1.5],
      [9, 3, -0.5],
      [10, 3, 0.5],
      [7, 3, 1.5],
      [11, 4, -2],
      [12, 4, -1],
      [13, 4, 0],
      [14, 4, 1],
      [15, 4, 2],
    ];

    return rack.map(([number, column, row]) => ({
      number,
      x: apexX + stepX * column,
      y: centerY + stepY * row,
    }));
  }

  function drawAimGuide(cueX, cueY, geometry) {
    const distance = geometry.clothWidth * 0.46;
    const targetX = cueX + Math.cos(state.aimAngle) * distance;
    const targetY = cueY + Math.sin(state.aimAngle) * distance;

    context.save();
    context.setLineDash([
      Math.max(7, state.scale * 8),
      Math.max(6, state.scale * 7),
    ]);

    context.beginPath();
    context.moveTo(cueX, cueY);
    context.lineTo(targetX, targetY);
    context.lineWidth = Math.max(1.5, state.scale * 1.6);
    context.strokeStyle = "rgba(255,255,255,.62)";
    context.stroke();

    context.restore();

    const cueLength = geometry.clothWidth * 0.28;
    const cueGap = ballRadius(geometry) * 1.6;
    const backX = cueX - Math.cos(state.aimAngle) * cueGap;
    const backY = cueY - Math.sin(state.aimAngle) * cueGap;
    const endX = backX - Math.cos(state.aimAngle) * cueLength;
    const endY = backY - Math.sin(state.aimAngle) * cueLength;

    const cueGradient = context.createLinearGradient(
      endX,
      endY,
      backX,
      backY
    );

    cueGradient.addColorStop(0, "#391b0b");
    cueGradient.addColorStop(0.34, "#a9682e");
    cueGradient.addColorStop(0.86, "#dfbd79");
    cueGradient.addColorStop(1, "#e7dfc5");

    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(backX, backY);
    context.lineWidth = Math.max(5, ballRadius(geometry) * 0.32);
    context.lineCap = "round";
    context.strokeStyle = cueGradient;
    context.stroke();

    context.lineCap = "butt";
  }

  function drawGame() {
    context.clearRect(0, 0, state.width, state.height);

    const geometry = tableGeometry();
    const radius = ballRadius(geometry);
    const cueX = geometry.clothX + geometry.clothWidth * 0.27;
    const cueY = geometry.clothY + geometry.clothHeight * 0.5;

    drawTableBase(geometry);
    drawDiamonds(geometry);
    drawPockets(geometry);

    rackPositions(geometry, radius).forEach((ball) => {
      drawBall(ball.x, ball.y, radius, ball.number);
    });

    drawAimGuide(cueX, cueY, geometry);
    drawCueBall(cueX, cueY, radius);
  }

  function resizeCanvas() {
    const shell = gameCanvas.parentElement;
    const bounds = shell.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const availableHeight = Math.max(
      240,
      window.innerHeight - 154
    );

    state.width = Math.max(
      560,
      Math.floor(
        Math.min(
          bounds.width,
          availableHeight * 2
        )
      )
    );

    state.height = Math.floor(state.width / 2);
    state.scale = state.width / 960;

    gameCanvas.width = Math.floor(state.width * pixelRatio);
    gameCanvas.height = Math.floor(state.height * pixelRatio);
    gameCanvas.style.width = `${state.width}px`;
    gameCanvas.style.height = `${state.height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    drawGame();
  }

  function canvasPoint(event) {
    const bounds = gameCanvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;

    return {
      x: source.clientX - bounds.left,
      y: source.clientY - bounds.top,
    };
  }

  function updateAim(event) {
    const geometry = tableGeometry();
    const cueX = geometry.clothX + geometry.clothWidth * 0.27;
    const cueY = geometry.clothY + geometry.clothHeight * 0.5;
    const point = canvasPoint(event);

    state.aimAngle = Math.atan2(
      point.y - cueY,
      point.x - cueX
    );

    drawGame();
  }

  function beginAim(event) {
    state.aiming = true;
    updateAim(event);
  }

  function moveAim(event) {
    if (!state.aiming) {
      return;
    }

    event.preventDefault();
    updateAim(event);
  }

  function endAim() {
    state.aiming = false;
  }

  function landscapeReady() {
    return window.innerWidth > window.innerHeight;
  }

  function syncGameplayOrientation() {
    const ready = landscapeReady();

    document.body.classList.toggle(
      "rack-landscape-ready",
      ready
    );

    if (rotateGate) {
      rotateGate.setAttribute(
        "aria-hidden",
        ready ? "true" : "false"
      );
    }

    if (!gameplayScreen.hidden && ready) {
      window.requestAnimationFrame(resizeCanvas);
    }
  }

  function enterGameplay() {
    document.body.classList.add("gameplay-active");

    if (splashScreen) {
      splashScreen.hidden = true;
      splashScreen.setAttribute("aria-hidden", "true");
    }

    if (liveMenu) {
      liveMenu.hidden = true;
      liveMenu.setAttribute("aria-hidden", "true");
    }

    gameplayScreen.hidden = false;
    gameplayScreen.setAttribute("aria-hidden", "false");

    syncGameplayOrientation();

    window.requestAnimationFrame(() => {
      gameplayScreen.classList.add("gameplay-screen-visible");

      if (landscapeReady()) {
        resizeCanvas();
      }

      if (shootButton) {
        shootButton.focus({ preventScroll: true });
      }
    });
  }

  function exitGameplay() {
    gameplayScreen.classList.remove("gameplay-screen-visible");
    gameplayScreen.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      gameplayScreen.hidden = true;

      if (liveMenu) {
        liveMenu.hidden = false;
        liveMenu.setAttribute("aria-hidden", "false");
      }

      document.body.classList.remove("gameplay-active");

      if (primaryPlay) {
        primaryPlay.focus({ preventScroll: true });
      }
    }, 260);
  }

  function takeShot() {
    state.shotPower = Number(shotPower?.value || 55);
    state.shotTaken = true;

    if (turnLabel) {
      turnLabel.textContent = "Shot Ready";
    }

    if (gameMessage) {
      gameMessage.textContent =
        `Break power set to ${state.shotPower}%. Physics activation is next.`;
    }

    shootButton?.classList.add("shot-confirmed");

    window.setTimeout(() => {
      shootButton?.classList.remove("shot-confirmed");
    }, 360);
  }

  primaryPlay?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      enterGameplay();
    },
    true
  );

  leaveGame?.addEventListener("click", exitGameplay);
  shootButton?.addEventListener("click", takeShot);

  shotPower?.addEventListener("input", () => {
    state.shotPower = Number(shotPower.value);

    if (gameMessage) {
      gameMessage.textContent = `Shot power: ${state.shotPower}%`;
    }
  });

  gameCanvas.addEventListener("pointerdown", beginAim);
  gameCanvas.addEventListener("pointermove", moveAim);
  gameCanvas.addEventListener("pointerup", endAim);
  gameCanvas.addEventListener("pointercancel", endAim);
  gameCanvas.addEventListener("pointerleave", endAim);

  window.addEventListener("resize", syncGameplayOrientation);
  window.addEventListener(
    "orientationchange",
    syncGameplayOrientation
  );

  syncGameplayOrientation();

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !gameplayScreen.hidden
    ) {
      exitGameplay();
    }
  });
})();
