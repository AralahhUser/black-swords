const intro = document.querySelector("[data-intro]");
const introVideo = document.querySelector("[data-intro-video]");
const introBackdropVideo = document.querySelector("[data-intro-backdrop-video]");
const introAudio = document.querySelector("[data-intro-audio]");
const introSkip = document.querySelector("[data-intro-skip]");
const checkoutModal = document.querySelector("[data-checkout-modal]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutProduct = document.querySelector("[data-checkout-product]");
const checkoutPrice = document.querySelector("[data-checkout-price]");
const discountCodeInput = document.querySelector("[data-discount-code]");
const discountStatus = document.querySelector("[data-discount-status]");
const checkoutClose = document.querySelector("[data-checkout-close]");
const adminModal = document.querySelector("[data-admin-modal]");
const adminOpen = document.querySelector("[data-admin-open]");
const adminClose = document.querySelector("[data-admin-close]");
const adminAuthView = document.querySelector("[data-admin-auth-view]");
const adminAuthForm = document.querySelector("[data-admin-auth-form]");
const adminAuthCopy = document.querySelector("[data-admin-auth-copy]");
const adminAuthSubmit = document.querySelector("[data-admin-auth-submit]");
const adminAuthStatus = document.querySelector("[data-admin-auth-status]");
const adminConfirmField = document.querySelector("[data-admin-confirm-field]");
const adminDashboard = document.querySelector("[data-admin-dashboard]");
const adminForm = document.querySelector("[data-admin-form]");
const adminProductList = document.querySelector("[data-admin-product-list]");
const adminDiscountList = document.querySelector("[data-admin-discount-list]");
const adminStatus = document.querySelector("[data-admin-status]");
const adminDraftButton = document.querySelector("[data-admin-draft]");
const adminPublishButton = document.querySelector("[data-admin-publish]");
const adminLogout = document.querySelector("[data-admin-logout]");
const adminAddDiscount = document.querySelector("[data-admin-add-discount]");
const storeConfigKey = "blackSwordsStoreConfig";
const adminDraftKey = "blackSwordsAdminDraft";
const adminAuthKey = "blackSwordsAdminAuth";
let checkoutTrigger = null;
let introClosing = false;

const defaultStoreConfig = {
  releaseTitle: "New DBZ Release",
  instagramUrl: "https://www.instagram.com/blackswords_official/",
  whatsappNumber: "51947178845",
  products: [
    { id: "trunkz", name: "Trunkz Pump Cover", price: 129, stock: null },
    { id: "gohan", name: "Gohan Pump Cover", price: 129, stock: null },
    { id: "broly", name: "Super Broly Pump Cover", price: 129, stock: null },
  ],
  discounts: [
    { code: "Calitos", rate: 12, active: true },
    { code: "pollitoaaron", rate: 10, active: true },
    { code: "alesso69", rate: 10, active: true },
    { code: "Italo", rate: 10, active: true },
  ],
};

const cloneConfig = (config) => JSON.parse(JSON.stringify(config));

const readStored = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const normalizeStoreConfig = (candidate = {}) => {
  const incomingProducts = Array.isArray(candidate.products) ? candidate.products : [];
  const incomingDiscounts = Array.isArray(candidate.discounts) ? candidate.discounts : [];
  const products = defaultStoreConfig.products.map((fallback) => {
    const source = incomingProducts.find((item) => item?.id === fallback.id) || {};
    const price = Number(source.price);
    const stock = source.stock === "" || source.stock === null || source.stock === undefined
      ? fallback.stock
      : Number(source.stock);
    return {
      ...fallback,
      name: String(source.name || fallback.name).trim() || fallback.name,
      price: Number.isFinite(price) && price >= 0 ? price : fallback.price,
      stock: stock === null || !Number.isFinite(stock) ? null : Math.max(0, Math.floor(stock)),
    };
  });
  const discounts = incomingDiscounts.length
    ? incomingDiscounts.map((item) => ({
        code: String(item?.code || "").trim(),
        rate: Math.min(100, Math.max(0, Number(item?.rate) || 0)),
        active: item?.active !== false,
      })).filter((item) => item.code)
    : cloneConfig(defaultStoreConfig.discounts);
  return {
    releaseTitle: String(candidate.releaseTitle || defaultStoreConfig.releaseTitle).trim() || defaultStoreConfig.releaseTitle,
    instagramUrl: String(candidate.instagramUrl || defaultStoreConfig.instagramUrl).trim() || defaultStoreConfig.instagramUrl,
    whatsappNumber: String(candidate.whatsappNumber || defaultStoreConfig.whatsappNumber).replace(/\D/g, ""),
    products,
    discounts,
  };
};

let publishedConfig = normalizeStoreConfig(readStored(storeConfigKey) || defaultStoreConfig);
let draftConfig = normalizeStoreConfig(readStored(adminDraftKey) || publishedConfig);
let adminAuthenticated = false;

const getProductConfig = (name) => publishedConfig.products.find((product) => product.name === name) || publishedConfig.products[0];

const getDiscountMap = () => new Map(
  publishedConfig.discounts
    .filter((discount) => discount.active)
    .map((discount) => [discount.code.toLowerCase(), Number(discount.rate) / 100]),
);

const applyStoreConfig = (config) => {
  const releaseTitle = document.querySelector("#release-title");
  if (releaseTitle) releaseTitle.textContent = config.releaseTitle;

  const instagram = document.querySelector(".social-links a[href*='instagram']");
  if (instagram) instagram.href = config.instagramUrl;

  document.querySelectorAll("[data-product-card]").forEach((card) => {
    const product = config.products.find((item) => item.id === card.dataset.productId);
    if (!product) return;
    const title = card.querySelector("h3");
    const price = card.querySelector("[data-product-price], .product-price");
    const stock = card.querySelector("[data-product-stock]");
    const buy = card.querySelector("[data-checkout-open]");
    const media = card.querySelector("[data-product-carousel]");
    if (title) title.textContent = product.name;
    if (price) price.textContent = "S/ " + product.price.toFixed(2);
    if (stock) {
      stock.textContent = product.stock === null ? "" : product.stock > 0 ? `${product.stock} disponibles` : "Agotado";
    }
    if (buy) {
      buy.dataset.product = product.name;
      buy.disabled = product.stock !== null && product.stock <= 0;
      buy.textContent = product.stock !== null && product.stock <= 0 ? "Agotado" : "Comprar";
    }
    if (media) media.setAttribute("aria-label", `${product.name} front and back views`);
    card.dataset.title = product.name;
    card.classList.toggle("sold-out", product.stock !== null && product.stock <= 0);
  });
};

const updateCheckoutPrice = () => {
  const code = discountCodeInput?.value.trim().toLowerCase() || "";
  const product = getProductConfig(checkoutProduct?.value || "");
  const discountRate = getDiscountMap().get(code);
  const applied = discountRate !== undefined;
  const price = applied ? product.price * (1 - discountRate) : product.price;
  if (checkoutPrice) checkoutPrice.value = "S/ " + price.toFixed(2);
  if (discountStatus) {
    discountStatus.textContent = code && !applied
      ? "Código no válido"
      : applied
        ? "Descuento aplicado: " + Math.round(discountRate * 100) + "% · S/ " + price.toFixed(2)
        : "";
    discountStatus.classList.toggle("is-valid", applied);
    discountStatus.classList.toggle("is-invalid", Boolean(code) && !applied);
  }
  return { code, applied, price };
};

applyStoreConfig(publishedConfig);

const loadPublicConfig = async () => {
  try {
    const response = await fetch("/api/public-config", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
    publishedConfig = normalizeStoreConfig(await response.json());
    draftConfig = cloneConfig(publishedConfig);
    applyStoreConfig(publishedConfig);
    updateCheckoutPrice();
  } catch (error) {
    console.warn("Black Swords backend unavailable; using local defaults.", error);
  }
};

loadPublicConfig();

const closeIntro = () => {
  if (!intro || introClosing || intro.classList.contains("is-hidden")) return;
  introClosing = true;
  intro.classList.add("is-closing");
  window.setTimeout(() => {
    introVideo?.pause();
    introBackdropVideo?.pause();
    intro.classList.remove("needs-audio");
    intro.classList.add("is-hidden");
    document.body.classList.remove("intro-active");
    document.dispatchEvent(new Event("intro:closed"));
  }, 700);
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
  if (!intro || !introVideo || intro.classList.contains("is-hidden")) return;
  intro.classList.add("needs-audio");
  introBackdropVideo?.pause();
  introAudio?.focus();
};

const playIntroWithAudio = () => {
  if (!introVideo) return null;
  intro?.classList.remove("needs-audio");
  try {
    introVideo.currentTime = 0;
    if (introBackdropVideo) introBackdropVideo.currentTime = 0;
  } catch {}
  primeVideo(introBackdropVideo)?.catch(() => {});
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
  // Keep the blurred edges on the same scene as the foreground video.
  introVideo.addEventListener("timeupdate", () => {
    if (introBackdropVideo?.readyState >= 2 &&
        Math.abs(introBackdropVideo.currentTime - introVideo.currentTime) > .3) {
      introBackdropVideo.currentTime = introVideo.currentTime;
    }
  });
  introAudio?.addEventListener("click", () => {
    playIntroWithAudio()?.catch(requestIntroAudio);
  });
  introSkip?.addEventListener("click", closeIntro);
}

document.querySelectorAll("[data-product-carousel]").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll("[data-gallery-slide]")];
  const count = carousel.querySelector("[data-gallery-count]");
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

  carousel.querySelector("[data-gallery-prev]")?.addEventListener("click", () => {
    showSlide(current - 1);
    restartTimer();
  });
  carousel.querySelector("[data-gallery-next]")?.addEventListener("click", () => {
    showSlide(current + 1);
    restartTimer();
  });

  if (window.matchMedia("(hover: hover)").matches) {
    carousel.addEventListener("mouseenter", () => { hovered = true; restartTimer(); });
    carousel.addEventListener("mouseleave", () => { hovered = false; restartTimer(); });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restartTimer();
    }, { threshold: .25 }).observe(carousel);
  } else {
    visible = true;
    restartTimer();
  }

  document.addEventListener("visibilitychange", restartTimer);
  document.addEventListener("intro:closed", restartTimer);
});

const openCheckout = (product, trigger) => {
  if (!checkoutModal || !checkoutForm || !checkoutProduct) return;
  checkoutTrigger = trigger || null;
  checkoutForm.reset();
  checkoutProduct.value = product;
  updateCheckoutPrice();
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
discountCodeInput?.addEventListener("input", updateCheckoutPrice);

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
  const { code, applied, price } = updateCheckoutPrice();

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
    "Precio: S/ " + price.toFixed(2),
    "Descuento: " + (applied ? code : "No aplicado"),
    "Método de pago: Yape",
    "Por favor, envíenme el código QR de Yape para completar el pago."
  ].join("\n");

  const paymentWhatsappNumber = publishedConfig.whatsappNumber.replace(/\D/g, "");
  window.location.href = `https://wa.me/${paymentWhatsappNumber}?text=${encodeURIComponent(message)}`;
});

const setAdminStatus = (message, state = "") => {
  if (!adminStatus) return;
  adminStatus.textContent = message;
  adminStatus.classList.toggle("is-valid", state === "valid");
  adminStatus.classList.toggle("is-invalid", state === "invalid");
};

const setAuthStatus = (message, state = "") => {
  if (!adminAuthStatus) return;
  adminAuthStatus.textContent = message;
  adminAuthStatus.classList.toggle("is-valid", state === "valid");
  adminAuthStatus.classList.toggle("is-invalid", state === "invalid");
};

const createAdminField = ({ label, value = "", type = "text", className = "", placeholder = "", dataset = {} }) => {
  const wrapper = document.createElement("label");
  wrapper.className = `admin-field ${className}`.trim();
  const caption = document.createElement("span");
  caption.textContent = label;
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  Object.entries(dataset).forEach(([key, dataValue]) => {
    input.dataset[key] = dataValue;
  });
  wrapper.append(caption, input);
  return wrapper;
};

const renderAdminProductList = (config) => {
  if (!adminProductList) return;
  adminProductList.replaceChildren();
  config.products.forEach((product) => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.dataset.productId = product.id;
    row.append(
      createAdminField({ label: "Producto", value: product.name, dataset: { adminProductName: "" } }),
      createAdminField({ label: "Precio (S/)", value: product.price.toFixed(2), type: "number", dataset: { adminProductPrice: "" } }),
      createAdminField({ label: "Stock", value: product.stock === null ? "" : product.stock, type: "number", placeholder: "Sin límite", dataset: { adminProductStock: "" } }),
    );
  });
};

const renderAdminDiscountList = (config) => {
  if (!adminDiscountList) return;
  adminDiscountList.replaceChildren();
  config.discounts.forEach((discount) => {
    const row = document.createElement("div");
    row.className = "admin-discount-row";
    const code = createAdminField({ label: "Código", value: discount.code, dataset: { adminDiscountCode: "" } });
    const rate = createAdminField({ label: "% descuento", value: discount.rate, type: "number", dataset: { adminDiscountRate: "" } });
    const activeLabel = document.createElement("label");
    activeLabel.className = "admin-toggle";
    const active = document.createElement("input");
    active.type = "checkbox";
    active.checked = discount.active;
    active.dataset.adminDiscountActive = "";
    const activeText = document.createElement("span");
    activeText.textContent = "Activo";
    activeLabel.append(active, activeText);
    const remove = document.createElement("button");
    remove.className = "admin-remove-button";
    remove.type = "button";
    remove.dataset.adminRemoveDiscount = "";
    remove.textContent = "Eliminar";
    row.append(code, rate, activeLabel, remove);
    adminDiscountList.append(row);
  });
};

const renderAdminForm = (config) => {
  const normalized = normalizeStoreConfig(config);
  renderAdminProductList(normalized);
  renderAdminDiscountList(normalized);
  const releaseTitle = document.querySelector("[data-admin-release-title]");
  const instagram = document.querySelector("[data-admin-instagram]");
  const whatsapp = document.querySelector("[data-admin-whatsapp]");
  if (releaseTitle) releaseTitle.value = normalized.releaseTitle;
  if (instagram) instagram.value = normalized.instagramUrl;
  if (whatsapp) whatsapp.value = normalized.whatsappNumber;
  draftConfig = normalized;
};

const readAdminForm = () => {
  const products = [...(adminProductList?.querySelectorAll(".admin-product-row") || [])].map((row) => ({
    id: row.dataset.productId,
    name: row.querySelector("[data-admin-product-name]")?.value || "",
    price: Number(row.querySelector("[data-admin-product-price]")?.value),
    stock: row.querySelector("[data-admin-product-stock]")?.value || null,
  }));
  const discounts = [...(adminDiscountList?.querySelectorAll(".admin-discount-row") || [])].map((row) => ({
    code: row.querySelector("[data-admin-discount-code]")?.value || "",
    rate: Number(row.querySelector("[data-admin-discount-rate]")?.value),
    active: row.querySelector("[data-admin-discount-active]")?.checked !== false,
  }));
  return normalizeStoreConfig({
    products,
    discounts,
    releaseTitle: document.querySelector("[data-admin-release-title]")?.value,
    instagramUrl: document.querySelector("[data-admin-instagram]")?.value,
    whatsappNumber: document.querySelector("[data-admin-whatsapp]")?.value,
  });
};

const saveAdminDraft = () => {
  const config = readAdminForm();
  return fetch("/api/admin/config", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "draft", config }),
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo guardar el borrador.");
    draftConfig = normalizeStoreConfig(payload.config || config);
    setAdminStatus("Borrador guardado en la base de datos.", "valid");
    return draftConfig;
  }).catch((error) => {
    setAdminStatus(error.message || "Backend no disponible.", "invalid");
    throw error;
  });
};

const publishAdminChanges = async () => {
  if (!window.confirm("¿Dar OK y publicar estos cambios en esta tienda?")) return;
  const config = readAdminForm();
  try {
    const response = await fetch("/api/admin/config", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "publish", config }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo publicar.");
    publishedConfig = normalizeStoreConfig(payload.config || config);
    draftConfig = cloneConfig(publishedConfig);
    applyStoreConfig(publishedConfig);
    updateCheckoutPrice();
    setAdminStatus("Cambios publicados en la base de datos.", "valid");
  } catch (error) {
    setAdminStatus(error.message || "Backend no disponible.", "invalid");
  }
};

let adminSetupMode = false;

const showAdminAuth = async () => {
  let isSetup = false;
  try {
    const response = await fetch("/api/admin/auth", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Backend no disponible.");
    isSetup = !(await response.json()).configured;
  } catch (error) {
    setAuthStatus(error.message || "Backend no disponible.", "invalid");
  }
  adminSetupMode = isSetup;
  adminAuthView.hidden = false;
  adminDashboard.hidden = true;
  adminAuthForm?.reset();
  adminConfirmField.hidden = !isSetup;
  adminConfirmField?.querySelector("input")?.toggleAttribute("required", isSetup);
  if (adminAuthCopy) adminAuthCopy.textContent = isSetup
    ? "Configura el acceso para administrar la tienda."
    : "Ingresa tus credenciales para continuar.";
  if (adminAuthSubmit) adminAuthSubmit.textContent = isSetup ? "Crear acceso" : "Ingresar";
  setAuthStatus("");
};

const showAdminDashboard = () => {
  adminAuthenticated = true;
  adminAuthView.hidden = true;
  adminDashboard.hidden = false;
  fetch("/api/admin/config", { credentials: "same-origin", cache: "no-store" })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar la configuración.");
      draftConfig = normalizeStoreConfig(payload);
      renderAdminForm(draftConfig);
      setAdminStatus("Configuración cargada desde la base de datos.");
    })
    .catch((error) => {
      renderAdminForm(draftConfig);
      setAdminStatus(error.message || "Backend no disponible.", "invalid");
    });
};

const openAdmin = (event) => {
  event?.preventDefault();
  if (!adminModal) return;
  showAdminAuth();
  adminModal.classList.add("is-open");
  adminModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-active");
  window.setTimeout(() => document.querySelector("[data-admin-id]")?.focus(), 0);
};

const closeAdmin = () => {
  if (!adminModal) return;
  adminModal.classList.remove("is-open");
  adminModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("admin-active");
};

adminOpen?.addEventListener("click", openAdmin);
adminClose?.addEventListener("click", closeAdmin);
adminModal?.addEventListener("click", (event) => {
  if (event.target === adminModal) closeAdmin();
});

adminAuthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = String(document.querySelector("[data-admin-id]")?.value || "").trim();
  const password = String(document.querySelector("[data-admin-password]")?.value || "");
  const confirmPassword = String(document.querySelector("[data-admin-confirm]")?.value || "");
  if (id.length < 3 || password.length < 8) {
    setAuthStatus("Usa un ID de 3 caracteres y una contraseña de 8 como mínimo.", "invalid");
    return;
  }
  if (adminSetupMode) {
    if (password !== confirmPassword) {
      setAuthStatus("Las contraseñas no coinciden.", "invalid");
      return;
    }
  }
  try {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: adminSetupMode ? "setup" : "login", id, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo iniciar sesión.");
    setAuthStatus("");
    showAdminDashboard();
  } catch (error) {
    setAuthStatus(error.message || "No se pudo iniciar sesión.", "invalid");
  }
});

adminForm?.addEventListener("input", () => {
  setAdminStatus("Cambios sin guardar.");
});

adminDraftButton?.addEventListener("click", () => { saveAdminDraft().catch(() => {}); });
adminPublishButton?.addEventListener("click", publishAdminChanges);
adminLogout?.addEventListener("click", async () => {
  await fetch("/api/admin/auth", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
  }).catch(() => {});
  adminAuthenticated = false;
  showAdminAuth();
});
adminAddDiscount?.addEventListener("click", () => {
  const current = readAdminForm();
  current.discounts.push({ code: "", rate: 10, active: true });
  renderAdminDiscountList(current);
  setAdminStatus("Nuevo código pendiente de guardar.");
});
adminDiscountList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-admin-remove-discount]");
  if (!removeButton) return;
  removeButton.closest(".admin-discount-row")?.remove();
  setAdminStatus("Cambios sin guardar.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && adminModal?.classList.contains("is-open")) closeAdmin();
});
