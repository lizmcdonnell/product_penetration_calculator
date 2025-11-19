# Product Attach & Penetration Calculator

A single-page React/TypeScript web application for predicting product attach and penetration rates by restaurant segment.

## Overview

This tool allows you to:
- Input segment mixes for current and net-new customers
- Define product fit percentages for each restaurant segment
- Calculate predicted attach rates (for net-new customers) and penetration rates (for current customer base)
- Export/import configurations and reset to defaults

## Formulas

### Predicted Penetration Rate
For each product, the predicted penetration rate is calculated as:

```
Σ over segments (currentMix[s] * fitBySegment[s])
```

Where:
- `currentMix[s]` = percentage of current customers in segment `s` (normalized to 0-1)
- `fitBySegment[s]` = expected percentage of segment `s` that will adopt the product (normalized to 0-1)

### Predicted Attach Rate
For each product, the predicted attach rate is calculated as:

```
Σ over segments (newMix[s] * fitBySegment[s])
```

Where:
- `newMix[s]` = percentage of net-new customers in segment `s` (normalized to 0-1)
- `fitBySegment[s]` = expected percentage of segment `s` that will adopt the product (normalized to 0-1)

Both results are displayed as percentages with one decimal place.

## Restaurant Segments

The app uses five fixed restaurant segments:
- **Casual**: Casual dining restaurants
- **Upscale Casual**: Upscale casual dining establishments
- **Fine Dining**: Fine dining restaurants
- **Bar**: Bars and taverns
- **Quick Serve**: Quick service restaurants (QSR)

## Default Products

The app comes pre-seeded with the following products:
- Online Ordering – Order on My Website
- Online Ordering – Order on 3rd Party Integrator
- Digital at-the-table Ordering & Payments
- Ordering Kiosk
- Omniboost PMS Integration
- Direct API Access
- Loyalty
- Physical Gift Cards
- Virtual Gift Cards
- Inventory Management
- DATEV & Cloud (Germany/CH)
- Accounting Integration
- Stationary/Mobile Registers/POS
- KDS

You can add, edit, duplicate, or delete products as needed.

## Features

### Segment Mix Input
- **Current Customer Mix**: Define the percentage makeup of your existing customer base
- **Net-New Customer Mix**: Define the percentage makeup of new customers you expect to acquire
- Both mixes must sum to exactly 100% (±0.1% tolerance)
- "Balance" button automatically adjusts the last segment to make the total 100%

### Products Table
- Inline editing: Click any cell to edit
- Keyboard navigation: Arrow keys, Enter to save, Esc to cancel
- Real-time calculations: Results update instantly as you type
- Add/Delete/Duplicate products
- Average row shows aggregate statistics

### Data Persistence
- Auto-saves to localStorage on every change
- Export JSON: Download your current configuration
- Import JSON: Load a previously exported configuration
- Reset to Defaults: Restore initial state

### Example Scenarios
- **QSR-Heavy**: Loads a mix weighted toward quick service restaurants
- **Upscale-Heavy**: Loads a mix weighted toward upscale and fine dining

## Running Locally

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Validation Rules

- Percent inputs are clamped to [0, 100]
- Decimals are allowed up to one decimal place
- Mix totals must equal 100% (±0.1% tolerance)
- If mixes don't sum to 100%, results show "—" and a warning banner appears

## Accessibility

- All inputs have proper labels and ARIA attributes
- Keyboard navigation supported throughout
- Table headers include tooltips explaining calculations
- Screen reader friendly

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Zustand** for state management with localStorage persistence
- No backend required - runs entirely in the browser

## Project Structure

```
src/
  ├── components/
  │   ├── PercentInput.tsx          # Reusable percentage input component
  │   ├── SegmentMixCard.tsx        # Card for segment mix input
  │   ├── ProductsTable.tsx         # Main products table with inline editing
  │   └── ImportExportControls.tsx  # Export/Import/Reset controls
  ├── utils/
  │   └── calculations.ts           # Calculation utilities
  ├── types.ts                      # TypeScript type definitions
  ├── store.ts                      # Zustand store with persistence
  ├── App.tsx                       # Main app component
  └── main.tsx                      # Entry point
```

## Testing

### Unit Tests

Unit tests are located in `src/__tests__/` and test:
- Calculation functions (validateMix, computeAttach, computePenetration)
- Store state management (add, update, delete products, mix updates)

Run unit tests:
```bash
npm test
```

Run with UI:
```bash
npm run test:ui
```

### E2E Tests

E2E tests are located in `e2e/` and use Playwright to test:
- App loading and initial state
- Segment mix editing
- Product management (add, edit, delete)
- Validation warnings
- Export/Import functionality
- Reset to defaults

Run e2e tests:
```bash
npm run test:e2e
```

Run with UI:
```bash
npm run test:e2e:ui
```

**Note:** E2E tests will automatically start the dev server. Make sure port 5173 is available.

## License

MIT
