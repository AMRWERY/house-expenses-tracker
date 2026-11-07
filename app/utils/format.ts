const nf = new Intl.NumberFormat('en-US') // Western digits in both languages (design.md)
export const formatNumber = (n: number) => nf.format(n)

const pad = (n: number) => String(n).padStart(2, '0')
/** `m` is 0-based (like Date); the result is YYYY-MM-DD. */
export const toISODate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Dev-only preview mode (?demo=1): local sample data, no sign-in. Never active in production builds. */
export const isDemo = (query: Record<string, unknown>) => import.meta.dev && query.demo === '1'
