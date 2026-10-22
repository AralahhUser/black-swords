export const defaultConfig = {
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

const clone = (value) => JSON.parse(JSON.stringify(value));

export const normalizeConfig = (candidate = {}) => {
  const incomingProducts = Array.isArray(candidate.products) ? candidate.products : [];
  const incomingDiscounts = Array.isArray(candidate.discounts) ? candidate.discounts : [];
  const products = defaultConfig.products.map((fallback) => {
    const source = incomingProducts.find((item) => item?.id === fallback.id) || {};
    const price = Number(source.price);
    const stock = source.stock === "" || source.stock === null || source.stock === undefined
      ? fallback.stock
      : Number(source.stock);
    return {
      ...fallback,
      name: String(source.name || fallback.name).trim() || fallback.name,
      price: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : fallback.price,
      stock: stock === null || !Number.isFinite(stock) ? null : Math.max(0, Math.floor(stock)),
    };
  });
  const discounts = (incomingDiscounts.length ? incomingDiscounts : defaultConfig.discounts)
    .map((item) => ({
      code: String(item?.code || "").trim(),
      rate: Math.min(100, Math.max(0, Number(item?.rate) || 0)),
      active: item?.active !== false,
    }))
    .filter((item) => item.code);
  return {
    releaseTitle: String(candidate.releaseTitle || defaultConfig.releaseTitle).trim() || defaultConfig.releaseTitle,
    instagramUrl: String(candidate.instagramUrl || defaultConfig.instagramUrl).trim() || defaultConfig.instagramUrl,
    whatsappNumber: String(candidate.whatsappNumber || defaultConfig.whatsappNumber).replace(/\D/g, ""),
    products,
    discounts,
  };
};

export const copyDefaultConfig = () => clone(defaultConfig);
