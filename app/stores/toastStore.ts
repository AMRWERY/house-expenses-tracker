interface Toast {
  id: number;
  text: string;
  /** optional button on the toast (e.g. "Undo") and what it does */
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

/** One short message at the bottom of the screen that dismisses itself. */
export const useToastStore = defineStore("toast", () => {
  const toast = ref<Toast | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextId = 1;

  function dismiss() {
    clearTimeout(timer);
    toast.value = null;
  }

  function show(next: Omit<Toast, "id">, duration = 6000) {
    clearTimeout(timer);
    toast.value = { ...next, id: nextId++ };
    timer = setTimeout(dismiss, duration);
  }

  /** Run the toast's action once, then close it. */
  async function runAction() {
    const action = toast.value?.onAction;
    dismiss();
    await action?.();
  }

  return { toast, show, dismiss, runAction };
});
