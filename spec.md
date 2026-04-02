# DeathSMP Rank Manager

## Current State
- Dark-only Minecraft-themed UI with red accents (OKLCH color tokens in index.css)
- Layout.tsx has a sidebar nav with no theme toggle
- AuthContext.tsx manages auth state
- App.tsx wraps everything in AuthProvider
- No theme context or light mode support exists

## Requested Changes (Diff)

### Add
- ThemeContext (React context) that manages `dark` | `light` state, persisted to localStorage under key `deathsmp_theme`, defaults to `dark`
- Light mode CSS variables in index.css under `.light` class (lighter grays, same red primary accent)
- Theme toggle switch in Layout.tsx nav bar (sun/moon icon + switch component)
- Apply `dark` or `light` class to `<html>` element based on theme state

### Modify
- App.tsx: wrap with ThemeProvider so theme is available app-wide
- tailwind.config.js: change darkMode from `["class"]` to `["class"]` (already set, just ensure light class works)
- index.css: add `.light` CSS variable overrides for a lighter theme variant
- Layout.tsx: add the toggle switch in the sidebar near the bottom (above logout or inline)

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/context/ThemeContext.tsx` with `ThemeProvider` and `useTheme` hook
2. Add `.light` CSS variable block in `index.css` with lighter backgrounds, same red primary
3. Update `App.tsx` to wrap root with `ThemeProvider`
4. Add theme toggle (Sun/Moon icons + Switch) in `Layout.tsx` sidebar
5. Validate and build
