# DeathSMP Rank Manager

## Current State
Full-stack admin dashboard with:
- Email/password auth, role-based access (user/admin/superAdmin)
- Dashboard with stats bar, expiring member notifications, quick Add Member button
- Members page with search/filter/sort/color-coded rows/bulk renew/CSV export/delete confirmation
- Rank editor with usage counts and delete warnings
- Admin manager (superAdmin only), Settings (update email/password)
- Notification bell in sidebar with unread badges
- Dark/light mode toggle persisted to localStorage
- BlockedOverlay for non-admin users with auto-polling
- Footer: "Built by @Itz_Vion" linking to Discord

## Requested Changes (Diff)

### Add
1. **Member profile page** -- click a member row/name to open a slide-over or modal showing full details, notes, and renewal history (can be frontend-only history from local storage or derived from member data)
2. **Duplicate detection** -- when adding/editing a member, warn if the same Discord username or Minecraft player name already exists
3. **Top ranks widget** on Dashboard -- a small card showing which ranks are most popular (rank name + member count)
4. **"Expires today" section** on Dashboard -- a separate urgent red-highlighted section for members whose renewalDate falls on today (DD/MM/YYYY match)
5. **Import members from CSV** -- a button on the Members page to upload a CSV file and bulk-add members (columns: playerName, discordUsername, rankName, purchaseDate, monthsPaidInAdvance, notes)
6. **Undo last action** -- after deleting a member or rank, show a brief toast with an Undo button (5-second window) that re-adds the deleted item
7. **Custom date format toggle** in Settings -- let admins choose between DD/MM/YYYY (default) and MM/DD/YYYY; preference saved to localStorage; all date displays app-wide respect it
8. **Rank archive** -- instead of a hard delete, ranks can be "archived" (soft delete). Archived ranks are hidden from active lists but preserved. A toggle in Rank Editor to show/hide archived ranks and restore them
9. **Rank price warnings** -- flag ranks with price = 0 (free warning) or price > 10000 INR (unusually high warning) with a small icon/tooltip
10. **Animated expiry countdown** on Dashboard notification cards -- live countdown timer showing days/hours/minutes ticking down in real-time (updates every minute)
11. **Compact vs comfortable view toggle** on Members page -- switch between compact (more rows, smaller text/padding) and comfortable (default) table view; preference saved to localStorage
12. **Custom accent color picker** (superAdmin only) in Settings -- lets the superAdmin pick from a set of preset accent colors (red default + 5 others); saves to localStorage and applies via CSS variable override

### Modify
- Dashboard: add Top Ranks widget and Expires Today section alongside existing stats bar and Important Notifications
- Members page: add duplicate check on add/edit, import CSV button, compact/comfortable toggle
- Rank Editor: convert delete to archive (soft delete), add archived ranks view, add price warning icons
- Settings page: add date format toggle, add accent color picker (superAdmin only)
- All date displays: respect the date format preference from localStorage

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/context/PreferencesContext.tsx` -- manages dateFormat (DD/MM/YYYY | MM/DD/YYYY) and compactView (bool) and accentColor (string) from localStorage
2. Update `src/frontend/src/pages/Dashboard.tsx` -- add Top Ranks widget, Expires Today section, animate countdown on notification cards
3. Update `src/frontend/src/pages/Members.tsx` -- add duplicate detection on add/edit, CSV import button/logic, compact/comfortable toggle
4. Update `src/frontend/src/pages/RankEditor.tsx` -- convert to soft archive pattern (keep archived flag in localStorage since backend doesn't have it; archived ranks stored as Set of IDs in localStorage), add price warning icons
5. Update `src/frontend/src/pages/Settings.tsx` -- add date format toggle, accent color picker (superAdmin only)
6. Create `src/frontend/src/components/MemberProfile.tsx` -- slide-over/drawer showing full member details and notes
7. Add undo toast logic to member delete and rank archive actions using sonner with action button
8. Update all date format helpers across the app to use the PreferencesContext dateFormat setting
