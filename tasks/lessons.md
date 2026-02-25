# Lessons Learned

## 2026-02-25 — Doc Drift Causes Rework
- Problem: Feature behavior changed quickly while docs lagged behind.
- Rule: After any flow-changing update (session lifecycle, notifications, naming), sync all canonical markdowns in the same cycle.

## 2026-02-25 — Notification Spam Prevention
- Problem: Re-posting notification every tick created Notification Center spam.
- Rule: Use state-transition based notification updates, not per-second updates.

## 2026-02-25 — Naming Logic Must Match Visible History
- Problem: Auto naming drifted when deleted/empty sessions were counted.
- Rule: Derive fallback counter from completed sessions with sets only.

## 2026-02-25 — Celebration UX Control
- Problem: Auto-advance reduced user control after celebration.
- Rule: Keep celebration looping until explicit CTA action when user must inspect/acknowledge next stage.
