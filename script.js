const intro = document.querySelector("[data-intro]");
const introVideo = document.querySelector("[data-intro-video]");
const introBackdropVideo = document.querySelector("[data-intro-backdrop-video]");
const introSkip = document.querySelector("[data-intro-skip]");

const closeIntro = () => {
  if (!intro) return;
  introVideo?.pause();
  introBackdropVideo?.pause();
  intro.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
};

const primeMutedAutoplay = (video) => {
  if (!video) return null;
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.volume = 0;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  return video.play();
};

if (intro && introVideo) {
  document.body.classList.add("intro-active");

  const attemptAutoplay = primeMutedAutoplay(introVideo);
  primeMutedAutoplay(introBackdropVideo)?.catch(() => {});

  if (attemptAutoplay) {
    attemptAutoplay.catch(closeIntro);
  }

  introVideo.addEventListener("ended", closeIntro);
  introSkip?.addEventListener("click", closeIntro);
}
