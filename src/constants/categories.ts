export const RECIPE_CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'diet', label: 'Ăn kiêng' },
  { key: 'vegetarian', label: 'Chay' },
  { key: 'dessert', label: 'Tráng miệng' },
  { key: 'quick', label: 'Nhanh' },
  { key: 'healthy', label: 'Healthy' },
] as const;

export type RecipeCategoryKey = (typeof RECIPE_CATEGORIES)[number]['key'];
