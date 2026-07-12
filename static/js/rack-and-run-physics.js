"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const gameplayScreen = document.getElementById("gameplayScreen");

  if (!canvas || !gameplayScreen) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const FIXED_STEP = 1 / 120;
  const MAX_FRAME_DELTA = 0.035;

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

  function physicsStep() {
    // Movement, collisions, rails, and pockets
    // are added in the next small stacks.
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

    while (state.accumulator >= FIXED_STEP) {
      physicsStep(FIXED_STEP);
      state.accumulator -= FIXED_STEP;
    }

    window.requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener(
    "orientationchange",
    () => {
      window.setTimeout(resizeCanvas, 180);
    }
  );

  window.RackAndRunPhysics = Object.freeze({
    resetRack,

    getState() {
      return {
        width: state.width,
        height: state.height,
        ballRadius: state.ballRadius,
        ballCount: state.balls.length,
        initialized: state.initialized,
      };
    },
  });

  resizeCanvas();
  window.requestAnimationFrame(frame);
})();
