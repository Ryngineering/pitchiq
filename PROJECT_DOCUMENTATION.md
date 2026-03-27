# 🏏 PitchIQ - Complete Project Documentation

## Project Overview

PitchIQ is a **cricket prediction game** where users predict IPL (Indian Premier League) match winners, earn points based on odds, and compete on a leaderboard. It's a real-time prediction platform with a responsive UI designed for learning modern React patterns and web development practices.

---

## 🛠️ Technology Stack

| Layer               | Technologies         | Purpose                                                     |
| ------------------- | -------------------- | ----------------------------------------------------------- |
| **UI Framework**    | React 19.2.4         | Component-based UI development                              |
| **Build Tool**      | Vite 8.0.0           | Lightning-fast bundling & hot module replacement dev server |
| **Icons**           | Lucide React 0.577.0 | SVG icon library for UI components                          |
| **Styling**         | CSS (custom)         | Global styles in App.css                                    |
| **Runtime**         | Node.js              | Server-side execution                                       |
| **Package Manager** | npm                  | Dependency management                                       |

---

## 📁 Project Structure

```
pitchiq/
├── src/
│   ├── main.jsx                    ← Entry point
│   ├── App.jsx                     ← Root component (state orchestrator)
│   ├── App.css                     ← Global styles
│   ├── index.css                   ← Base styles
│   ├── data.js                     ← Data layer (constants & utilities)
│   └── components/
│       ├── HomeScreen.jsx          ← Match feed display
│       ├── MatchDetail.jsx         ← Detailed match view & prediction interface
│       ├── LoginScreen.jsx         ← Authentication screen
│       ├── LeaderboardScreen.jsx   ← Rankings & podium display
│       ├── ProfileScreen.jsx       ← User profile & prediction history
│       ├── MatchCard.jsx           ← Reusable match card component
│       ├── ProbBar.jsx             ← Probability visualization bar
│       ├── BottomNav.jsx           ← Navigation bar component
│       └── Toast.jsx               ← Notification toast component
├── public/                          ← Static assets
├── package.json                     ← Dependencies & scripts
├── vite.config.js                   ← Vite configuration
├── index.html                       ← HTML entry point
└── eslint.config.js                 ← Linting configuration

```

---

## 🔄 Application Flow (User Journey)

### **1. Startup & Initialization**

```
Browser loads index.html
     ↓
main.jsx runs → imports App component
     ↓
React creates root element and renders <App />
     ↓
App component initializes state
```

### **2. User Navigation Flow**

```
┌─────────────────────────────────────┐
│ App Component Loads                 │
│ - Initializes all state variables  │
└──────────────┬──────────────────────┘
               ↓
        ┌──────────────┐
        │ Check user   │
        └──────┬───────┘
        ┌──────┴──────────────┐
        ↓ user = null         ↓ user exists
   LoginScreen           HomeScreen
        │                     │
        │ (Simulate Login)    ├─→ Shows 3 sections:
        │ setUser({...})      │   • 🟢 Live matches
        │                     │   • ⏳ Upcoming matches
        ↓                     │   • ✓ Completed matches
   [User Authenticated]       │
        │                     │
        └─────────────┬───────┘
                      ↓
    ┌───────────────────────────────────┐
    │ Bottom Navigation Available        │
    │  🏠 Matches | 🏆 Rankings | 👤 Profile
    └───────────────┬───────────────────┘
                    │
    ┌───────────────┼──────────────┐
    ↓               ↓              ↓
HomeScreen    Leaderboard    ProfileScreen
    │          Screen         (Stats, History,
    │          (Rankings      Notifications)
    │           Podium)
    │
    └─→ Tap Match Card
        ├─ selectedId = match.id
        ├─ screen = "match"
        └─ renders MatchDetail
               ↓
        ┌─────────────────────┐
        │ MatchDetail Screen  │
        │ - Team information  │
        │ - Live scores       │
        │ - Prediction input  │
        │ - Points calculator │
        └─────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
Lock Prediction      Back to Home
(Save to state)   (screen = "home")
    │
    └─→ Toast notification
        "🔐 Locked in! MI to win · 3.8 pts"
```

### **3. Screen Navigation**

Users navigate between 4 main screens using:

- **Bottom Navigation Bar** (3 tabs):
  - 🏠 **Matches** → HomeScreen
  - 🏆 **Rankings** → LeaderboardScreen
  - 👤 **Profile** → ProfileScreen
- **Match Card Click** → MatchDetail (click back button to return)
- **Bell Icon** (in HomeScreen) → ProfileScreen (notifications)

---

## 💾 State Management (In App.jsx)

```javascript
const [user, setUser] = useState(null);
// Current logged-in user object
// { name: "Ryngineer", email: "you@company.com" }

const [screen, setScreen] = useState("home");
// Active screen: "home" | "match" | "leaderboard" | "profile"

const [matches, setMatches] = useState(INITIAL_MATCHES);
// Array of all matches with live updates

const [selectedId, setSelectedId] = useState(null);
// ID of currently viewed match in MatchDetail

const [predictions, setPredictions] = useState(INIT_PREDS);
// Object mapping match IDs to user predictions
// { 1: { team: "MI", prob: 62, pts: 3.8, ... }, ... }

const [toast, setToast] = useState(null);
// Current notification { msg: "...", emoji: "..." }
```

---

## 🎯 Key Features Explained

### **1. Live Probability Shifting**

Located in App.jsx `useEffect` hook:

```javascript
useEffect(() => {
  if (!user) return;
  const iv = setInterval(() => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.status !== "live") return m;
        const delta = (Math.random() - 0.46) * 3.5;
        const newP = Math.min(88, Math.max(12, m.t1p + delta));
        return { ...m, t1p: Math.round(newP) };
      }),
    );
  }, 2800); // Updates every 2.8 seconds
  return () => clearInterval(iv); // Cleanup on unmount
}, [user]);
```

**What it does:**

- Simulates real-time odds changing during live matches
- Random delta between -1.54 to +2.0 (biased toward increase)
- Probability clamped between 12-88%
- Updates every 2.8 seconds
- Cleanup function prevents memory leaks

### **2. Points Calculation System**

```javascript
export function calcPts(prob) {
  return +((100 - prob) / 10).toFixed(1);
}
```

**Logic:** Picking the underdog returns more points

Examples:

- Pick team at **30% odds** → (100-30)/10 = **7.0 points**
- Pick team at **50% odds** → (100-50)/10 = **5.0 points**
- Pick team at **70% odds** → (100-70)/10 = **3.0 points**

**Reward System:** The greater the upset (lower probability), the higher the reward.

### **3. Prediction System**

When a user locks in a prediction:

```javascript
{
  matchId: 1,
  team: "MI",              // Which team they picked
  prob: 62,                // Probability at time of prediction
  result: null,            // Updates to "won"/"lost" after match
  pts: 3.8,                // Points they would earn
  confirmed: true          // Locked and cannot change
}
```

**Workflow:**

1. User selects a team on MatchDetail screen
2. Calls `handlePredict(matchId, team, prob)`
3. Updates `predictions` state
4. Shows toast notification
5. Saves probability snapshot (odds might change later)

### **4. Toast Notifications**

Temporary feedback notifications shown for 3.2 seconds:

```javascript
const showToast = (msg, emoji = "🏏") => {
  setToast({ msg, emoji });
  setTimeout(() => setToast(null), 3200);
};
```

**Examples:**

- `"🔐 Locked in! MI to win · 3.8 pts if correct"`
- `"Prediction saved!"`

### **5. Match Status System**

Matches can be in three states:

```javascript
status: "live" | // Match is currently playing
  "upcoming" | // Match scheduled for future
  "completed"; // Match ended, result known
```

Each status shows different UI:

- **Live**: Current scores, live probability, option to change prediction
- **Upcoming**: Schedule info, make initial prediction
- **Completed**: Final scores, whether prediction won/lost, points earned

---

## 📊 Data Layer (data.js)

### **Teams (T Object)**

Each IPL team defined with:

```javascript
{
  name: "Mumbai Indians",    // Full name
  s: "MI",                   // Short code
  bg: "#004BA0",             // Background color
  fg: "#FFFFFF",             // Foreground/text color
  em: "⚡"                    // Emoji representation
}
```

**Why this structure:**

- Centralized team metadata
- Colors for visual consistency
- Easy to reference throughout app

### **Matches (INITIAL_MATCHES Array)**

```javascript
{
  id: 1,                          // Unique identifier
  t1: "MI",                       // Team 1 code
  t2: "CSK",                      // Team 2 code
  label: "Match 12 · IPL 2025",
  date: "Today · 7:30 PM IST",
  venue: "Wankhede Stadium, Mumbai",
  status: "live",                 // live | upcoming | completed
  t1p: 62,                        // Team 1 win probability (%)

  // Only for live matches:
  t1s: "142/4",                   // Score (runs/wickets)
  t1o: "15.2",                    // Overs played
  t2s: "—",                       // Opponent score
  t2o: "Yet to bat",
  totalOvers: 20,
  currentOver: 15.2,

  // Only for completed matches:
  winner: "SRH",                  // Winning team
}
```

### **Leaderboard (LB_DATA Array)**

Users ranked by points:

```javascript
{
  id: 1,
  name: "Priya Sharma",
  av: "PS",                  // Avatar initials
  pts: 47,                   // Total points
  correct: 6,                // Correct predictions
  total: 8,                  // Total predictions
  isMe: false                // Highlighted if true
}
```

### **User Predictions (INIT_PREDS Object)**

Map of match ID to prediction:

```javascript
{
  4: {
    team: "SRH",
    prob: 52,
    result: "won",           // Populated after match
    pts: 4.8,
    confirmed: true
  },
  5: {
    team: "LSG",
    prob: 28,
    result: "won",
    pts: 7.2,
    confirmed: true
  }
}
```

---

## 🧩 Component Communication Pattern

### **Data Flow (Unidirectional)**

```
App (State Owner)
  ├─ state: user, matches, predictions, ...
  │
  ├─ props → HomeScreen
  │    ├─ matches
  │    ├─ predictions
  │    ├─ myPoints
  │    └─ onMatch(id)         ← callback to change screen
  │
  ├─ props → MatchDetail
  │    ├─ match
  │    ├─ prediction
  │    ├─ onPredict(...)       ← callback to save prediction
  │    └─ onBack()             ← callback to return home
  │
  ├─ props → LeaderboardScreen
  │    └─ (read-only data)
  │
  ├─ props → ProfileScreen
  │    ├─ user
  │    └─ (read-only data)
  │
  └─ props → BottomNav
       ├─ active
       └─ onChange(screen)     ← callback to switch screens
```

**Key Pattern:**

- **Parent (App) manages ALL state**
- **Child components receive data via props**
- **Child components call callbacks to notify parent of changes**
- **React re-renders when state updates**

---

## 🚀 Build & Deployment

### **Development Mode**

```bash
npm run dev
```

- Starts Vite dev server (default: localhost:5173)
- Hot Module Replacement (HMR) for instant refresh on code changes
- Fast build times (~100ms)
- Better error messages

### **Production Build**

```bash
npm run build
```

Creates optimized `/dist` folder with:

- `index.html` - Single entry point
- `assets/index-[hash].js` - Bundled & minified React code
- `assets/index-[hash].css` - All styles combined

**Why optimized:**

- Tree-shaking removes unused code
- Code splitting for faster load times
- Asset hashing for browser caching

### **Deployment Steps**

#### **Option 1: Vercel (Recommended)**

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Auto-deploys on every push
4. Instant preview URLs

#### **Option 2: Netlify**

1. `npm run build`
2. Drag `/dist` folder into Netlify dashboard
3. Or connect GitHub for auto-deploy

#### **Option 3: AWS S3 + CloudFront**

1. `npm run build`
2. Upload `/dist` contents to S3 bucket
3. Configure CloudFront for CDN
4. Set up domain routing

#### **Option 4: GitHub Pages**

1. `npm run build`
2. Commit `/dist` to `gh-pages` branch
3. Enable GitHub Pages in repo settings
4. Access at `https://username.github.io/repository`

---

## 🌐 Runtime Behavior (When Deployed)

### **Step-by-Step Execution**

1. **User opens deployed URL**
   - Browser downloads `index.html`
   - Browser downloads `assets/index-[hash].js` (React & components)
   - Browser downloads `assets/index-[hash].css` (all styles)

2. **React initializes**
   - `main.jsx` runs
   - Creates React root
   - Renders `<App />` component

3. **App component mounts**
   - All state initialized (user = null)
   - `useEffect` hook sets up probability interval
   - Renders LoginScreen (since user is null)

4. **User "logs in"** (simulated)
   - `setUser({ name: "...", email: "..." })`
   - Component re-renders
   - Now shows HomeScreen

5. **Live matches update**
   - Every 2.8 seconds, probability shifts
   - `setMatches()` triggers re-render
   - Users see odds changing in real-time

6. **User interacts**
   - Click match card → `screen = "match"`, renders MatchDetail
   - Click "Lock In Prediction" → saves to `predictions` state
   - Click navigation → changes `screen` state
   - All state changes trigger re-renders

7. **State persists until page refresh**
   - All data stored in browser memory (RAM)
   - Refreshing page resets everything
   - No backend persistence (learning project)

---

## 💡 Learning Concepts

### **React Fundamentals**

1. **Components**
   - Functional components vs Class components
   - Component composition & reusability
   - Props for parent→child communication

2. **Hooks**
   - `useState()` - Local state management
   - `useEffect()` - Side effects & lifecycles
   - Cleanup functions (clearing intervals)

3. **Conditional Rendering**

   ```javascript
   {screen === "home" && <HomeScreen {...} />}
   {screen === "match" && <MatchDetail {...} />}
   ```

4. **Lists & Keys**

   ```javascript
   {
     matches.map((m) => <MatchCard key={m.id} match={m} />);
   }
   ```

5. **Event Handling**
   - onClick, onChange callbacks
   - Event delegation bubbling
   - Preventing default behavior

### **JavaScript Concepts**

- **Array methods**: `.map()`, `.filter()`, `.find()`
- **Object manipulation**: Spread operator `{...prev}`
- **Template literals**: `` `Text ${variable}` ``
- **Destructuring**: `const { name, email } = user`
- **Callbacks & Higher-order functions**
- **Arrow functions** & lexical `this` binding

### **Web Development Patterns**

1. **State Management**
   - Central store (App component)
   - Lifting state up
   - Props drilling alternatives

2. **Component Patterns**
   - Container vs Presentational
   - Controlled components
   - Callback patterns

3. **Performance**
   - Re-render optimization
   - useEffect dependencies
   - Memory leak prevention

4. **CSS & Styling**
   - CSS Flexbox for layouts
   - CSS Grid (if used)
   - Responsive design principles
   - CSS variables for theming

---

## 🔧 Build Tool Concepts (Vite)

### **Why Vite Over Webpack?**

| Aspect           | Vite          | Webpack       |
| ---------------- | ------------- | ------------- |
| Dev Server Start | ~100ms        | 2-10s         |
| Hot Reload       | Instant       | 1-3s          |
| Build Time       | Fast (~500ms) | Slow (10-30s) |
| ES Modules       | Native        | Transpiled    |
| Config           | Minimal       | Complex       |

### **Vite Features Used**

1. **Hot Module Replacement (HMR)**
   - Edit code → browser updates instantly
   - Preserves component state during edits

2. **Plugin System**
   - `@vitejs/plugin-react` handles JSX transformation
   - Converts JSX to `React.createElement()` calls

3. **Tree Shaking**
   - Removes unused exports
   - Smaller bundle size

4. **Asset Optimization**
   - Minifies CSS/JS
   - Hashes filenames for caching

---

## 📝 Production Considerations (Future Enhancements)

### **Backend Integration**

- REALAuthentication\*\*: Real Google OAuth with Firebase/Supabase
- **Database**: Store predictions, user profiles, leaderboard data
- **Real-time Updates**: WebSockets instead of `setInterval`

### **Data Persistence**

- **LocalStorage**: Save user data across browser sessions
- **Cloud Sync**: Sync predictions across devices

### **Performance**

- **Code Splitting**: Load screens on-demand
- **Image Optimization**: Lazy load team logos
- **Caching**: Service Workers for offline support

### **Monitoring**

- **Error Tracking**: Sentry for bug reporting
- **Analytics**: Google Analytics for user behavior
- **Performance Monitoring**: Lighthouse checks

### **Security**

- **Input Validation**: Prevent XSS attacks
- **HTTPS**: Secure data transmission
- **Rate Limiting**: Prevent abuse
- **CORS**: Cross-origin resource sharing

---

## 🎓 Key Takeaways

1. **React is declarative** - Describe what UI should look like
2. **State drives UI** - UI updates when state changes
3. **Components are reusable** - Build once, use everywhere
4. **Separation of concerns** - Keep data, logic, and UI separate
5. **Unidirectional data flow** - Easier to debug than two-way binding
6. **Vite enables fast iteration** - Focus on code, not build times
7. **Static hosting is flexible** - Deploy anywhere (Vercel, Netlify, S3, etc.)

---

## 📚 Project Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Lucide Icons**: https://lucide.dev
- **JavaScript Array Methods**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
- **CSS Flexbox**: https://css-tricks.com/snippets/css/a-guide-to-flexbox/

---

## 🚢 Next Steps for Learning

1. **Add backend**: Connect to Firebase/Supabase for persistence
2. **Real authentication**: Implement Google OAuth login
3. **WebSockets**: Real-time match updates and odds
4. **State management**: Introduce Context API or Redux
5. **Testing**: Add Jest & React Testing Library
6. **TypeScript**: Add type safety to the codebase
7. **PWA**: Make it installable on mobile devices

---

**Last Updated**: March 14, 2026
**Project Type**: Learning Project - React + Vite
**Status**: Core functionality complete, ready for enhancement
