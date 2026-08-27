const intro = document.querySelector("[data-intro]");
const introVideo = document.querySelector("[data-intro-video]");
const introSkip = document.querySelector("[data-intro-skip]");

const closeIntro = () => {
  if (!intro) return;
  introVideo?.pause();
  intro.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
};

if (intro && introVideo) {
  document.body.classList.add("intro-active");
  introVideo.muted = true;
  introVideo.defaultMuted = true;
  introVideo.autoplay = true;
  introVideo.volume = 0;
  introVideo.setAttribute("muted", "");
  introVideo.setAttribute("playsinline", "");

  const attemptAutoplay = introVideo.play();

  if (attemptAutoplay) {
    attemptAutoplay.catch(closeIntro);
  }

  introVideo.addEventListener("ended", closeIntro);
  introSkip?.addEventListener("click", closeIntro);
}
