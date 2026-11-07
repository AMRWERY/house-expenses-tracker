import type { Expense } from '~/types/utils'
import type { CategoryKey } from '~/utils/categories'

/**
 * Sample expenses for the dev-only preview (?demo=1): the current month (days counted back from `today`,
 * clamped to the 1st, total 8,450) plus category totals for the 5 previous months so Compare has data.
 */
export function buildDemoExpenses(today: Date): Expense[] {
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
  const history: Partial<Record<CategoryKey, number>>[] = [
    { groceries: 3100, bills: 4450, transport: 780, health: 260, fun: 400, other: 180 },
    { groceries: 2700, bills: 4300, transport: 640, health: 520, education: 1200, fun: 300 },
    { groceries: 2850, bills: 4200, transport: 590, health: 140, fun: 650, other: 220 },
    { groceries: 2400, bills: 4350, transport: 720, health: 300, fun: 900, other: 150 },
    { groceries: 2600, bills: 4250, transport: 610, health: 410, fun: 280, other: 90 },
  ]

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
