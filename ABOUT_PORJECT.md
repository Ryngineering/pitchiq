# PitchIQ - About Project

## 1. Project Overview
PitchIQ is a cricket match prediction web application focused on IPL-style matchups. Users can browse upcoming and live matches, make winner predictions, track points, and compare performance on a leaderboard.

The app is built as a responsive PWA so it works well on desktop and mobile, and can be installed on supported devices for an app-like experience.

## 2. Product Modes
PitchIQ supports two primary user modes:

1. Signed-In Mode
- User logs in with Google via Supabase Auth.
- If approved by admin, the user gets full app access.
- User can lock predictions, use AI Coach, and have activity synced to DB.

2. Guest Mode
- User can enter without login.
- Guest users can browse demo content (sample matches and sample leaderboard) to understand the app experience.
- Guest users are blocked from write operations and AI invocation.
- App shows upgrade prompts such as: sign in to predict, sign in to use AI Coach.

## 3. Main Screens
The app has four core screens:

1. Home Screen
- Shows match cards split by Live, Upcoming, and Completed.
- Displays team matchup, score/status, probability bar, and pick-related context.
- In guest mode, this screen uses demo match fixtures.

2. Match Detail Screen
- Deep view for one match.
- Contains three tabs:
- Live tab: live score context and momentum-focused stats.
- Predict tab: winner probabilities and prediction controls.
- Points tab: explains potential points for each side.
- Includes AI Coach CTA (signed-in users only).

3. Leaderboard Screen
- Displays podium and ranked list of users by points and accuracy.
- Shows movement indicators and season context.
- In guest mode, this screen uses demo leaderboard rows.

4. Profile Screen
- Shows identity summary, points, and prediction history.
- Admin users can view pending approvals.
- In guest mode, profile actions are read-only and include sign-in prompts.

## 4. Scoring and Points Logic
PitchIQ rewards contrarian accuracy.

Current scoring rule:
- points = (100 - probability) / 10

Examples:
- Correct prediction at 50% probability = 5.0 points
- Correct prediction at 90% probability = 1.0 points
- Lower-probability correct calls generally earn higher points

This encourages risk-aware picks rather than only choosing favorites.

## 5. Match Detail Experience
The Match Detail page is designed to help decision-making quickly:

1. Live tab
- Focuses on current game context (run progression, innings state, pressure clues).
- Gives a fast sense of momentum shifts while match is in progress.

2. Predict tab
- Shows side-by-side probabilities.
- Lets users choose a team and lock in prediction.
- For guests, prediction actions are blocked with clear sign-in prompts.

3. Points tab
- Shows expected points for each side if prediction is correct.
- Makes tradeoff between safety and upside explicit.

## 6. AI Coach Integration
AI Coach is designed as an optional guidance layer.

Intent:
- Help users make informed picks using structured insights rather than random guesses.

Input signals for guidance include:
- Current match state and score context
- Team-level context and available match statistics
- Deterministic rules for fallback behavior and confidence shaping
- External or internet-derived cricket context where enabled in backend pipeline

Output shape shown to user:
- Suggested pick
- Confidence level
- Key supporting insights
- Risk note and invalidation conditions

Security model:
- AI invocation is restricted to authenticated users.
- Guest mode shows upsell messaging instead of invoking edge function.

## 7. Security and Abuse-Prevention Posture
The app is built with a defense-in-depth mindset:

1. Guest mode restrictions
- No prediction writes
- No AI edge function calls
- Read-only, demo-first experience

2. Authenticated data protections
- Supabase Auth and RLS-backed data access patterns
- Client-side guards plus backend policy enforcement

3. Operational hardening
- Ready for CAPTCHA/rate-limit strategy at auth layer
- JWT-required edge invocation patterns for sensitive compute paths

## 8. PWA Capabilities
PitchIQ is a Progressive Web App with install support.

PWA characteristics:
- Manifest file and icons
- Service worker for caching and app shell behavior
- Mobile-friendly layout and interaction model

Install behavior (typical):

1. Android (Chrome/Edge)
- Open PitchIQ in browser.
- Tap browser menu.
- Choose Install app or Add to Home screen.

2. iOS (Safari)
- Open PitchIQ in Safari.
- Tap Share.
- Tap Add to Home Screen.

3. Desktop (Chrome/Edge)
- Open PitchIQ.
- Click install icon in address bar (if shown) or browser menu install option.

After install:
- App opens in standalone mode.
- Users get a native-like launch experience from home screen/dock.

## 9. Typical User Journey
1. User opens app.
2. User chooses Continue as Guest or Continue with Google.
3. Guest can explore sample matches and sample leaderboard.
4. User signs in to unlock predictions and AI guidance.
5. User locks picks, follows live updates, and climbs leaderboard.

## 10. Current Product Positioning
PitchIQ combines:
- Fast visual match context
- Probability-driven scoring
- Optional AI-assisted insight
- Low-friction onboarding via guest mode
- Secure, authenticated pathways for write and AI operations

This makes it suitable for internal competitions, community prediction games, and engagement-driven cricket experiences.