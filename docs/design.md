# Design System: Household Expense Manager

## 1. Overview

A very simple, clean, friendly web app for managing household expenses. Mobile-first and fully responsive. The feel is calm, trustworthy, and effortless: money management should feel light, not stressful.

- **Themes:** Light and Dark (toggle in top bar, sun/moon icon, also "System" option)
- **Languages:** English (LTR) and Arabic (RTL), switcher in top bar (`EN | عربي`)
- **Personality:** minimal, rounded, soft, spacious, encouraging
- **Icons:** Lucide-style line icons, 1.75px stroke, 20-24px size
- **Avoid:** clutter, heavy gradients, harsh borders, tiny text, dense tables on mobile

## 2. Color Palette

### Brand and Semantic (shared)

| Role | Name | Hex |
|---|---|---|
| Primary | Emerald | `#10B981` |
| Primary Hover | Emerald Dark | `#059669` |
| Primary Soft (bg tint) | Emerald 50 | `#ECFDF5` |
| Income / Positive | Green | `#22C55E` |
| Expense / Negative | Red | `#EF4444` |
| Warning (near limit) | Amber | `#F59E0B` |
| Info | Blue | `#3B82F6` |

### Light Theme

| Role | Hex |
|---|---|
| Background | `#F8FAFC` |
| Surface (cards) | `#FFFFFF` |
| Surface Alt (inputs, chips) | `#F1F5F9` |
| Border | `#E2E8F0` |
| Text Primary | `#0F172A` |
| Text Secondary | `#64748B` |
| Text Disabled | `#94A3B8` |

### Dark Theme

| Role | Hex |
|---|---|
| Background | `#0F172A` |
| Surface (cards) | `#1E293B` |
| Surface Alt (inputs, chips) | `#273449` |
| Border | `#334155` |
| Text Primary | `#F1F5F9` |
| Text Secondary | `#94A3B8` |
| Text Disabled | `#64748B` |
| Primary (slightly brighter) | `#34D399` |

### Category Colors (same in both themes, softer tint in dark)

| Category | Color | Icon |
|---|---|---|
| Food / أكل | `#F97316` Orange | utensils |
| Transport / مواصلات | `#3B82F6` Blue | car |
| Bills / فواتير | `#EAB308` Yellow | receipt |
| Rent / إيجار | `#8B5CF6` Violet | home |
| Health / صحة | `#EC4899` Pink | heart-pulse |
| Education / تعليم | `#06B6D4` Cyan | graduation-cap |
| Entertainment / ترفيه | `#F43F5E` Rose | clapperboard |
| Other / أخرى | `#64748B` Slate | more-horizontal |

### Budget Progress Colors

- Under 70%: Emerald `#10B981`
- 70% to 100%: Amber `#F59E0B`
- Over 100%: Red `#EF4444`

## 3. Typography

| Language | Font | Fallback |
|---|---|---|
| English | **Inter** | system-ui, sans-serif |
| Arabic | **Cairo** | Tajawal, system-ui, sans-serif |

| Style | Size / Line height | Weight | Use |
|---|---|---|---|
| Display | 36 / 44 | 700 | Remaining balance number |
| H1 | 28 / 36 | 700 | Screen titles |
| H2 | 22 / 30 | 600 | Section titles |
| H3 | 18 / 26 | 600 | Card titles |
| Body | 16 / 24 | 400 | Default text |
| Body Small | 14 / 20 | 400 | Secondary text, notes |
| Caption | 12 / 16 | 500 | Labels, dates, badges |
| Amount | 16-20 / 24 | 600 | Tabular numbers (`font-variant-numeric: tabular-nums`) |

Arabic text uses slightly larger line height (+2px). Numerals: Western digits (0-9) by default, with an optional Arabic-Indic digits setting.

## 4. Layout and Spacing

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48
- **Page padding:** 16px mobile, 24px tablet, 32px desktop
- **Max content width:** 1100px on desktop, centered
- **Grid:** 4 columns mobile, 8 tablet, 12 desktop, 16px gutters
- **Breakpoints:** mobile < 640px, tablet 640-1024px, desktop > 1024px

### Navigation

- **Mobile:** bottom navigation bar (5 items): Home, Expenses, Budgets, Reports, Settings. Active item shows emerald icon plus label with a small pill indicator.
- **Desktop:** fixed sidebar (240px) on the left in LTR, on the right in RTL. Logo on top, nav items, and settings at the bottom.
- **Top bar:** page title, month selector, language switcher, theme toggle.
- **Floating Action Button:** emerald circle (56px) with a "+" icon, bottom-end corner above the bottom nav.

## 5. Shape and Elevation

- **Radius:** cards 16px, buttons 12px, inputs 12px, chips 999px (pill), modals 24px, bottom sheet top corners 28px
- **Light mode elevation:** soft shadows, e.g. `0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06)`
- **Dark mode elevation:** no heavy shadows, use 1px borders (`#334155`) and slightly lighter surfaces
- **Focus ring:** 2px emerald outline with 2px offset

## 6. Components

### Buttons
- **Primary:** emerald fill, white text, 48px height, full width on mobile forms
- **Secondary:** surface-alt fill, primary text
- **Ghost:** transparent, text only
- **Destructive:** red fill or red text
- States: hover (darker), pressed (scale 0.97), disabled (50% opacity), loading (spinner)

### Cards
Rounded 16px, 16-20px padding, surface color, soft shadow (light) or border (dark).

### Summary Card
Label (caption, secondary), large amount (display or H2), small trend chip (up/down arrow with percent). The Remaining Balance card is highlighted with an emerald gradient tint.

### Transaction Row
`[category icon in tinted circle 44px] [title + note/date] ........ [amount]`
Expense amounts in red with minus sign, income in green with plus sign. In RTL the amount sits on the left side.

### Inputs
Height 48px, surface-alt background, 12px radius, 1px border on focus (emerald). Large amount input: 40px centered text with currency label. Error state: red border plus helper text below.

### Chips
Pill shape, surface-alt by default, emerald fill when selected. Category chips are a grid of icon plus label, selected chip gets a ring and a slight scale.

### Progress Bar
8px height, fully rounded, track in surface-alt, fill color depends on budget status (see colors). Warning badge (amber or red) shown near or over limit.

### Modal / Bottom Sheet
Bottom sheet on mobile with a drag handle, centered modal on desktop (max 480px). Dimmed backdrop (`rgba(0,0,0,.5)`).

### Toggle and Segmented Control
Toggle 44x24 with sliding knob. Segmented control with a sliding indicator pill behind the selected option.

### Charts
- Donut chart for category breakdown, center shows total
- Bar chart for spending over time (rounded top corners)
- Mini line chart for month comparison (smooth curve, gradient fill below)
- Use category colors, soft grid lines, tooltips on hover or tap

### Empty State
Friendly simple illustration, short title, one-line description, primary button ("Add your first expense").

### Toast
Small pill at the bottom, slides up, auto-dismisses after 3s, with an Undo action on delete.

## 7. Screens

1. **Dashboard:** greeting, month selector, three summary cards (Remaining Balance highlighted, Total Income, Total Expenses), donut chart by category, this month vs last month line chart, recent 5 transactions, FAB.
2. **Add Expense (sheet/modal):** Expense/Income toggle, large amount input, category chip grid, date picker (default today), optional note, Save button. Includes validation error state and success state.
3. **Expenses List:** search bar, filter chips (This week, This month, Category, Date range), transactions grouped by date with sticky headers, swipe to Edit/Delete on mobile, hover actions on desktop, empty state, skeleton loading.
4. **Budgets:** total monthly budget card with overall progress, category budget cards with progress bars and warning badges, edit budget modal with slider plus numeric input.
5. **Reports:** segmented control (Week / Month / Year), bar chart, donut chart, Top 3 categories card, insights card, Export button (CSV / PDF).
6. **Settings:** Appearance (Light / Dark / System with preview cards), Language (English / العربية), Currency (EGP default), Monthly start day, Recurring expenses list, Data (export, reset).

## 8. RTL (Arabic) Rules

- Set `dir="rtl"` and `lang="ar"`; mirror the entire layout.
- Use logical properties only (`margin-inline`, `padding-inline`, `inset-inline-start`), never left/right.
- Sidebar moves to the right. Bottom nav order reverses.
- Flip directional icons (chevrons, arrows, back buttons). Do NOT flip icons like search, check, plus, or charts.
- Progress bars fill from right to left.
- Text right-aligned. Numbers and currency stay readable (e.g. `1,250 ج.م`).
- Charts: keep time axis direction consistent with reading direction (right to left in Arabic).
- Swipe actions reverse direction.
- Use Cairo font and Arabic copy.

### Core Arabic Labels

الرئيسية، المصروفات، الميزانيات، التقارير، الإعدادات، إضافة مصروف، إضافة دخل، الرصيد المتبقي، إجمالي الدخل، إجمالي المصروفات، حفظ، إلغاء، حذف، تعديل، بحث، هذا الشهر، هذا الأسبوع، الشهر الماضي، المظهر، اللغة، العملة، فاتح، داكن، تلقائي.

## 9. Motion and Interaction

**Principles:** subtle, fast, purposeful. Motion explains change, never distracts.

| Interaction | Behavior | Duration / Easing |
|---|---|---|
| Page transition | Fade plus 8px slide | 250ms, ease-out |
| Cards on load | Fade and slide up, staggered 60ms each | 400ms, ease-out |
| Numbers | Count up from 0 to value | 800ms, ease-out |
| Donut chart | Draws clockwise | 900ms, ease-in-out |
| Bar chart | Bars grow upward | 600ms, staggered |
| Progress bars | Fill from start on load, color changes smoothly | 700ms, ease-out |
| Warning badge | Gentle pulse once | 600ms |
| Bottom sheet / Modal | Slides up with spring, backdrop fades in | 350ms, spring (damping 22) |
| Category chip select | Scale to 1.05 with ring | 150ms |
| Save button | Spinner, then morphs into checkmark | 600ms total |
| Button press | Scale to 0.97 | 100ms |
| FAB | Press scale plus ripple | 200ms |
| List items | Fade in staggered | 300ms |
| Delete item | Height collapses, fades out, then toast with Undo | 300ms |
| Filter chips | Background color and scale transition | 200ms |
| Segmented control | Indicator slides to selected option | 250ms |
| Tab content switch | Cross-fade | 200ms |
| Theme switch | Smooth color cross-fade across whole UI | 300ms |
| Language switch | Short fade while layout mirrors | 250ms |
| Toggles | Knob slides with spring | 250ms |
| Tooltips | Fade and slight rise | 150ms |
| Loading | Skeleton shimmer | 1.4s loop |

**Accessibility:** respect `prefers-reduced-motion: reduce` by disabling transforms and counting animations and keeping only simple fades.

## 10. Accessibility

- WCAG AA contrast minimum in both themes
- Touch targets at least 44x44px
- Visible focus rings, full keyboard navigation
- Do not rely on color alone: budget status also uses icons and text
- Proper labels for form fields and icon-only buttons
- Screen reader friendly amounts (e.g. "Expense, 250 Egyptian pounds")

## 11. Content and Tone

Friendly, short, and encouraging. Examples:
- Empty state: "No expenses yet. Add your first one!"
- Near limit: "You've used 85% of your Food budget."
- Insight: "You spent 15% less on Food than last month."
- Success: "Expense added"

Default currency: EGP (Egyptian Pound). Support changing currency in Settings.

## 12. Sample Data (for mockups)

- Salary: 12,000 EGP
- Rent: 3,500 EGP, Food: 2,800 EGP, Bills: 950 EGP, Transport: 600 EGP, Health: 400 EGP, Entertainment: 350 EGP
- Remaining balance: about 3,400 EGP
- Recent transactions: Supermarket, Electricity bill, Uber, Pharmacy, Netflix
