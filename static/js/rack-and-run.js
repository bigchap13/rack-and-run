"use strict";

(() => {
  const MODE_DETAILS = {
    career: {
      type: "Game Mode",
      title: "Career Mode",
      description:
        "Rise from the neighborhood pool hall to the professional world stage.",
    },
    "quick-match": {
      type: "Game Mode",
      title: "Quick Match",
      description:
        "Choose the table, opponent, rules, and difficulty for an immediate match.",
    },
    practice: {
      type: "Training",
      title: "Practice",
      description:
        "Sharpen aim, cue control, positioning, banks, combinations, and safety play.",
    },
    tournament: {
      type: "Competition",
      title: "Tournament",
      description:
        "Enter structured brackets and fight through every round for the championship.",
    },
    "trick-shot-lab": {
      type: "Training",
      title: "Trick Shot Lab",
      description:
        "Build, test, and master advanced banks, jumps, combinations, and creative shots.",
    },
    multiplayer: {
      type: "Competition",
      title: "Multiplayer",
      description:
        "Challenge another player locally or through future online competition.",
    },
  };

  const PANEL_DETAILS = {
    profile: {
      type: "Player Tools",
      title: "Player Profile",
      description:
        "Review player identity, progression, equipment, awards, and career standing.",
    },
    statistics: {
      type: "Player Tools",
      title: "Statistics",
      description:
        "Review matches, wins, losses, break performance, accuracy, streaks, and records.",
    },
    settings: {
      type: "Player Tools",
      title: "Settings",
      description:
        "Configure gameplay, audio, accessibility, controls, visuals, and player preferences.",
    },
  };

  const body = document.body;
  const splashScreen = document.getElementById("splashScreen");
  const liveMenu = document.getElementById("liveMenu");
  const enterGame = document.getElementById("enterGame");
  const primaryPlay = document.getElementById("primaryPlay");
  const selectionPanel = document.getElementById("selectionPanel");
  const selectionType = document.getElementById("selectionType");
  const selectionTitle = document.getElementById("selectionTitle");
  const selectionDescription = document.getElementById(
    "selectionDescription"
  );
  const closeSelection = document.getElementById("closeSelection");
  const chalkCanvas = document.getElementById("chalkCanvas");

  let menuEntered = false;

  function revealMenu() {
    if (menuEntered) {
      return;
    }

    menuEntered = true;
    body.classList.add("game-entered");

    if (splashScreen) {
      splashScreen.classList.add("departing");
      splashScreen.setAttribute("aria-hidden", "true");
    }

    if (liveMenu) {
      liveMenu.hidden = false;
      liveMenu.setAttribute("aria-hidden", "false");
    }

    window.setTimeout(() => {
      if (splashScreen) {
        splashScreen.hidden = true;
      }

      if (primaryPlay) {
        primaryPlay.focus({ preventScroll: true });
      }
    }, 760);
  }

  function showSelection(details, sourceButton) {
    if (!selectionPanel || !details) {
      return;
    }

    selectionType.textContent = details.type;
    selectionTitle.textContent = details.title;
    selectionDescription.textContent = details.description;

    selectionPanel.hidden = false;
    selectionPanel.classList.remove("selection-panel-visible");

    window.requestAnimationFrame(() => {
      selectionPanel.classList.add("selection-panel-visible");
    });

    document
      .querySelectorAll("[data-mode], [data-panel]")
      .forEach((button) => {
        button.classList.toggle("selected", button === sourceButton);
        button.setAttribute(
          "aria-pressed",
          button === sourceButton ? "true" : "false"
        );
      });

    selectionPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function hideSelection() {
    if (!selectionPanel) {
      return;
    }

    selectionPanel.classList.remove("selection-panel-visible");

    window.setTimeout(() => {
      selectionPanel.hidden = true;
    }, 220);

    document
      .querySelectorAll("[data-mode], [data-panel]")
      .forEach((button) => {
        button.classList.remove("selected");
        button.setAttribute("aria-pressed", "false");
      });

    if (primaryPlay) {
      primaryPlay.focus({ preventScroll: true });
    }
  }

  function buildChalkParticles() {
    if (!chalkCanvas) {
      return;
    }

    const context = chalkCanvas.getContext("2d");

    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrame = 0;

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      chalkCanvas.width = Math.floor(width * pixelRatio);
      chalkCanvas.height = Math.floor(height * pixelRatio);
      chalkCanvas.style.width = `${width}px`;
      chalkCanvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const particleCount = reduceMotion
        ? 18
        : Math.min(72, Math.max(30, Math.floor(width / 18)));

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.35 + Math.random() * 1.4,
        speed: 0.06 + Math.random() * 0.2,
        drift: -0.08 + Math.random() * 0.16,
        alpha: 0.08 + Math.random() * 0.3,
      }));
    }

    function draw() {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        context.beginPath();
        context.fillStyle = `rgba(188, 235, 248, ${particle.alpha})`;
        context.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );
        context.fill();

        if (!reduceMotion) {
          particle.y -= particle.speed;
          particle.x += particle.drift;

          if (particle.y < -4) {
            particle.y = height + 4;
            particle.x = Math.random() * width;
          }

          if (particle.x < -4) {
            particle.x = width + 4;
          } else if (particle.x > width + 4) {
            particle.x = -4;
          }
        }
      }

      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    resize();
    draw();

    window.addEventListener("resize", () => {
      window.cancelAnimationFrame(animationFrame);
      resize();
      draw();
    });
  }

  if (liveMenu) {
    liveMenu.hidden = true;
    liveMenu.setAttribute("aria-hidden", "true");
  }

  enterGame?.addEventListener("click", revealMenu);
  primaryPlay?.addEventListener("click", () => {
    showSelection(MODE_DETAILS.career, primaryPlay);
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      showSelection(MODE_DETAILS[button.dataset.mode], button);
    });
  });

  document.querySelectorAll("[data-panel]").forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      showSelection(PANEL_DETAILS[button.dataset.panel], button);
    });
  });

  closeSelection?.addEventListener("click", hideSelection);

  document.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      !menuEntered &&
      document.activeElement === body
    ) {
      event.preventDefault();
      revealMenu();
    }

    if (
      event.key === "Escape" &&
      selectionPanel &&
      !selectionPanel.hidden
    ) {
      hideSelection();
    }
  });

  buildChalkParticles();
})();
