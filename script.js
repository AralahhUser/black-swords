const badge = document.querySelector(".drop-badge strong");
let seconds = 48 * 60 + 12;
const introVideo = document.querySelector(".intro-video");
const introScreen = document.querySelector(".intro-screen");
const introPlay = document.querySelector(".intro-play");
const introSkip = document.querySelector(".intro-skip");
const isPhone = window.matchMedia("(max-width: 560px)").matches;
let introFinished = false;
let introFallback;

function setIntroFallback(delay) {
  window.clearTimeout(introFallback);
  introFallback = window.setTimeout(finishIntro, delay);
}

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  window.clearTimeout(introFallback);
  document.body.classList.add("intro-ending");
  window.setTimeout(() => {
    document.body.classList.remove("intro-active", "intro-ending");
    document.body.classList.add("intro-done");
    introVideo?.pause();
  }, 650);
}

if (introVideo && introScreen && document.body.classList.contains("intro-active")) {
  introVideo.preload = isPhone ? "metadata" : "auto";
  introVideo.muted = false;
  introVideo.volume = 1;
  introPlay?.addEventListener("click", () => {
    introScreen.classList.remove("intro-needs-tap");
    introVideo.muted = false;
    introVideo.volume = 1;
    introVideo.play().catch(() => {});
  });
  introSkip?.addEventListener("click", finishIntro);
  introVideo.addEventListener("ended", finishIntro, { once: true });
  introVideo.addEventListener("error", finishIntro, { once: true });
  introVideo.addEventListener("play", () => {
    introScreen.classList.remove("intro-needs-tap");
    if (Number.isFinite(introVideo.duration)) {
      setIntroFallback((introVideo.duration + 2) * 1000);
    }
  });

  const playIntro = introVideo.play();
  if (playIntro) {
    playIntro.catch(() => {
      introScreen.classList.add("intro-needs-tap");
    });
  }

  setIntroFallback(120000);
} else {
  document.body.classList.add("intro-done");
}

function tick() {
  if (!badge) return;
  seconds = Math.max(0, seconds - 1);
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  badge.textContent = `${hrs}:${mins}:${secs}`;
}

setInterval(tick, 1000);

document.querySelectorAll(".product-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -6;
    card.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
