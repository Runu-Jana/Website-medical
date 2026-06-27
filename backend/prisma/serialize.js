// Helpers to shape Prisma records like the old Mongoose responses
// (expose `_id`, keep populated `brand` / `category` / `categories`).

export const withId = (o) => (o ? { ...o, _id: o.id } : o);

export const serializeBrand = withId;

export const serializeCategory = (c, productCount) =>
  c ? { ...c, _id: c.id, ...(productCount !== undefined ? { productCount } : {}) } : c;

export const serializeUser = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return { ...rest, _id: u.id };
};

export const serializeProduct = (p) => {
  if (!p) return p;
  const categories = (p.categories || []).map((c) => ({ ...c, _id: c.id }));
  return {
    ...p,
    _id: p.id,
    brand: p.brand ? { ...p.brand, _id: p.brand.id } : null,
    categories,
    category: categories[0] || null,
    variants: p.variants || [],
    reviews: p.reviews || [],
    tags: p.tags || [],
    images: p.images || [],
  };
};

export const serializeOrder = (o) => {
  if (!o) return o;
  return {
    ...o,
    _id: o.id,
    user: o.user ? serializeUser(o.user) : o.user,
    items: o.items || [],
  };
};
