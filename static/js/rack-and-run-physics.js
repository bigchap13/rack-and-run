"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const gameplayScreen = document.getElementById("gameplayScreen");
  const shootButton = document.getElementById("shootButton");
  const shotPower = document.getElementById("shotPower");
  const turnLabel = document.getElementById("turnLabel");
  const gameMessage = document.getElementById("gameMessage");

  if (!canvas || !gameplayScreen || !shootButton) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const FIXED_STEP = 1 / 120;
  const MAX_FRAME_DELTA = 0.035;
  const ROLLING_DRAG = 0.78;
  const STOP_SPEED = 7;
  const SETTLE_TIME = 0.32;

  const BALL_COLORS = {
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

  const state = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    accumulator: 0,
    previousTime: performance.now(),
    geometry: null,
    ballRadius: 16,
    balls: [],
    initialized: false,
    aimAngle: 0,
    aiming: false,
    moving: false,
    settledFor: 0,
    cueAnimation: null,
    shotNumber: 0,
  };

  function tableGeometry() {
    const margin = Math.max(
      3,
      Math.min(state.width, state.height) * 0.008
    );

    const outerX = margin;
    const outerY = margin;
    const outerWidth = state.width - margin * 2;
    const outerHeight = state.height - margin * 2;

    const rail = Math.max(
      22,
      Math.min(
        54,
        Math.min(
          outerWidth * 0.052,
          outerHeight * 0.115
        )
      )
    );

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

  function calculateBallRadius(geometry) {
    return Math.max(
      11,
      Math.min(
        23,
        geometry.clothHeight * 0.044
      )
    );
  }

  function createBall(number, x, y) {
    return {
      number,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: state.ballRadius,
      isCue: number === 0,
      pocketed: false,
    };
  }

  function resetRack() {
    const geometry = state.geometry;
    const radius = state.ballRadius;

    const cueX =
      geometry.clothX +
      geometry.clothWidth * 0.285;

    const centerY =
      geometry.clothY +
      geometry.clothHeight * 0.5;

    const apexX =
      geometry.clothX +
      geometry.clothWidth * 0.69;

    const stepX = radius * 1.735;
    const stepY = radius * 2.015;

    const rack = [
      [1],
      [2, 3],
      [4, 8, 5],
      [6, 9, 10, 7],
      [11, 12, 13, 14, 15],
    ];

    state.balls = [
      createBall(0, cueX, centerY),
    ];

    rack.forEach((column, columnIndex) => {
      column.forEach((number, rowIndex) => {
        state.balls.push(
          createBall(
            number,
            apexX + stepX * columnIndex,
            centerY +
              (rowIndex - (column.length - 1) / 2) *
                stepY
          )
        );
      });
    });
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();

    state.width = Math.max(
      320,
      Math.floor(bounds.width)
    );

    state.height = Math.max(
      180,
      Math.floor(bounds.height)
    );

    state.pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.floor(
      state.width * state.pixelRatio
    );

    canvas.height = Math.floor(
      state.height * state.pixelRatio
    );

    context.setTransform(
      state.pixelRatio,
      0,
      0,
      state.pixelRatio,
      0,
      0
    );

    state.geometry = tableGeometry();
    state.ballRadius =
      calculateBallRadius(state.geometry);

    resetRack();
    state.initialized = true;
  }


  function roundedRect(
    x,
    y,
    width,
    height,
    radius
  ) {
    const safeRadius = Math.min(
      radius,
      width / 2,
      height / 2
    );

    context.beginPath();
    context.roundRect(
      x,
      y,
      width,
      height,
      safeRadius
    );
  }

  function drawTable() {
    const geometry = state.geometry;

    context.clearRect(
      0,
      0,
      state.width,
      state.height
    );

    const roomGradient =
      context.createRadialGradient(
        state.width / 2,
        state.height / 2,
        state.height * 0.08,
        state.width / 2,
        state.height / 2,
        state.width * 0.7
      );

    roomGradient.addColorStop(0, "#05283b");
    roomGradient.addColorStop(0.65, "#00121d");
    roomGradient.addColorStop(1, "#000509");

    context.fillStyle = roomGradient;
    context.fillRect(
      0,
      0,
      state.width,
      state.height
    );

    const railGradient =
      context.createLinearGradient(
        geometry.outerX,
        geometry.outerY,
        geometry.outerX,
        geometry.outerY + geometry.outerHeight
      );

    railGradient.addColorStop(0, "#0b3b4e");
    railGradient.addColorStop(0.42, "#041821");
    railGradient.addColorStop(1, "#01080d");

    context.save();

    context.shadowColor =
      "rgba(48, 214, 245, .36)";
    context.shadowBlur = 24;

    roundedRect(
      geometry.outerX,
      geometry.outerY,
      geometry.outerWidth,
      geometry.outerHeight,
      24
    );

    context.fillStyle = railGradient;
    context.fill();

    context.lineWidth = Math.max(
      2,
      geometry.rail * 0.065
    );

    context.strokeStyle =
      "rgba(66, 219, 247, .78)";
    context.stroke();

    context.restore();

    const clothGradient =
      context.createRadialGradient(
        geometry.clothX +
          geometry.clothWidth * 0.5,
        geometry.clothY +
          geometry.clothHeight * 0.45,
        geometry.clothHeight * 0.08,
        geometry.clothX +
          geometry.clothWidth * 0.5,
        geometry.clothY +
          geometry.clothHeight * 0.5,
        geometry.clothWidth * 0.62
      );

    clothGradient.addColorStop(0, "#1599b8");
    clothGradient.addColorStop(0.56, "#066a82");
    clothGradient.addColorStop(1, "#02394e");

    roundedRect(
      geometry.clothX,
      geometry.clothY,
      geometry.clothWidth,
      geometry.clothHeight,
      10
    );

    context.fillStyle = clothGradient;
    context.fill();

    drawDiamonds();
    drawPockets();
  }

  function drawDiamonds() {
    const geometry = state.geometry;

    const horizontalFractions = [
      0.125,
      0.25,
      0.375,
      0.625,
      0.75,
      0.875,
    ];

    const verticalFractions = [
      0.25,
      0.5,
      0.75,
    ];

    const topY =
      geometry.outerY +
      geometry.rail * 0.42;

    const bottomY =
      geometry.outerY +
      geometry.outerHeight -
      geometry.rail * 0.42;

    const leftX =
      geometry.outerX +
      geometry.rail * 0.42;

    const rightX =
      geometry.outerX +
      geometry.outerWidth -
      geometry.rail * 0.42;

    const size = Math.max(
      5,
      geometry.rail * 0.16
    );

    function diamond(x, y) {
      context.save();
      context.translate(x, y);
      context.rotate(Math.PI / 4);

      context.fillRect(
        -size / 2,
        -size / 2,
        size,
        size
      );

      context.restore();
    }

    context.save();
    context.fillStyle = "#cce8ee";
    context.globalAlpha = 0.9;

    horizontalFractions.forEach((fraction) => {
      const x =
        geometry.outerX +
        geometry.outerWidth * fraction;

      diamond(x, topY);
      diamond(x, bottomY);
    });

    verticalFractions.forEach((fraction) => {
      const y =
        geometry.outerY +
        geometry.outerHeight * fraction;

      diamond(leftX, y);
      diamond(rightX, y);
    });

    context.restore();
  }

  function pocketPositions() {
    const geometry = state.geometry;

    const left = geometry.clothX;
    const right =
      geometry.clothX + geometry.clothWidth;

    const top = geometry.clothY;
    const bottom =
      geometry.clothY + geometry.clothHeight;

    const centerX =
      geometry.clothX +
      geometry.clothWidth / 2;

    return [
      [left, top],
      [centerX, top],
      [right, top],
      [left, bottom],
      [centerX, bottom],
      [right, bottom],
    ];
  }

  function drawPockets() {
    const radius = state.ballRadius * 1.58;

    pocketPositions().forEach(([x, y]) => {
      const gradient =
        context.createRadialGradient(
          x - radius * 0.2,
          y - radius * 0.2,
          radius * 0.08,
          x,
          y,
          radius
        );

      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(0.72, "#010203");
      gradient.addColorStop(1, "#182934");

      context.beginPath();
      context.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      context.fillStyle = gradient;
      context.fill();

      context.lineWidth = Math.max(
        2,
        radius * 0.09
      );

      context.strokeStyle =
        "rgba(0, 0, 0, .92)";
      context.stroke();
    });
  }

  function drawBall(ball) {
    if (ball.pocketed) {
      return;
    }

    const radius = ball.radius;

    const gradient =
      context.createRadialGradient(
        ball.x - radius * 0.36,
        ball.y - radius * 0.4,
        radius * 0.06,
        ball.x,
        ball.y,
        radius
      );

    if (ball.isCue) {
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.55, "#eef4f5");
      gradient.addColorStop(1, "#82959d");
    } else {
      const color = BALL_COLORS[ball.number];

      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.18, color);
      gradient.addColorStop(0.72, color);
      gradient.addColorStop(1, "#101010");
    }

    context.save();

    context.shadowColor =
      "rgba(0, 0, 0, .55)";
    context.shadowBlur = radius * 0.45;
    context.shadowOffsetY = radius * 0.26;

    context.beginPath();
    context.arc(
      ball.x,
      ball.y,
      radius,
      0,
      Math.PI * 2
    );

    context.fillStyle = gradient;
    context.fill();

    context.restore();

    if (!ball.isCue && ball.number >= 9) {
      context.save();

      context.beginPath();
      context.arc(
        ball.x,
        ball.y,
        radius * 0.94,
        0,
        Math.PI * 2
      );

      context.clip();
      context.fillStyle = "#f4f3e9";

      context.fillRect(
        ball.x - radius,
        ball.y - radius * 0.33,
        radius * 2,
        radius * 0.66
      );

      context.restore();
    }

    if (!ball.isCue) {
      context.beginPath();
      context.arc(
        ball.x,
        ball.y,
        radius * 0.39,
        0,
        Math.PI * 2
      );

      context.fillStyle = "#f5f3ea";
      context.fill();

      context.fillStyle = "#101010";
      context.font =
        `900 ${Math.max(8, radius * 0.6)}px Arial`;

      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(
        String(ball.number),
        ball.x,
        ball.y + radius * 0.03
      );
    }

    context.beginPath();
    context.arc(
      ball.x,
      ball.y,
      radius,
      0,
      Math.PI * 2
    );

    context.lineWidth = Math.max(
      1,
      radius * 0.07
    );

    context.strokeStyle =
      "rgba(255, 255, 255, .44)";
    context.stroke();
  }

  function cueBall() {
    return state.balls.find(
      (ball) => ball.isCue && !ball.pocketed
    );
  }

  function drawAimAndCue(time) {
    const cue = cueBall();

    if (!cue || state.moving) {
      return;
    }

    const directionX = Math.cos(state.aimAngle);
    const directionY = Math.sin(state.aimAngle);

    const guideLength = Math.max(
      state.geometry.clothWidth,
      state.geometry.clothHeight
    );

    context.save();

    context.setLineDash([
      Math.max(8, state.ballRadius * 0.7),
      Math.max(7, state.ballRadius * 0.55),
    ]);

    context.lineWidth = Math.max(
      2,
      state.ballRadius * 0.11
    );

    context.strokeStyle =
      "rgba(230, 248, 252, .72)";

    context.beginPath();

    context.moveTo(
      cue.x + directionX * state.ballRadius * 1.35,
      cue.y + directionY * state.ballRadius * 1.35
    );

    context.lineTo(
      cue.x + directionX * guideLength,
      cue.y + directionY * guideLength
    );

    context.stroke();
    context.restore();

    let pullback =
      state.ballRadius * 3.2 +
      (Number(shotPower?.value || 55) / 100) *
        state.ballRadius *
        2.2;

    if (state.cueAnimation) {
      const elapsed =
        time - state.cueAnimation.startedAt;

      if (elapsed < 140) {
        pullback +=
          (elapsed / 140) *
          state.ballRadius *
          2.4;
      } else {
        const strikeProgress = Math.min(
          1,
          (elapsed - 140) / 110
        );

        pullback =
          state.ballRadius *
          5.6 *
          (1 - strikeProgress);
      }
    }

    const tipX =
      cue.x -
      directionX *
        (state.ballRadius + pullback);

    const tipY =
      cue.y -
      directionY *
        (state.ballRadius + pullback);

    const cueLength = Math.max(
      state.ballRadius * 12,
      state.geometry.clothWidth * 0.3
    );

    const buttX =
      tipX - directionX * cueLength;

    const buttY =
      tipY - directionY * cueLength;

    const cueGradient =
      context.createLinearGradient(
        buttX,
        buttY,
        tipX,
        tipY
      );

    cueGradient.addColorStop(0, "#311506");
    cueGradient.addColorStop(0.18, "#763b15");
    cueGradient.addColorStop(0.74, "#d7aa60");
    cueGradient.addColorStop(0.94, "#f0ddb2");
    cueGradient.addColorStop(1, "#35a5c2");

    context.save();
    context.lineCap = "round";
    context.lineWidth = Math.max(
      5,
      state.ballRadius * 0.34
    );
    context.strokeStyle = cueGradient;
    context.shadowColor = "rgba(0, 0, 0, .62)";
    context.shadowBlur = 7;

    context.beginPath();
    context.moveTo(buttX, buttY);
    context.lineTo(tipX, tipY);
    context.stroke();

    context.restore();
  }

  function drawScene(time) {
    if (!state.geometry) {
      return;
    }

    drawTable();
    state.balls.forEach(drawBall);
    drawAimAndCue(time);
  }

  function setMotionState(moving) {
    if (moving === state.moving) {
      return;
    }

    state.moving = moving;

    if (window.RackAndRunMotion) {
      window.RackAndRunMotion.reportBallMotion(moving);

      if (!moving) {
        window.RackAndRunMotion.reportBallMotion(false);
        window.RackAndRunMotion.reportBallMotion(false);
      }
    }

    if (turnLabel) {
      turnLabel.textContent =
        moving ? "Shot in Motion" : "Shot Ready";
    }
  }

  function allBallsStopped() {
    return state.balls.every((ball) => {
      if (ball.pocketed) {
        return true;
      }

      return Math.hypot(ball.vx, ball.vy) < STOP_SPEED;
    });
  }

  function physicsStep(delta) {
    const drag = Math.exp(-ROLLING_DRAG * delta);

    state.balls.forEach((ball) => {
      if (ball.pocketed) {
        return;
      }

      ball.x += ball.vx * delta;
      ball.y += ball.vy * delta;

      ball.vx *= drag;
      ball.vy *= drag;

      if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }
    });

    if (!state.moving) {
      return;
    }

    if (allBallsStopped()) {
      state.settledFor += delta;

      if (state.settledFor >= SETTLE_TIME) {
        state.settledFor = 0;
        setMotionState(false);
      }
    } else {
      state.settledFor = 0;
    }
  }

  function frame(time) {
    const delta = Math.min(
      MAX_FRAME_DELTA,
      Math.max(
        0,
        (time - state.previousTime) / 1000
      )
    );

    state.previousTime = time;
    state.accumulator += delta;

    if (
      state.cueAnimation &&
      time - state.cueAnimation.startedAt >= 250
    ) {
      strikeCueBall();
    }

    while (state.accumulator >= FIXED_STEP) {
      physicsStep(FIXED_STEP);
      state.accumulator -= FIXED_STEP;
    }

    drawScene(time);
    window.requestAnimationFrame(frame);
  }

  function pointerPosition(event) {
    const bounds = canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - bounds.left) *
        (state.width / bounds.width),
      y:
        (event.clientY - bounds.top) *
        (state.height / bounds.height),
    };
  }

  function updateAim(event) {
    const cue = cueBall();

    if (!cue || state.moving || state.cueAnimation) {
      return;
    }

    const pointer = pointerPosition(event);

    state.aimAngle = Math.atan2(
      pointer.y - cue.y,
      pointer.x - cue.x
    );
  }

  function beginAim(event) {
    if (
      gameplayScreen.hidden ||
      state.moving ||
      state.cueAnimation
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    state.aiming = true;
    canvas.setPointerCapture?.(event.pointerId);
    updateAim(event);
  }

  function moveAim(event) {
    if (!state.aiming) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    updateAim(event);
  }

  function endAim(event) {
    if (!state.aiming) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    state.aiming = false;
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function shoot() {
    const cue = cueBall();

    if (
      !cue ||
      state.moving ||
      state.cueAnimation
    ) {
      return;
    }

    state.shotNumber += 1;
    state.settledFor = 0;

    state.cueAnimation = {
      startedAt: performance.now(),
      power: Math.max(
        0.08,
        Number(shotPower?.value || 55) / 100
      ),
    };

    setMotionState(true);

    if (gameMessage) {
      gameMessage.textContent =
        `Shot power: ${Math.round(
          state.cueAnimation.power * 100
        )}%`;
    }
  }

  function strikeCueBall() {
    const cue = cueBall();

    if (!cue || !state.cueAnimation) {
      return;
    }

    const maximumSpeed = Math.max(
      760,
      state.geometry.clothWidth * 1.08
    );

    const speed =
      maximumSpeed *
      (0.22 + state.cueAnimation.power * 0.78);

    cue.vx = Math.cos(state.aimAngle) * speed;
    cue.vy = Math.sin(state.aimAngle) * speed;

    state.cueAnimation = null;
  }

  canvas.addEventListener(
    "pointerdown",
    beginAim,
    true
  );

  canvas.addEventListener(
    "pointermove",
    moveAim,
    true
  );

  canvas.addEventListener(
    "pointerup",
    endAim,
    true
  );

  canvas.addEventListener(
    "pointercancel",
    endAim,
    true
  );

  shootButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      shoot();
    },
    true
  );

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener(
    "orientationchange",
    () => {
      window.setTimeout(resizeCanvas, 180);
    }
  );

  window.RackAndRunPhysics = Object.freeze({
    resetRack,
    shoot,

    getState() {
      return {
        width: state.width,
        height: state.height,
        ballRadius: state.ballRadius,
        ballCount: state.balls.length,
        initialized: state.initialized,
        moving: state.moving,
        aimAngle: state.aimAngle,
        shotNumber: state.shotNumber,
      };
    },
  });

  resizeCanvas();
  window.requestAnimationFrame(frame);
})();
