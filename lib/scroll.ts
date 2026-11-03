/** Menggulir elemen ke area pandang; tanpa animasi bila pengguna memilih gerakan minimal. */
export function scrollIntoViewSmoothly(
  element: Element | null,
  block: ScrollLogicalPosition = "nearest",
) {
  if (!element) return;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block,
  });
}
