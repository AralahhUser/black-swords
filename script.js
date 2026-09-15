const intro = document.querySelector("[data-intro]");
const introVideo = document.querySelector("[data-intro-video]");
const introBackdropVideo = document.querySelector("[data-intro-backdrop-video]");
const introAudio = document.querySelector("[data-intro-audio]");
const introSkip = document.querySelector("[data-intro-skip]");
const checkoutModal = document.querySelector("[data-checkout-modal]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutProduct = document.querySelector("[data-checkout-product]");
const checkoutClose = document.querySelector("[data-checkout-close]");
const paymentWhatsappNumber = "51947178845";
let checkoutTrigger = null;

const closeIntro = () => {
  if (!intro) return;
  introVideo?.pause();
  introBackdropVideo?.pause();
  intro.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
  document.dispatchEvent(new Event("intro:closed"));
};

const primeVideo = (video, { withSound = false } = {}) => {
  if (!video) return null;
  video.muted = !withSound;
  video.defaultMuted = !withSound;
  video.autoplay = true;
  video.volume = withSound ? 1 : 0;

  if (withSound) {
    video.removeAttribute("muted");
  } else {
    video.setAttribute("muted", "");
  }

  video.setAttribute("playsinline", "");
  return video.play();
};

const requestIntroAudio = () => {
  if (!intro || !introVideo) return;
  intro.classList.add("needs-audio");
  introAudio?.focus();
};

const playIntroWithAudio = () => {
  if (!introVideo) return null;
  intro?.classList.remove("needs-audio");
  try {
    introVideo.currentTime = 0;
  } catch {}
  return primeVideo(introVideo, { withSound: true });
};

if (intro && introVideo) {
  document.body.classList.add("intro-active");

  const attemptAutoplay = primeVideo(introVideo, { withSound: true });
  primeVideo(introBackdropVideo)?.catch(() => {});

  if (attemptAutoplay) {
    attemptAutoplay.catch(requestIntroAudio);
  }

  introVideo.addEventListener("ended", closeIntro);
  introAudio?.addEventListener("click", () => {
    playIntroWithAudio()?.catch(requestIntroAudio);
  });
  introSkip?.addEventListener("click", closeIntro);
}

const gohanCarousel = document.querySelector("[data-gohan-carousel]");

if (gohanCarousel) {
  const slides = [...gohanCarousel.querySelectorAll("[data-gohan-slide]")];
  const count = gohanCarousel.querySelector("[data-gohan-count]");
  let current = 0;
  let visible = false;
  let hovered = false;
  let timer = null;

  const showSlide = (next) => {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    count.textContent = `${current + 1} / ${slides.length}`;
    count.setAttribute("aria-label", `Image ${current + 1} of ${slides.length}`);
  };

  const restartTimer = () => {
    clearInterval(timer);
    timer = null;
    if (!visible || hovered || document.hidden || document.body.classList.contains("intro-active") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(() => showSlide(current + 1), 5000);
  };

  gohanCarousel.querySelector("[data-gohan-prev]")?.addEventListener("click", () => {
    showSlide(current - 1);
    restartTimer();
  });
  gohanCarousel.querySelector("[data-gohan-next]")?.addEventListener("click", () => {
    showSlide(current + 1);
    restartTimer();
  });

  if (window.matchMedia("(hover: hover)").matches) {
    gohanCarousel.addEventListener("mouseenter", () => { hovered = true; restartTimer(); });
    gohanCarousel.addEventListener("mouseleave", () => { hovered = false; restartTimer(); });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restartTimer();
    }, { threshold: .25 }).observe(gohanCarousel);
  } else {
    visible = true;
    restartTimer();
  }

  document.addEventListener("visibilitychange", restartTimer);
  document.addEventListener("intro:closed", restartTimer);
}

const openCheckout = (product, trigger) => {
  if (!checkoutModal || !checkoutForm || !checkoutProduct) return;
  checkoutTrigger = trigger || null;
  checkoutForm.reset();
  checkoutProduct.value = product;
  checkoutModal.classList.add("is-open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("checkout-active");
  checkoutModal.querySelector("input[name='size']")?.focus();
};

const closeCheckout = () => {
  if (!checkoutModal) return;
  checkoutModal.classList.remove("is-open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("checkout-active");
  checkoutTrigger?.focus();
};

document.querySelectorAll("[data-checkout-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openCheckout(button.dataset.product || "Black Swords", button);
  });
});

document.querySelectorAll(".product-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("button, a, input, select, textarea, label")) return;

    const button = card.querySelector("[data-checkout-open]");
    openCheckout(button?.dataset.product || card.dataset.title || "Black Swords", button);
  });
});

checkoutClose?.addEventListener("click", closeCheckout);

checkoutModal?.addEventListener("click", (event) => {
  if (event.target === checkoutModal) closeCheckout();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkoutModal?.classList.contains("is-open")) {
    closeCheckout();
  }
});

checkoutForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(checkoutForm);
  const product = String(formData.get("product") || "").trim();
  const size = String(formData.get("size") || "").trim();
  const delivery = String(formData.get("delivery") || "").trim();
  const address = String(formData.get("address") || "").replace(/\s+/g, " ").trim();

  if (!product || !size || !delivery || !address) {
    checkoutForm.reportValidity();
    return;
  }

  const message = [
    "Hola, Black Swords. Quiero realizar este pedido:",
    `Producto: ${product}`,
    `Talla: ${size}`,
    `Lugar de entrega: ${delivery}`,
    `Dirección o referencia: ${address}`,
    "Método de pago: Yape",
    "Por favor, envíenme el código QR de Yape para completar el pago."
  ].join("\n");

  window.location.href = `https://wa.me/${paymentWhatsappNumber}?text=${encodeURIComponent(message)}`;
});
