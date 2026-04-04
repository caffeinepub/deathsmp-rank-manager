# DeathSMP Rank Manager

## Current State

A full-stack admin dashboard for managing DeathSMP Minecraft server rank purchases. The app has:
- Email/password login and registration with role-based access (superAdmin, admin, user)
- Members page with full CRUD, search/filter/sort, color-coded expiry rows, bulk actions, CSV import/export
- Dashboard with stats bar, Top Ranks widget, Expires Today section, Important Notifications (members expiring within 2 days), and Expiring Within 2 Days table
- The backend has `updateMember` which takes all member fields including `monthsPaidInAdvance`
- Members have: id, playerName, discordUsername, rankId, purchaseDate, renewalDate, monthsPaidInAdvance, notes
- The renewal date is calculated from purchaseDate + (monthsPaidInAdvance * 30 days)

## Requested Changes (Diff)

### Add
- **PAID button** on the Members table row (in the Actions column, next to the edit/delete/view buttons)
- **PAID button** on the Dashboard in:
  - The "Important Notifications" section cards (currently shows Discord, player name, expiry date, time left)
  - The "Expiring Within 2 Days" table rows
  - The "Expires Today" section rows
- **PAID modal/popup**: when PAID is clicked, opens a dialog asking "How many months?" with a number input (min 1, default 1)
- Renewal logic: extends from original expiry date (renewalDate), not from today
  - New renewalDate = current renewalDate + (months * 30 days in ms)
  - monthsPaidInAdvance also increments by the entered months
- **Renewal history log entry**: after successful PAID action, log it in the member's renewal history (the notes field or a separate mechanism if available -- since there's no dedicated history field, append to notes as "[PAID: +Xmo on DD/MM/YYYY]")
- **Toast success message** after payment recorded

### Modify
- Dashboard: add PAID button to each row in the "Expiring Within 2 Days" table
- Dashboard: add PAID button to each card in "Important Notifications"
- Dashboard: add PAID button to each row in "Expires Today" section
- Members table: add PAID button (green/primary style) in the Actions column
- Dashboard needs to reload member data after a PAID action

### Remove
- Nothing removed

## Implementation Plan

1. Create a shared `PaidModal` component that accepts: `member`, `onConfirm(months: number)`, `onClose()`, `isLoading` -- renders a popup with "PAID — <PlayerName>" title, a months input, and CONFIRM/CANCEL buttons styled in the dark Minecraft theme
2. In `Members.tsx`: import and wire `PaidModal`; add a PAID button (green badge/icon style) in the Actions cell next to the existing view/edit/delete buttons; on click open the modal with that member; on confirm call `actor.updateMember` with renewalDate extended by months from original expiry and incremented monthsPaidInAdvance; append renewal log to notes; show success toast; reload
3. In `Dashboard.tsx`: import and wire `PaidModal`; add PAID button to each row in the "Expiring Within 2 Days" table, each card in "Important Notifications", and each row in "Expires Today"; on confirm do the same update logic; reload data after
4. The PAID button style: compact green-tinted button with text "PAID" matching the existing button style (text-xs uppercase tracking-widest)
