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
    "Hola Black Swords, quiero realizar este pedido:",
    `Producto: ${product}`,
    `Talla: ${size}`,
    `Lugar de entrega: ${delivery}`,
    `Direccion o referencia: ${address}`,
    "Metodo de pago: Yape",
    "Por favor enviame el codigo QR para realizar el pago."
  ].join("\n");

  window.location.href = `https://wa.me/${paymentWhatsappNumber}?text=${encodeURIComponent(message)}`;
});
