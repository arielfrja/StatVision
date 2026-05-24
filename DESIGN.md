# StatVision DESIGN.md 🏀

## 1. Vision & Voice
StatVision is a professional "Minimalist Utility" tool for basketball analytics, built on the **Material 3 (Material Web)** design system. The design prioritizes **data density**, **high readability**, and **low cognitive load**.

- **The Vibe:** "Functional Modernism" — Clean, Structured, Professional, and Focused.
- **Foundational System:** Official Material 3 components (`@material/web`) for consistent accessibility and interaction patterns.
- **The Soul:** Efficiency over entertainment. Every pixel serves a purpose in the analysis workflow.
- **Target Audience:** Professional and semi-pro coaches who need to extract insights quickly and accurately.

---

## 2. Design System Tokens (M3 Mapping)

We use Material 3 Design Tokens, customized for a professional dark-mode analytics environment.

### 🎨 Color Palette
- **System Primary (Accent):** `#3B82F6` (Electric Blue) -> Maps to M3 `primary`
- **System Surface:** `#0A0A0B` (Pure Black) -> Maps to M3 `surface`
- **Container Surface:** `#161618` -> Maps to M3 `surface-container`
- **Text Primary:** `#FAFAFA` -> Maps to M3 `on-surface`
- **Text Secondary:** `#A1A1AA` -> Maps to M3 `on-surface-variant`
- **Success:** `#10B981` -> Maps to M3 `tertiary`
- **Error:** `#EF4444` -> Maps to M3 `error`

### ✍️ Typography
- **UI Engine:** "Inter" (M3 `body`, `label`, `headline`)
- **Data Engine:** "JetBrains Mono" (Used strictly for stats, timestamps, and coordinates)

### 📐 Shapes & Spacing
- **Roundness:** `ROUND_FOUR` (4px). We override standard M3 roundness for a sharper, more professional feel.
- **Spacing:** Tight `4px` grid to maximize data density.

---

## 3. Component Strategy (Material-First)

We leverage `@material/web` for all interactive elements:

- **Actions:** Use `<md-filled-button>`, `<md-outlined-button>`, and `<md-text-button>`.
- **Inputs:** Use `<md-filled-text-field>` and `<md-filled-select>` with `ROUND_FOUR` overrides.
- **Selection:** Use `<md-checkbox>` and `<md-radio>` for all data filtering.
- **Feedback:** Use `<md-linear-progress>` and `<md-circular-progress>` for AI analysis states.
- **Overlays:** Use `<md-dialog>` for all complex entity assignments and confirmations.

---

## 4. Interaction Principles

- **Discrete Feedback:** Standard M3 ripple effects and focus states, kept subtle.
- **Data Loading:** M3 linear progress bars for background analysis.
- **Density:** We tighten M3 component paddings where possible to maximize tabular data visibility.
- **Keyboard First:** Full adherence to M3 accessibility standards for rapid data verification.

---

## 5. Development Priorities
1.  **M3 Consistency:** Ensure every button, input, and modal is an official `@material/web` component.
2.  **Density Overload:** Prioritize fitting more Play-by-Play rows over standard Material spacing.
3.  **Responsive Utility:** M3 layouts that collapse logically for on-court mobile use.
