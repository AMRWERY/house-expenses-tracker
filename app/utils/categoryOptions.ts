import type { IconName } from "~/utils/icons";

/** Colors offered when creating a category (all readable as an icon tint in light and dark). */
export const CATEGORY_COLOR_CHOICES = [
  "#F97316",
  "#EAB308",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#64748B",
] as const;

/** Icons offered when creating a category. */
export const CATEGORY_ICON_CHOICES: IconName[] = [
  "tag",
  "cart",
  "home",
  "bills",
  "transport",
  "health",
  "education",
  "fun",
  "gift",
  "coffee",
  "shirt",
  "plane",
  "phone",
  "wallet",
];

export const CATEGORY_NAME_MAX = 24;
