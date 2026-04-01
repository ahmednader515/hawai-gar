export const SOLUTION_SLUGS = ["shipping", "inland", "digital", "cargo"] as const;

export type SolutionSlug = (typeof SOLUTION_SLUGS)[number];

/**
 * `land-shipping-1.png` and `land-shipping-2.png` are the same (or nearly the same) photo in this
 * project, so حلول الشحن + النقل البري hovers looked identical. Shipping/inland use 5 and 4 instead
 * (same assets as the feature carousel) so the two hovers are always different. Digital/cargo unchanged.
 */
export const SOLUTION_IMAGES: Record<SolutionSlug, string> = {
  shipping: "/land-shipping-5.png",
  inland: "/land-shipping-4.png",
  digital: "/land-shipping-3.png",
  cargo: "/hero.png",
};

/** Passed to next/image `className` (with object-cover) for hero + section overlays */
export const SOLUTION_IMAGE_LAYOUT: Record<SolutionSlug, string> = {
  shipping: "object-cover object-center",
  inland: "object-cover object-center",
  digital: "object-cover object-center",
  cargo: "object-cover object-center",
};

export function isSolutionSlug(value: string): value is SolutionSlug {
  return (SOLUTION_SLUGS as readonly string[]).includes(value);
}
