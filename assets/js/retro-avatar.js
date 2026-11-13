/* A little dial-up lag: one pose change, one second after a click. */
(() => {
  "use strict";
  const githubIcon = document.querySelector(".github-icon");
  if (githubIcon) {
    const source = githubIcon.querySelector("img");
    const canvas = githubIcon.querySelector("canvas");
    const icon = new Image();
    icon.onload = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.drawImage(icon, 0, 0, 16, 16);
      canvas.hidden = false;
      source.hidden = true;
    };
    icon.src = source.src;
  }
  const frame = document.querySelector("[data-avatar]");
  if (!frame) return;
  const sprite = frame.querySelector(".avatar-sprite");
  const portrait = frame.querySelector(".portrait");
  const button = document.querySelector(".avatar-button");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const poses = { "#about-me": 1, "#research": 2, "#selected-talks": 3, "#service": 1 };
  let currentPose = 0;
  let pending = null;
  let lastChange = -Infinity;
  let idleTimer = null;
  let returnTimer = null;
  let nextIdlePose = 1;
  const image = new Image();
  const researchMode = frame.dataset.mode === "research";
  let navigationPending = false;

  function wireNavigationReactions(stopAnimation, resumeAnimation) {
    window.addEventListener("pageshow", event => {
      if (!event.persisted) return;
      navigationPending = false;
      currentPose = 0;
      sprite.dataset.pose = "0";
      resumeAnimation();
    });
    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      const pose = /\/about\/?$/.test(href) ? 1 : /\/research\/?$/.test(href) ? 2 : /\/_pages\/cv\.pdf$/.test(href) ? 3 : null;
      if (pose === null) return;
      link.addEventListener("click", event => {
        // Modified clicks retain the browser's normal new-tab behavior.
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (navigationPending) return;
        navigationPending = true;
        stopAnimation();
        window.setTimeout(() => {
          currentPose = pose;
          sprite.dataset.pose = String(pose);
          window.setTimeout(() => window.location.assign(href), 650);
        }, 1000);
      });
    });
  }

  if (frame.dataset.mode === "landing") {
    let greetingTimer = null;
    let visibleElapsed = 0;
    let visibleSince = document.hidden ? null : performance.now();
    function scheduleGreeting(toggle = false) {
      window.clearTimeout(greetingTimer);
      if (document.hidden || reducedMotion.matches || navigationPending) return;
      const dwell = visibleElapsed + (visibleSince === null ? 0 : performance.now() - visibleSince);
      if (dwell >= 60000) {
        currentPose = 3;
        sprite.dataset.pose = "3";
        return;
      }
      if (dwell >= 30000) {
        currentPose = 2;
        sprite.dataset.pose = "2";
        greetingTimer = window.setTimeout(() => scheduleGreeting(), 60000 - dwell);
        return;
      }
      if (toggle) {
        currentPose = currentPose === 0 ? 1 : 0;
        sprite.dataset.pose = String(currentPose);
      }
      greetingTimer = window.setTimeout(() => {
        scheduleGreeting(true);
      }, Math.min(2500, 30000 - dwell));
    }
    image.onload = () => {
      sprite.hidden = true;
      wireNavigationReactions(() => window.clearTimeout(greetingTimer), () => {
        visibleElapsed = 0;
        visibleSince = document.hidden ? null : performance.now();
        scheduleGreeting();
      });
      scheduleGreeting();
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && visibleSince !== null) {
          visibleElapsed += performance.now() - visibleSince;
          visibleSince = null;
        } else if (!document.hidden && visibleSince === null) {
          visibleSince = performance.now();
        }
        scheduleGreeting();
      });
      reducedMotion.addEventListener("change", () => {
        currentPose = 0;
        sprite.dataset.pose = "0";
        scheduleGreeting();
      });
    };
    image.src = frame.dataset.sprite;
    return;
  }

  function changeAfterLag(pose, explicit = false) {
    if (document.hidden || navigationPending || pending !== null || (!explicit && reducedMotion.matches)) return;
    if (!explicit && performance.now() - lastChange < 12000) return;
    if (pose === currentPose) return;
    window.clearTimeout(returnTimer);
    pending = window.setTimeout(() => {
      pending = null;
      if (document.hidden) return;
      currentPose = pose;
      sprite.dataset.pose = String(pose);
      lastChange = performance.now();
      // Always pass through the regular stance between special poses.
      if (pose !== 0) {
        returnTimer = window.setTimeout(() => {
          currentPose = 0;
          sprite.dataset.pose = "0";
        }, 6500);
      }
    }, 1000);
  }

  function scheduleIdle() {
    window.clearTimeout(idleTimer);
    if (document.hidden || reducedMotion.matches || navigationPending) return;
    idleTimer = window.setTimeout(() => {
      if (currentPose === 0) {
        changeAfterLag(researchMode ? 2 : nextIdlePose);
        nextIdlePose = nextIdlePose % 3 + 1;
      }
      scheduleIdle();
    }, 50000 + Math.random() * 20000);
  }

  image.onload = () => {
    // Keep the original portrait as a fallback if the sheet cannot load.
    sprite.hidden = true;
    button.hidden = researchMode;
    if (!researchMode) button.addEventListener("click", () => changeAfterLag(1, true));
    document.querySelectorAll(".research-directory a").forEach(link => {
      link.addEventListener("click", () => changeAfterLag(researchMode ? 2 : (poses[link.getAttribute("href")] ?? 3)));
    });
    wireNavigationReactions(() => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(returnTimer);
      if (pending !== null) { window.clearTimeout(pending); pending = null; }
    }, scheduleIdle);
    document.addEventListener("visibilitychange", () => {
      if (pending !== null) { window.clearTimeout(pending); pending = null; }
      window.clearTimeout(returnTimer);
      currentPose = 0;
      sprite.dataset.pose = "0";
      scheduleIdle();
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches && pending !== null) { window.clearTimeout(pending); pending = null; }
      scheduleIdle();
    });
    changeAfterLag(Number(frame.dataset.initialPose || 0));
    scheduleIdle();
  };
  image.src = frame.dataset.sprite;
})();
