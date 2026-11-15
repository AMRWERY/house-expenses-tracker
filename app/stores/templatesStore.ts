import type { ExpenseTemplate, TemplateDraft } from "~/types/stores/templatesStore";

/**
 * Reusable starting points for expenses ("Coffee 45 EGP"). Using one only fills the Add form: nothing is recorded until the
 * person saves, and editing or deleting a template never changes expenses made from it.
 */
export const useTemplatesStore = defineStore("templates", () => {
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved
  const templates = ref<ExpenseTemplate[]>([]);
  const loaded = ref(false);

  async function load() {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    templates.value = await fetcher<ExpenseTemplate[]>("/api/templates");
    loaded.value = true;
  }

  function reset() {
    templates.value = [];
    loaded.value = false;
  }

  /** Saved on the server first; the list only changes once the server accepts it (throws otherwise). */
  async function add(draft: TemplateDraft) {
    const record = demo
      ? { id: `demo-${Date.now()}`, ...draft }
      : await $fetch<ExpenseTemplate>("/api/templates", { method: "POST", body: draft });
    templates.value = [...templates.value, record];
  }

  async function update(id: string, draft: TemplateDraft) {
    const record = demo
      ? { id, ...draft }
      : await $fetch<ExpenseTemplate>(`/api/templates/${id}`, { method: "PUT", body: draft });
    templates.value = templates.value.map((t) => (t.id === id ? record : t));
  }

  async function remove(id: string) {
    if (!demo) await $fetch(`/api/templates/${id}`, { method: "DELETE" });
    templates.value = templates.value.filter((t) => t.id !== id);
  }

  /** A category was deleted: the server moved its templates' expenses, so mirror it for templates too. */
  function reassignCategory(from: string, to: string) {
    templates.value = templates.value.map((t) => (t.cat === from ? { ...t, cat: to } : t));
  }

  return { templates, loaded, load, reset, add, update, remove, reassignCategory };
});
