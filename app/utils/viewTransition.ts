/**
 * Animated whole-page changes (theme, language) using the browser's View Transitions.
 * Browsers without them, and people who asked for reduced motion, just get the instant change.
 * The CSS for each `kind` lives in theme.css under html[data-vt="..."].
 */
export type ViewTransitionKind = "theme" | "locale";

type VT = { ready: Promise<void>; finished: Promise<void> };
type DocWithVT = Document & { startViewTransition?: (update: () => Promise<void> | void) => VT };

// Where the last click/tap happened: the theme change grows out of that point.
let point: { x: number; y: number } | null = null;

/** Client only, once: remember the last pointer position. */
export function trackPointer() {
  window.addEventListener("pointerdown", (e) => (point = { x: e.clientX, y: e.clientY }), {
    capture: true,
    passive: true,
  });
}

/** Run `update` (which changes the page) inside an animated transition. Resolves once the animation is done. */
export async function withViewTransition(update: () => Promise<void> | void, kind: ViewTransitionKind) {
  const doc = document as DocWithVT;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    await update();
    return;
  }

  const root = document.documentElement;
  root.dataset.vt = kind;
  const transition = doc.startViewTransition(async () => {
    await update();
    await nextTick(); // let Vue paint the new state before the browser captures it
  });

  if (kind === "theme") {
    transition.ready
      .then(() => {
        const x = point?.x ?? window.innerWidth / 2;
        const y = point?.y ?? 0;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  }

  try {
    await transition.finished;
  } catch {
    // skipped or interrupted: the change itself already happened
  } finally {
    delete root.dataset.vt;
  }
}
