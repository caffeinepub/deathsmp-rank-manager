# DeathSMP Rank Manager

## Current State
- Dashboard shows expiring members within 7 days
- Dashboard auto-sends Discord alerts via webhook on page load (sessionStorage-gated)
- Settings page has Discord webhook URL field and save button
- Backend has `getDiscordWebhookUrl`, `setDiscordWebhookUrl`, `sendDiscordAlert` methods
- Backend has `getExpiringMembers(withinDays)` which works correctly

## Requested Changes (Diff)

### Add
- **Important Notifications** section on Dashboard showing members expiring within 2 days
- Each notification card shows:
  - Discord id: @<discordUsername>
  - Minecraft Username: <playerName>
  - Expiry Date: DD/MM/YYYY
  - Time left: countdown to 12:00 AM IST of expiry date (e.g. "1d 4h 30m")

### Modify
- Dashboard: replace existing 7-day expiry alert banner with new Important Notifications section using the new format above
- Dashboard: remove Discord alert sending logic (sessionStorage + sendDiscordAlert calls)
- Settings page: replace Discord webhook section with a simple "Account" or placeholder settings panel (no webhook UI)

### Remove
- All Discord webhook UI from Settings page
- Discord alert auto-sending logic from Dashboard
- Backend methods for Discord are NOT removed (leave in Motoko to avoid breaking existing bindings), but they are simply no longer called from frontend

## Implementation Plan
1. Update `Dashboard.tsx`:
   - Call `getExpiringMembers(2)` instead of `(7)`
   - Remove sessionStorage Discord alert sending
   - Replace alert banner with "Important Notifications" section showing new card format
   - Compute time left to 12:00 AM IST of each member's renewal date
2. Update `Settings.tsx`:
   - Remove Discord webhook form entirely
   - Show a simple settings page (just account info or empty state with footer)
