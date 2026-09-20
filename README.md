# E-Fridge Client

Modern, responsive web client for the E-Fridge platform, built with Vue 3, TypeScript, Vite, and Tailwind CSS. Provides an intuitive interface for smart fridge inventory tracking, AI chef consultation, daily meal planning, and calorie accounting.

## Table of Contents

- Overview
- Tech Stack
- Features and Modules
- Design and Theme System
- Prerequisites
- Environment Configuration
- Getting Started
- Available Scripts
- Project Structure
- Backend Integration

## Overview

E-Fridge Client delivers a desktop-optimized and mobile-responsive experience for managing food supplies and diet. It connects to the E-Fridge REST API, leveraging real-time inventory state, Google Identity Services, and AI capabilities for meal and recipe recommendations.

## Tech Stack

- Framework: Vue 3 (Composition API, `<script setup lang="ts">`)
- Language: TypeScript
- Build Tool: Vite 5
- State Management: Pinia
- Routing: Vue Router 4
- Styling: Tailwind CSS, PostCSS
- Icons: Lucide Vue Next (`lucide-vue-next`)
- Third-Party Integrations:
  - Google Identity Services (Google Sign-In)
  - OpenFoodFacts integration (via API service)

## Features and Modules

- Responsive Navigation:
  - Desktop: Collapsible sidebar navigation with workspace switcher, navigation links, theme switcher, and user profile controls.
  - Mobile: Fixed top header with compact actions and bottom navigation bar for quick thumb-reach access.
- Fridge Inventory (`FridgeView.vue`):
  - Product listing with category filters, search, and expiration indicators.
  - Multi-mode product addition: manual form, barcode lookup, and AI nutrition estimation.
  - Partial product consumption modals with unit selection (grams, pieces, ml, etc.) and real-time stock deduction.
- AI Chef (`ChefView.vue`):
  - Full-height interactive chat interface with inventory awareness.
  - Compact 2x2 quick prompt suggestions for instant recipe queries.
  - Embedded interactive recipe cards (`RecipeCard.vue`) with macro details, step-by-step instructions, and actions to cook, save, or add missing ingredients to the shopping list.
- Meal Planner (`PlannerView.vue`):
  - Single-day planner focusing on breakfast, lunch, and dinner.
  - One-click AI generation for the entire day with pantry validation.
  - Slot-level meal regeneration and detailed recipe inspection modal (`RecipeModal.vue`).
  - Meal completion toggling.
- Nutrition Tracker (`NutritionView.vue`):
  - Daily aggregated calories, protein, fat, and carbs against user goals.
  - Meal log list by category (Breakfast, Lunch, Dinner, Snack).
  - Editing modal for logged meals.
  - Log deletion with automatic product stock restoration back into the active fridge.
- Shopping List (`ShoppingView.vue`):
  - Categorized checklist with strike-through completion.
  - One-click batch addition from missing recipe ingredients.
- Saved Recipes (`SavedRecipesView.vue`):
  - Collection of bookmarked recipes with direct cooking action.
- Settings & Profile (`SettingsView.vue`):
  - Profile name updates.
  - Theme preferences.
  - Account deletion with confirmation modal.
- Authentication (`LoginView.vue`, `RegisterView.vue`):
  - Two-step registration requiring 6-digit email confirmation.
  - Password strength validation (minimum 8 characters).
  - Google Sign-In button integration.

## Design and Theme System

- Color Palette: Neutral zinc background (`#09090b` for page base, `#121217` for cards) paired with a violet-to-indigo gradient accent system.
- Dark/Light Theme:
  - Managed via `useTheme` composable with zero-flicker DOM synchronization.
  - Automatic detection of `prefers-color-scheme` with persistence in `localStorage`.
- Mobile First: Designed to adapt across phone, tablet, and desktop viewports.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Environment Configuration

Create a `.env` file in the root of the project:

```bash
cp .env.example .env
```

Configuration variables:

| Variable | Description |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID for Google Sign-In |

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

3. Ensure the backend API is running at `http://localhost:8080` (or configured via Vite proxy).

## Available Scripts

- `npm run dev` - Launches Vite development server with Hot Module Replacement (HMR)
- `npm run build` - Runs type checking (`vue-tsc -b`) and bundles production assets into `dist/`
- `npm run preview` - Locally previews the production build

## Project Structure

```text
E-Fridge/
├── src/
│   ├── assets/                     # Static media and brand assets
│   ├── components/                 # Reusable Vue components
│   │   ├── planner/                # Meal planner recipe modals
│   │   ├── CookModal.vue           # Recipe cooking confirmation
│   │   ├── EatModal.vue            # Product consumption & logging modal
│   │   ├── EditNutritionLogModal.vue # Meal log editing modal
│   │   ├── GoogleSignInButton.vue  # Google OAuth button wrapper
│   │   ├── LogMealModal.vue        # Manual nutrition log modal
│   │   ├── NutritionGoalsModal.vue # Daily target editing modal
│   │   ├── ProductCard.vue         # Inventory item card
│   │   ├── ProductFormModal.vue    # Add product modal (manual/barcode/AI)
│   │   └── RecipeCard.vue          # Interactive recipe display card
│   ├── composables/                # Shared Vue composables
│   │   └── useTheme.ts             # Theme state and DOM synchronization
│   ├── router/                     # Vue Router route definitions
│   │   └── index.ts
│   ├── services/                   # HTTP client and API abstractions
│   │   └── api.ts
│   ├── stores/                     # Pinia state stores
│   │   ├── auth.ts                 # User authentication & fridge selection
│   │   ├── chef.ts                 # AI Chef chat state
│   │   ├── fridge.ts               # Inventory products state
│   │   ├── nutrition.ts            # Daily goals and meal logs state
│   │   ├── planner.ts              # Day meal plans state
│   │   ├── recipes.ts              # Saved recipes collection
│   │   └── shopping.ts             # Shopping list items state
│   ├── types/                      # TypeScript interface definitions
│   │   └── index.ts
│   ├── views/                      # Main screen views
│   │   ├── ChefView.vue            # AI Chef chat workspace
│   │   ├── FridgeView.vue          # Inventory overview and management
│   │   ├── HomeView.vue            # Main layout wrapper with sidebar
│   │   ├── LoginView.vue           # Login view
│   │   ├── NutritionView.vue       # Calorie & macro tracking view
│   │   ├── PlannerView.vue         # Daily meal planning view
│   │   ├── RegisterView.vue        # Two-step registration view
│   │   ├── SavedRecipesView.vue    # Saved recipes collection
│   │   ├── SettingsView.vue        # User profile and account settings
│   │   └── ShoppingView.vue        # Shopping checklist view
│   ├── App.vue                     # Root Vue component
│   ├── main.ts                     # Application bootstrapping
│   └── style.css                   # Global styles and Tailwind directives
├── index.html                      # HTML template with Google script tags
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts                  # Vite config with /api proxy to localhost:8080
```

## Backend Integration

During development, Vite forwards requests matching `/api` to the backend service via the proxy configured in `vite.config.ts`:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```