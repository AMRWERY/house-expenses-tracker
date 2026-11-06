const nf = new Intl.NumberFormat('en-US') // Western digits in both languages (design.md)
export const formatNumber = (n: number) => nf.format(n)

const pad = (n: number) => String(n).padStart(2, '0')
export const toISODate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Dev-only preview mode (?demo=1): local sample data, no sign-in. Never active in production builds. */
export const isDemo = (query: Record<string, unknown>) => import.meta.dev && query.demo === '1'

/** Load the signed-in user's expenses from the server (once per session). */
export async function loadExpenses() {
  const expenses = useState<Expense[]>('expenses', () => [])
  const loaded = useState('expenses-loaded', () => false)
  if (loaded.value) return
  expenses.value = await useRequestFetch()<Expense[]>('/api/expenses')
  loaded.value = true
}

/** Forget the previous user's data (on sign-out). */
export function resetExpenses() {
  useState<Expense[]>('expenses', () => []).value = []
  useState('expenses-loaded', () => false).value = false
}

export function useExpenses() {
  const route = useRoute()
  const demo = isDemo(route.query)
  const { t, locale } = useI18n()
  const dateLocale = computed(() => (locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'))

  // ?today=YYYY-MM-DD lets the preview pin the date.
  const today = typeof route.query.today === 'string' ? new Date(`${route.query.today}T12:00:00`) : new Date()
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate())

  // Sample data for the current month (days counted back from today, clamped to the 1st). Total = 8,450.
  const ago = (n: number) => Math.max(1, today.getDate() - n)
  const base = { y: today.getFullYear(), m: today.getMonth() }
  const sample: Omit<Expense, 'id' | 'y' | 'm'>[] = [
    { titleKey: 'sample.supermarket', cat: 'groceries', amount: 450, day: ago(0) },
    { titleKey: 'sample.pharmacy', cat: 'health', amount: 200, day: ago(0) },
    { titleKey: 'sample.electricity', cat: 'bills', amount: 950, day: ago(1) },
    { titleKey: 'sample.uber', cat: 'transport', amount: 120, day: ago(1) },
    { titleKey: 'sample.restaurant', cat: 'groceries', amount: 380, day: ago(3) },
    { titleKey: 'sample.supermarket', cat: 'groceries', amount: 1850, day: ago(4) },
    { titleKey: 'sample.netflix', cat: 'fun', amount: 350, day: ago(4) },
    { titleKey: 'sample.rent', cat: 'bills', amount: 3500, day: 1 },
    { titleKey: 'sample.fuel', cat: 'transport', amount: 650, day: 1 },
  ]
  // Sample history for the 5 previous full months (category totals), so the Compare page has data.
  const history: Partial<Record<CategoryKey, number>>[] = [
    { groceries: 3100, bills: 4450, transport: 780, health: 260, fun: 400, other: 180 },
    { groceries: 2700, bills: 4300, transport: 640, health: 520, education: 1200, fun: 300 },
    { groceries: 2850, bills: 4200, transport: 590, health: 140, fun: 650, other: 220 },
    { groceries: 2400, bills: 4350, transport: 720, health: 300, fun: 900, other: 150 },
    { groceries: 2600, bills: 4250, transport: 610, health: 410, fun: 280, other: 90 },
  ]
  const initial = (): Expense[] => {
    let id = 0
    const current = sample.map(e => ({ ...e, ...base, id: ++id }))
    const past = history.flatMap((cats, k) => {
      const d = new Date(base.y, base.m - (k + 1), 1)
      return Object.entries(cats).map(([cat, amount], i) => ({
        id: ++id, cat: cat as CategoryKey, amount: amount as number, y: d.getFullYear(), m: d.getMonth(), day: 2 + i * 4,
      }))
    })
    return [...current, ...past]
  }
  // useState keeps the list when navigating between pages. Real users get theirs from the server
  // (loaded by the auth middleware); sample data is only for the dev preview.
  const expenses = useState<Expense[]>('expenses', () => (demo ? initial() : []))

  // ?empty=1 starts on a month with no data (next month).
  const view = ref({ y: base.y, m: route.query.empty ? base.m + 1 : base.m })

  const shift = (delta: number) => {
    const d = new Date(view.value.y, view.value.m + delta, 1)
    view.value = { y: d.getFullYear(), m: d.getMonth() }
  }

  const monthLabel = computed(() => {
    const d = new Date(view.value.y, view.value.m, 1)
    return `${new Intl.DateTimeFormat(dateLocale.value, { month: 'long' }).format(d)} ${d.getFullYear()}`
  })

  const items = computed(() => expenses.value.filter(e => e.y === view.value.y && e.m === view.value.m))
  const total = computed(() => items.value.reduce((s, e) => s + e.amount, 0))

  const dayLabel = (d: number) => {
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const date = new Date(view.value.y, view.value.m, d)
    const diff = Math.round((t0.getTime() - date.getTime()) / 864e5)
    if (diff === 0) return t('today')
    if (diff === 1) return t('yesterday')
    return new Intl.DateTimeFormat(dateLocale.value, { day: 'numeric', month: 'long' }).format(date)
  }

  const groups = computed(() => {
    const byDay = new Map<number, Expense[]>()
    items.value.forEach(e => byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]))
    return [...byDay.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([day, list]) => ({ day, label: dayLabel(day), items: list }))
  })

  // Add (no id) or update (with id) from a sheet draft, then jump to that month so it's visible.
  // Saved on the server first; the list only changes once the server accepts it (throws otherwise).
  async function save(draft: ExpenseDraft, id?: number) {
    const [y = base.y, mo = base.m + 1, d = 1] = draft.date.split('-').map(Number)
    const data = { cat: draft.cat, amount: draft.amount, y, m: mo - 1, day: d, note: draft.note.trim() || undefined }
    const editing = id !== undefined

    let record: Expense
    if (demo) {
      record = { id: editing ? id : Math.max(0, ...expenses.value.map(e => e.id)) + 1, ...data }
    } else {
      record = await $fetch<Expense>(editing ? `/api/expenses/${id}` : '/api/expenses', {
        method: editing ? 'PUT' : 'POST',
        body: data,
      })
    }
    expenses.value = editing ? expenses.value.map(e => (e.id === id ? record : e)) : [...expenses.value, record]
    view.value = { y, m: mo - 1 }
  }

  async function remove(id: number) {
    if (!demo) await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    expenses.value = expenses.value.filter(e => e.id !== id)
  }

  return { expenses, current: base, view, monthLabel, items, total, groups, todayISO, dateLocale, save, remove, prev: () => shift(-1), next: () => shift(1) }
}
