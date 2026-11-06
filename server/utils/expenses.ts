const CATEGORIES = ['groceries', 'bills', 'transport', 'health', 'education', 'fun', 'other']

export interface ExpenseRecord {
  id: number
  cat: string
  amount: number
  y: number
  m: number
  day: number
  note?: string
}

export type ExpenseInput = Omit<ExpenseRecord, 'id'>

const bad = (message: string) => createError({ statusCode: 400, message })
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** Validate a request body; never trust the client's shape. */
export function parseExpenseInput(body: unknown): ExpenseInput {
  const b = (body ?? {}) as Record<string, unknown>

  if (typeof b.cat !== 'string' || !CATEGORIES.includes(b.cat)) throw bad('invalid_category')
  if (typeof b.amount !== 'number' || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9) throw bad('invalid_amount')
  if (!isInt(b.y, 2000, 2100) || !isInt(b.m, 0, 11) || !isInt(b.day, 1, 31)) throw bad('invalid_date')
  const d = new Date(b.y, b.m, b.day)
  if (d.getMonth() !== b.m || d.getDate() !== b.day) throw bad('invalid_date') // e.g. 31 Feb

  let note: string | undefined
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== 'string' || b.note.length > 80) throw bad('invalid_note')
    note = b.note.trim() || undefined
  }

  return { cat: b.cat, amount: Math.round(b.amount * 100) / 100, y: b.y, m: b.m, day: b.day, note }
}

const key = (userId: string) => `expenses:${userId}`

export const loadExpenses = async (userId: string) =>
  (await useStorage('data').getItem<ExpenseRecord[]>(key(userId))) ?? []

export const saveExpenses = (userId: string, list: ExpenseRecord[]) =>
  useStorage('data').setItem(key(userId), list)

export function parseId(raw: string | undefined) {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw bad('invalid_id')
  return id
}
