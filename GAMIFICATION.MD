# GiGoFit — Gamification Design Document
**"Your Iron. Your Legend."**

---

## Vision

Every workout is a move on the board. Every PR is a power-up. Every session is a step deeper into the game world. The pixel character is not a decoration — it is the user's alter ego, evolving in real time as they get stronger, faster, and tougher in the real world. The game world maps directly to the fitness world: the numbers in the gym write the story in the game.

---

## Core Concept

The user has a **pixel RPG character** that lives inside the app. The character:

- Earns **XP** from real workouts
- Collects **Coins** dropped after sets and milestones
- Finds **Secret Chests** when surprising milestones are hit
- Encounters **NPCs** at key moments in the fitness journey
- Gains **Power-Ups** that carry over to the next session
- Has **Stats** (STRENGTH, AGILITY, ENDURANCE) that update from real training data and change the character's appearance, animations, and abilities

The game is **not a separate mode** — it is woven into the normal workout flow. You log a set → your character gains XP. You hit a PR → a boss gets hit. You complete a session → coins rain down.

---

## Stat System — Mapping Fitness to Game Stats

| Stat | Fitness Source | Drives |
|---|---|---|
| **STRENGTH** | Total volume lifted (all-time) + weight PRs | Character size, armor weight class, attack power in boss fights |
| **AGILITY** | Workout frequency (sessions/week) + consistency streaks | Character speed animations, dodge animations, lighter gear look |
| **ENDURANCE** | Average session duration + total reps logged | Stamina aura, trail/glow effects, max health in boss fights |
| **FOCUS** | Low Energy vibe sessions with ≥ 90% previous volume | Rare cosmetic — meditative aura, calm palette |
| **FURY** | "Crushing It" vibe sessions + consecutive PRs | Fire/rage aura, explosive animations |

Stats are computed from raw SQLite data — no manual input. They update after every session ends.

### Stat Thresholds (Example — tunable)

```
STRENGTH:
  Iron Fist      — 0–10,000 kg total volume
  Steel Grip     — 10,000–50,000 kg
  Mountain Hands — 50,000–150,000 kg
  Titan          — 150,000 kg+

AGILITY:
  Crawler  — < 2 sessions/week avg
  Strider  — 2–3 sessions/week avg
  Sprinter — 4–5 sessions/week avg
  Ghost    — 6+ sessions/week avg

ENDURANCE:
  Spark    — avg session < 30 min
  Ember    — 30–45 min
  Blaze    — 45–75 min
  Inferno  — 75+ min
```

---

## XP System

### Earning XP

| Action | XP |
|---|---|
| Log any set | +5 XP |
| Complete a session | +50 XP |
| Hit a weight PR | +100 XP |
| Hit a volume set PR | +80 XP |
| Hit an estimated 1RM PR | +90 XP |
| Maintain a weekly streak | +75 XP × streak_week |
| "Crushing It" session | +25 XP bonus |
| Low Energy session, ≥ 90% volume | +40 XP ("Iron Discipline" bonus) |
| Open a Secret Chest | variable XP drop |

### Level Ups

XP fills a progress bar. Hitting 100% triggers a **level-up animation** — the pixel character glows, floats up, a particle burst fires. Each level up:
- Increases the **Coin multiplier** by a small increment (e.g. +2% per level)
- Unlocks a cosmetic piece at milestone levels (10, 25, 50, 100)
- Plays a distinct sound and animation

### Free vs Premium XP

| | Free | Premium |
|---|---|---|
| XP earning | Full rate | Full rate |
| XP into levels | Single looping level | Progression through distinct levels |
| Loop bonus | 1.25× coins and XP on next loop | N/A (linear progression instead) |

---

## Coin System

Coins are the in-app currency for cosmetics and upgrades.

### Earning Coins

| Action | Coins |
|---|---|
| Complete a set | +2 coins |
| Complete a session | +30 coins |
| PR detected | +50 coins |
| Secret Chest opened | 20–500 coin drop (rarity-based) |
| Level up | +100 coins |
| Boss kill (Premium) | +500 coins + loot drop |

### Spending Coins

- **Character Cosmetics** — skins, outfits, helmet styles, weapon skins (axe, dumbbell-sword, kettlebell shield)
- **Aura Effects** — fire trail, ice glow, thunder ring
- **NPC Interactions** — tip the Shopkeeper for a hint at the next chest location
- **Power-Up Slots** — unlock an extra power-up inventory slot (up to 3 slots free, more are premium)

Coins do not expire. They are stored locally in SQLite.

---

## Secret Chests

Chests appear when the user hits **surprising or rare milestones** — not expected ones. They feel like discoveries, not rewards for routine.

### Chest Triggers (Examples)

| Trigger | Chest Rarity |
|---|---|
| Very first PR ever | Legendary (animated, unique) |
| First session after 7-day gap (comeback) | Rare |
| 10 total sessions completed | Uncommon |
| 50 total sessions completed | Rare |
| 100 total sessions completed | Legendary |
| First Low Energy session with ≥ 90% volume | Rare ("Iron Soul Chest") |
| 5 PRs in a single session | Legendary |
| 1,000 total reps logged | Uncommon |
| 10,000 total reps logged | Rare |
| First set logged at midnight (00:00–01:00) | Uncommon ("Night Owl Chest") |
| Exact session duration of 45:00 or 60:00 | Uncommon ("Precision Chest") |
| First exercise of each new muscle group | Uncommon |

### Chest Contents

Each chest rolls from a loot table:

```
Common:   Coins (20–80), minor XP boost (50 XP)
Uncommon: Coins (100–250), cosmetic piece (common tier), 1 Power-Up charge
Rare:     Coins (300–600), cosmetic piece (rare tier), 2 Power-Up charges, NPC encounter unlock
Legendary: Coins (500–1500), full cosmetic set (legendary tier), stat boost animation,
           unlocks special NPC dialogue, title badge
```

---

## Power-Ups

Power-ups are temporary in-game buffs earned from workouts. They stack in an inventory and can be activated before a session.

| Power-Up | How Earned | Effect |
|---|---|---|
| **Fury Surge** | Crushing It vibe session | +2x XP for next session |
| **Iron Skin** | Hit a weight PR | +100 bonus coins on next session completion |
| **Ghost Mode** | Low Energy but consistent | All sets in next session earn +3x coins |
| **Titan's Grip** | 5 sets of the same exercise in one session | Next PR detection gives +200 XP bonus |
| **Blitz** | Session completed in under 30 min | Sets log 2x faster coin drops next session |
| **Second Wind** | Comeback session (7+ day gap) | Double coin multiplier for 48 hours |
| **Chest Magnet** | 3 chests opened in a week | +50% chance of chest trigger on next session |

Power-ups are stored locally. Max 3 active at once (free), up to 6 (premium).

---

## NPC System

NPCs appear as pixel characters in the game world at key moments. They deliver short dialogue lines (1–3 sentences), offer lore, give hints, or trigger quests.

### Core NPCs

**The Mentor — "Old Iron"**
- Appears at: First launch, first session, first PR, every 10 levels
- Role: Guide. Delivers motivational coaching lines. Ties to the coaching system already in the app.
- Dialogue examples:
  - *"The mountain doesn't care how you feel. You showed up anyway."*
  - *"A PR? I've been waiting for this. The peak gets closer."*

**The Rival — "Shadow"**
- Appears at: When user's STRENGTH tier upgrades
- Role: Competitive edge. Challenges the user. A dark-palette version of the player sprite.
- Dialogue examples:
  - *"You think Titan-level is strong? I'm already past it. Keep lifting."*
  - *"I felt that deadlift. You're catching up."*

**The Merchant — "The Vendor"**
- Appears at: Every 5 levels and after Legendary chest opens
- Role: Coin shop NPC. Sells cosmetics, consumable power-up charges.
- Dialogue: Short, gruff, humorous. Never gives anything away for free.

**The Oracle — "The Summit Voice"**
- Appears at: 50th session, 100th session, yearly anniversary
- Role: Epic, rare encounter. Delivers a unique message built from the user's real stats.
- Dialogue example:
  - *"You've lifted [X] kg total. That's the weight of [landmark]. The summit sees you."*

**The Boss — "The Colossus"** (Premium, Gang Boss Fights)
- Appears in the Boss Fight screen. Animated pixel boss with a health bar driven by collective gang volume.

---

## Free Version — "The Ascent Loop"

The free version has a **single level: The Ascent**. The level is an infinite loop.

### How the Loop Works

1. The character starts at the base of a pixel-art mountain
2. Workouts move the character up the mountain (XP → altitude)
3. Reaching the summit triggers the **Summit Event** — a cutscene, coin shower, NPC encounter, Legendary chest
4. The character **descends and begins again** — but now carries:
   - All collected cosmetics
   - All stats (STRENGTH, AGILITY, ENDURANCE)
   - A **1.25× multiplier** on all coins and XP earned in the next loop
   - A new title suffix ("Loop II", "Loop III", etc.)
5. The mountain's visual difficulty increases each loop — different weather, darker palette, more intense animations

### Free Version Feature Set

- Full XP + coin earning
- All stat tracking
- Character appearance upgrades (3 per stat tier × 3 stats = up to 9 visible changes)
- Secret Chests (all triggers)
- Core NPCs: Old Iron, The Rival, The Merchant
- Single loop level map
- Power-ups (3 slots)
- Local-only, no social

---

## Premium Version — "The Expedition"

Premium unlocks a multi-level world with social multiplayer.

### Levels / Worlds

Each level is a distinct landscape with its own pixel art environment, ambient audio, and weather system driven by vibe.

| Level | Landscape | Unlock Condition |
|---|---|---|
| The Ascent | Mountain | Free (starting world) |
| The Forge | Underground lava caverns | Reach STRENGTH tier 2 |
| The Tundra | Arctic snowfields | Maintain AGILITY "Sprinter" for 4 weeks |
| The Storm Peak | Cloud-wreathed summit | Complete 100 sessions |
| The Void | Dark dimension, enemy-filled | Defeat a solo boss |
| The Eden | Tropical paradise — final "peace" world | Legendary tier all 3 stats |

Each world has:
- Unique NPC roster
- World-specific chests with themed loot
- Boss fight available
- Unique music track
- Weather tied to vibe (same system as current design, per-world palette)

### Gang System

**Creating / Joining a Gang:**
- User connects a social account (Apple Sign-In / Google — no email required, privacy-first)
- Creates a gang with a name + custom pixel banner
- Invites friends via deep link or QR code
- Gang cap: 5 members (free to create gangs, social features are premium)

**Gang Stats:**
- Combined STRENGTH, AGILITY, ENDURANCE (sum of all members' stats)
- Gang XP pool and Gang Level
- Gang leaderboard (internal — member rankings by contribution)

### Boss Fights

A Gang Boss Fight is a **48-hour collective challenge**.

**Mechanics:**
1. Gang Leader initiates a Boss Fight — selects a Boss from available roster
2. Boss has a **Health Pool** = function of boss tier (e.g., Tier 1: 50,000 kg combined volume)
3. Every set logged by any gang member during 48 hours deals damage (weight × reps = damage)
4. Gang members see a live boss health bar
5. If health reaches 0 before 48h → **VICTORY** — all members receive Boss Loot Chest
6. If timer runs out → Boss survives. 7-day cooldown before rematch.

**Boss Roster (Examples):**

| Boss | Health Pool | Theme | Loot |
|---|---|---|---|
| The Iron Brute | 25,000 kg | Starter boss, tutorial fight | Common gang cosmetic set |
| Colossus Rex | 75,000 kg | Mid-tier, punishing | Rare gear set for all members |
| The Void Titan | 250,000 kg | Late-game, week-long grind | Legendary exclusive skin + title |
| The Eternal Summit | 500,000 kg | Monthly event boss, max difficulty | Unique animated aura — "Summit Crowned" |

**Fitness Expeditions (Premium):**
- A Gang can launch a "Fitness Expedition" — a multi-day themed challenge
- Example: "7-Day Leg Fortress" — all members must hit a leg-focused volume goal each day
- Success → all members advance the Expedition map (pixel world exploration)
- Failure on any day → map progress resets by 1 step
- Completed expedition → gang-exclusive cosmetic + bonus XP for all

---

## Character Appearance Upgrade System

The character's sprite changes dynamically as stats increase. These are not purchased — they are earned automatically by the real fitness data.

### Appearance Slots

| Slot | Driven By | Tiers |
|---|---|---|
| Body / Build | STRENGTH | Lean → Athletic → Muscular → Massive |
| Armor | STRENGTH tier | None → Leather → Chain → Full Plate → Titan Plate |
| Movement Speed Aura | AGILITY | None → Shimmer → Wind Trail → Lightning Trail |
| Glow / Eyes | ENDURANCE | Dim → Steady Glow → Bright Glow → Full Aura |
| Weapon | Combined level | Fists → Dumbbell → Iron Bar → Axe → Mythic Weapon |
| Title Badge | Special achievements | "Newcomer" → "Climber" → "Summit Hunter" → "Legend" |

Cosmetic items from chests can layer on top of earned appearance slots — they never replace them, they enhance them.

---

## Monetization — Freemium Model

### Free Tier
- Full workout logging
- Full analytics
- Single Ascent loop level
- Full XP + coin + stat system
- Local chests and NPCs
- Core character appearance upgrades

### Premium Tier (Subscription, monthly or annual)
- All additional levels / worlds
- Gang creation and management
- Boss Fights and Expeditions
- 6 power-up slots (vs 3)
- Weekly and monthly summary shareable images (chart exports)
- Exclusive cosmetics in premium chest pool
- Oracle NPC encounters
- Priority loot table (higher drop rates on rare chests)

**No pay-to-win.** Premium gives more content and social features. All stat-based appearance upgrades are free — a free user who lifts more will always look stronger than a premium user who lifts less.

---

## Implementation Stages

---

### Stage 1 — Functional MVP (Cheap Assets, Core Engine)

**Goal:** Get the gamification engine running end-to-end with placeholder assets. Prove the loop feels good.

**Scope:**

**1.1 Stat Engine**
- Implement `src/lib/gamification.ts` with functions:
  - `computeStrengthStat(userId)` → reads total volume from SQLite
  - `computeAgilityStat()` → reads session frequency from sessions table
  - `computeEnduranceStat()` → reads avg session duration
  - `getStatTiers()` → returns all three tiers as named strings
- All derived from existing `sessions` + `sets` tables. Zero new tables for stats.

**1.2 XP + Level System**
- New SQLite table: `player_state (xp INTEGER, level INTEGER, coins INTEGER, loop_count INTEGER)`
- `awardXP(amount)`, `awardCoins(amount)` functions
- `getLevelProgress()` → returns `{ level, xpInLevel, xpToNext }`
- XP thresholds: `level^1.5 × 120` (scales naturally, avoids early-game rush)
- Wire up XP awards to existing events: session end, PR detection, set log

**1.3 Secret Chest Engine**
- New table: `chest_events (id, trigger_key TEXT UNIQUE, opened_at INTEGER)`
- `trigger_key` is a string like `"first_pr"`, `"session_10"`, `"midnight_set"`
- `checkChestTriggers(sessionId)` — evaluates all trigger conditions post-session
- Returns array of chest loot objects; marks triggers as seen (UNIQUE prevents double-fire)
- Loot table is a pure function, no extra DB tables

**1.4 Power-Up Inventory**
- New table: `powerups (type TEXT, charges INTEGER)`
- Simple CRUD: add charge, consume charge, list active
- Max 3 types active simultaneously (free)
- Apply multipliers in XP/coin award functions based on active powerups

**1.5 Basic Character Screen**
- New screen: `app/character.tsx`
- Displays: current level, XP bar, coin count, stat tier badges (text-based for MVP)
- Placeholder character: static PNG sprite (use free Kenney.nl RPG assets or similar CC0 assets)
- Shows equipped cosmetics (text labels only in MVP)
- Shows active power-ups with remaining charges

**1.6 NPC Pop-Up Component**
- New component: `src/components/NPCDialogue.tsx`
- Simple dark-themed modal with NPC name, dialogue text, a pixel NPC avatar (static PNG)
- Auto-fires at defined trigger points (first session, first PR, level 10)
- Dialogue strings stored in `src/data/npc-dialogues.ts`

**1.7 Post-Session Gamification Layer**
- After session ends, before the existing coaching message:
  1. Award XP + coins
  2. Check for level-up → show level-up animation
  3. Check for chest triggers → show chest open animation (loot reveal)
  4. Check for NPC triggers → show NPC dialogue
  5. Display power-up earned (if any)
- This layers on top of the existing `SummaryCard` + coaching flow

**1.8 Home Screen Badge**
- Small XP bar + level badge visible on the home screen below the Start Session button
- Shows: Level N · [XP bar] · Coin count

**Assets (MVP):**
- Use Kenney.nl "Tiny Dungeon" or "Pixel Platformer" pack — free, CC0 license
- 1 static character sprite with 4 palette variants (one per STRENGTH tier)
- Chest open animation: simple 4-frame sprite sheet
- NPC avatars: 3–4 static sprites from Kenney pack

**Deliverables for Stage 1:**
- [ ] `src/lib/gamification.ts` stat + XP + coin engine
- [ ] `app/character.tsx` character screen
- [ ] `src/components/NPCDialogue.tsx` NPC pop-up
- [ ] `src/components/ChestReveal.tsx` chest open modal
- [ ] Post-session gamification hook in `workout.tsx`
- [ ] Home screen XP badge
- [ ] All triggers wired to existing analytics hooks

---

### Stage 2 — The Free Version

**Goal:** Polished single-loop "Ascent" experience that feels like a complete game for free users.

**Scope:**

**2.1 Pixel Character — Animated Sprites**
- Commission or source 4 animated pixel character sprites (idle, walk, celebrate, defeated)
- Each sprite has 4 STRENGTH tier variants (16 animations total) + 3 AGILITY aura overlays
- Use `expo-asset` + `Image` with frame animation or Lottie JSON for character
- Character rendered in `app/character.tsx` and in post-session summary

**2.2 The Ascent Map Screen**
- Visual single-level mountain map
- Pixel art mountain with:
  - Base camp at bottom (character starts here each loop)
  - 5 checkpoint flags along the path (at XP milestones)
  - Summit at top
- Character's position on map = current XP % of loop total
- Weather layer above mountain changes based on last session vibe:
  - Low Energy → rain / mist
  - Normal → clear sky
  - Crushing It → golden sun + wind streaks
- Checkpoints unlock minor loot (coins + power-up charge)

**2.3 Loop Completion — Summit Event**
- When character reaches summit XP threshold:
  - Full-screen summit animation (Lottie or frame animation — summit glow + character celebration)
  - Legendary chest auto-opens with loot reveal
  - Oracle NPC encounter (unique dialogue per loop number)
  - Loop counter increments
  - 1.25× multiplier activates for next loop (visually shown as a golden multiplier badge)
  - Character descends back to base camp, mountain resets visually
  - All stats + cosmetics + coins carry over

**2.4 Full Cosmetic System**
- Implement coin shop in `app/character.tsx` as a bottom sheet
- Cosmetic items stored in `src/data/cosmetics.ts`
- Equipped items stored in `player_state` table
- Apply equipped cosmetics as overlay sprites on base character

**2.5 Streak & Calendar Integration**
- Streak count (consecutive training days) computed from sessions table
- Streak milestone chests: 7-day, 30-day, 100-day
- Streak flame indicator on home screen badge

**2.6 Polish Pass**
- Sound effects: set logged (soft click), PR detected (chime), level up (fanfare), chest open (sparkle)
- Use `expo-av` for audio (short, small file sizes, OGG/MP3)
- Haptics on level-up, PR detection, chest open (`expo-haptics`)
- Lottie confetti on summit event (extend existing confetti trigger)
- All NPC dialogue fully written for core NPCs

**2.7 Onboarding Flow**
- First launch: Old Iron NPC introduces the character
- User names their character (stored in `player_state`)
- 2-step tutorial: "Log your first set" → "End your first session" → Summit preview

**Deliverables for Stage 2:**
- [ ] Full animated character sprites + STRENGTH/AGILITY visual variants
- [ ] Ascent map screen with weather + checkpoints
- [ ] Summit Event flow (animation + chest + NPC + loop reset)
- [ ] Coin shop + full cosmetic equip system
- [ ] Streak tracking + streak chest triggers
- [ ] Sound effects + haptic integration
- [ ] Full NPC dialogue pass
- [ ] Onboarding tutorial

---

### Stage 3 — The Premium Version + Freemium Launch

**Goal:** Ship the premium tier with social boss fights, multi-world progression, and subscription monetization. Launch on App Store.

**Scope:**

**3.1 Multi-World Progression**
- Implement world map screen: `app/worlds.tsx`
- 5 additional worlds beyond The Ascent (as defined above)
- Each world is a distinct pixel map file (Lottie or pre-rendered PNG scroll)
- World unlock conditions evaluated from SQLite data (same stat engine from Stage 1)
- World-specific NPC roster, chest pool, boss

**3.2 Gang System (Social Layer)**
- Implement Apple Sign-In + Google Sign-In via `expo-auth-session` or Clerk
- Minimal user profile: character name + avatar seed (no email required)
- Backend: lightweight Supabase project (Postgres + Realtime)
  - Table: `gangs (id, name, leader_id, created_at)`
  - Table: `gang_members (gang_id, user_id, joined_at)`
  - Table: `boss_fights (id, gang_id, boss_id, started_at, ends_at, current_hp, max_hp)`
  - Table: `boss_fight_contributions (fight_id, user_id, volume_contributed)`
- All social data is opt-in. Fitness data remains local; only `volume_contributed` is synced during boss fights.

**3.3 Boss Fight Screen**
- New screen: `app/boss-fight.tsx`
- Shows: animated boss sprite (Lottie), health bar, 48h countdown timer, gang member contribution list
- Syncs live via Supabase Realtime subscription
- Each session end auto-syncs total session volume to active fight (if one is running)
- Victory and defeat cutscenes

**3.4 Fitness Expeditions**
- New screen: `app/expedition.tsx`
- Gang leader configures: theme (muscle group focus), target volume per member per day, duration (3/5/7 days)
- Expedition map: pixel adventure path with daily checkpoints
- Each member's daily status synced to Supabase
- Group success/failure triggers gang-wide event

**3.5 Premium Gate**
- `react-native-purchases` (RevenueCat) for subscription management
- Subscription SKUs: monthly and annual
- `src/lib/entitlements.ts` — checks premium status, gates features
- Premium features gated gracefully: show preview, explain value, offer upgrade

**3.6 Exclusive Premium Content**
- 3 premium-exclusive cosmetic sets (themed around boss kills — "Void Slayer", "Titan's Crown", "Storm Born")
- Animated aura effects (Lottie overlays on character)
- The Oracle NPC — extended dialogue tree, builds speech from real user stats:
  - *"In [X] weeks you've lifted [total volume]. Your STRENGTH is [tier]. The mountain knows your name."*
- Weekly + monthly + yearly summary chart image export (shareable PNG)
- 6 power-up slots

**3.7 App Store Launch Readiness**
- Custom character select on onboarding (3 starting character styles — same stats, different look)
- Privacy Policy (hosted URL) + Terms of Service
- All in-app purchases properly disclosed
- Screenshot set: character screen, boss fight, ascent map, gang screen, workout flow
- App icon updated to feature pixel character alongside GiGoFit brand

**Deliverables for Stage 3:**
- [ ] Multi-world map + 5 additional worlds
- [ ] Supabase backend (gangs, boss fights, expeditions)
- [ ] Apple Sign-In + Google Sign-In
- [ ] Gang creation, invite, and management screens
- [ ] Boss Fight screen with live sync
- [ ] Fitness Expedition screen
- [ ] RevenueCat subscription integration
- [ ] `src/lib/entitlements.ts` premium gate
- [ ] Oracle NPC with real-stat dialogue builder
- [ ] Premium-exclusive cosmetics + aura effects
- [ ] Full App Store submission package

---

## Additional Ideas (Executable, Worth Considering)

**Character Aging / Legacy System**
If a user goes 14+ days without a session, the character doesn't disappear — it "rests". Its sprite gains a resting pose and a subtle dust particle effect. When they return, a "Comeback Chest" triggers and Old Iron gives a comeback speech. This rewards return without punishing absence.

**Training Log = Quest Log**
The session history screen (`app/analytics.tsx`) reframes each past session as a "quest entry" — same data, different skin. "Session #42 · Leg Day · 3,200 kg · 48 min" becomes "Quest: Titan's Trial · Volume: 3,200 kg · Duration: 48 min · Status: Completed."

**Daily Challenge System (Stage 2+)**
Each day, a randomly selected challenge fires at first app open:
- "Log 5 sets of any chest exercise today" → +150 XP
- "Reach 2,000 kg volume this session" → +200 coins
- "Complete a session in under 40 minutes" → Blitz power-up
Challenges are generated from the user's existing exercise history — always achievable, never trivial.

**Rival Ghost — The Shadow Climb (Stage 2+)**
On the Ascent map, a ghost character (dark palette) shows where the user was at this same point last loop. If you're ahead of your ghost, a "Beating Your Shadow" banner shows. If behind, "The Shadow Gains" flickers ominously. Uses loop history stored in `player_state`.

**Seasonal Boss Events (Stage 3+)**
Monthly limited-time events: a world boss appears that all premium users collectively fight across the platform. A global health bar ticks down as every premium user logs volume. If the global community kills it in 30 days, everyone gets an exclusive cosmetic drop. No individual performance pressure — even 1 set contributed counts.

**Character Voice Lines (Stage 3)**
3–5 short audio clips (under 2 seconds each) played at key moments:
- PR: *"That's mine."*
- Level up: *"Level up."*
- Session end: *"Done. For now."*
Localized per platform language. Hire a voice actor on Fiverr — budget: under $200 for full set.

---

## Technical Architecture Notes

- All gamification state in SQLite (`player_state`, `chest_events`, `powerups`) — local-first, never requires backend
- Social features (Stage 3) are additive — the app works 100% without network
- XP/coin awards are atomic — computed and saved in `withTransactionAsync` alongside session-end writes
- Chest trigger checks run post-session, async, never block the UI
- The stat engine is a pure computation layer — no new DB writes for stats, just reads + derives
- Character sprite rendering uses `Image` (static) or Lottie (animated) — no game engine needed
- NPC dialogue is static JSON — no backend required for single-player NPC content

---

## Asset Budget Estimate (Stage 1 → Stage 3)

| Stage | Asset Type | Source | Estimated Cost |
|---|---|---|---|
| 1 | Placeholder sprites | Kenney.nl (CC0 free) | $0 |
| 2 | Animated character (4 variants × 4 animations) | Fiverr pixel artist | $300–$600 |
| 2 | Ascent map + mountain | Fiverr | $150–$300 |
| 2 | Chest + NPC sprites | Fiverr | $100–$200 |
| 2 | Sound effects | Freesound.org / Kenney | $0–$50 |
| 3 | 5 additional world maps | Fiverr | $400–$800 |
| 3 | Boss sprites (5 bosses) | Fiverr | $300–$600 |
| 3 | Premium cosmetic sets | Fiverr | $200–$400 |
| 3 | Voice lines | Fiverr voice actor | $100–$200 |
| **Total** | | | **$1,550–$3,150** |

This is a conservative budget for a premium-feeling pixel RPG layer on top of an existing functional app.
