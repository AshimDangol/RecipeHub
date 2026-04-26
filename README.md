# RecipeNest
# RecipeNest


A full-stack recipe sharing platform built with React and Node.js. Chefs publish recipes, build a portfolio, and manage their profile. Food lovers discover recipes, follow chefs, leave reviews, like and favourite dishes, and get notifications. Admins moderate content via a dedicated dashboard. **ChefBot** — an AI cooking assistant powered by a local Ollama model — is available on every page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite 5 |
| Styling | Plain CSS — custom dark-first design system, responsive |
| Backend | Node.js, Express 4, MongoDB (Mongoose 8), Multer, JWT |
| Auth | JWT — bcryptjs, 7-day expiry, IP-based rate limiting |
| AI Chat | Ollama — local LLM, no API keys, no cloud |

---

## Project Structure

```
RecipeNest/
├── frontend/
│   ├── index.html
│   ├── vite.config.js          # Vite + API proxy to :5200
│   ├── package.json
│   ├── css/
│   │   └── styles.css          # Global design system
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Route definitions
│       ├── api.js              # Fetch client + mediaUrl() + chatApi
│       ├── toast.js            # Toast helper
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state
│       ├── components/
│       │   ├── Layout.jsx      # Sidebar, search modal, notification bell
│       │   ├── OllamaChat.jsx  # ChefBot floating chat panel
│       │   ├── ProtectedRoute.jsx
│       │   ├── RecipeCard.jsx
│       │   └── StarRating.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Recipes.jsx
│           ├── RecipeDetail.jsx
│           ├── RecipeForm.jsx  # Create & edit (shared)
│           ├── Chefs.jsx
│           ├── ChefDetail.jsx
│           ├── Profile.jsx
│           ├── ProfileEdit.jsx
│           ├── Dashboard.jsx
│           ├── Notifications.jsx
│           ├── Admin.jsx
│           ├── Moderation.jsx
│           └── NotFound.jsx
│
└── backend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── server.js
        ├── app.js
        ├── config/
        │   └── db.js
        ├── models/
        │   ├── User.js
        │   ├── Recipe.js
        │   ├── Review.js
        │   ├── Like.js
        │   ├── Favorite.js
        │   ├── Follow.js
        │   ├── Notification.js
        │   └── ModerationLog.js
        ├── routes/
        │   ├── auth.js
        │   ├── users.js
        │   ├── recipes.js
        │   ├── reviews.js
        │   ├── chefs.js
        │   ├── notifications.js
        │   ├── admin.js
        │   └── chat.js         # ChefBot — Ollama SSE proxy
        ├── middleware/
        │   ├── auth.js
        │   ├── upload.js
        │   └── errorHandler.js
        └── scripts/
            ├── createAdmin.js
            └── seed.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017
- [Ollama](https://ollama.com/download) installed (for ChefBot)

---

## Quick Start — Run Everything

Open **three separate terminals** and run the following commands in order.

---

### Terminal 1 — Ollama (AI Chat)

```bash
# Check if Ollama is already running (it auto-starts on most systems)
ollama list

# If not running, start it
ollama serve

# Pull the model (only needed once)
ollama pull llama3.2
```

> If you see `Error: listen tcp 0.0.0.0:11434: bind: Only one usage...` — Ollama is already running. Skip `ollama serve`.

---

### Terminal 2 — Backend

```bash
cd backend

# First time only — copy the example env file
cp .env.example .env

# Install dependencies (first time only)
npm install

# Create the admin account (first time only)
node src/scripts/createAdmin.js

# Seed 10 chefs and 50 recipes (first time only)
node src/scripts/seed.js

# Start the backend
npm run dev
```

> API runs at **http://localhost:5200**

> If login fails right after seeding, restart the backend once to reset the in-memory rate limiter.

---

### Terminal 3 — Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the frontend
npm run dev
```

> App opens at **http://localhost:3000**

---

## Environment Variables

All variables live in `backend/.env`. Copy from `backend/.env.example` to get started.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5200` | Backend server port |
| `MONGODB_URI` | `mongodb://localhost:27017/recipenest` | MongoDB connection string |
| `JWT_SECRET` | — | **Required** — use a long random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded files |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.2:latest` | Model name — must match exactly what `ollama list` shows |

---

## Seed Data

The seed script is idempotent — safe to run multiple times.

| Data | Count |
|---|---|
| Chef users | 10 |
| Recipes (5 per chef) | 50 |
| Follow relationships | 30 |
| Likes | 22 |

Recipes span all 8 categories (Breakfast, Lunch, Dinner, Dessert, Snack, Soup, Salad, Drinks) and all 3 difficulty levels, each with Unsplash food photos, 6–8 ingredients, and 4–5 step instructions.

**Admin credentials**

| Field | Value |
|---|---|
| Email | admin@recipenest.com |
| Password | Admin@1234 |

**Seeded chef credentials**

| Chef | Email | Password |
|---|---|---|
| Gordon Ramsay | gordon@recipenest.com | Gordon@1234 |
| Julia Child | julia@recipenest.com | Julia@1234 |
| Jamie Oliver | jamie@recipenest.com | Jamie@1234 |
| Yotam Ottolenghi | yotam@recipenest.com | Yotam@1234 |
| Nigella Lawson | nigella@recipenest.com | Nigella@1234 |
| Thomas Keller | thomas@recipenest.com | Thomas@1234 |
| Ina Garten | ina@recipenest.com | Ina@12345 |
| Heston Blumenthal | heston@recipenest.com | Heston@1234 |
| Massimo Bottura | massimo@recipenest.com | Massimo@1234 |
| Nobu Matsuhisa | nobu@recipenest.com | Nobu@1234 |

---

## Features

### Navigation
- Collapsible sidebar — icon-only collapsed mode on desktop, drawer on mobile
- `Ctrl+K` / `Cmd+K` quick search modal — pages and recipe categories
- Live notification badge — polls every 30 seconds
- Mobile hamburger toggle

### Auth & Profiles
- Register and log in with JWT authentication
- Profile hero card — avatar, follower/recipe counts, bio, links
- Upload a profile photo (up to 5 MB)
- Follow / unfollow chefs
- Profile tabs: Recipes (public), Favourites and Following (owner only)

### Recipes
- Browse with category filters, difficulty filters, full-text search, and pagination
- Create, edit, and delete your own recipes — dynamic ingredient and instruction lists
- Upload a recipe photo (up to 10 MB)
- Like and favourite recipes
- Share via X/Twitter, Facebook, WhatsApp, or copy link
- Star ratings (1–5) and written reviews — edit and delete your own

### Dashboard
- Stats: recipe count, follower count, total likes, total reviews
- Manage all your recipes from one place
- Saved favourites grid

### Notifications
- Live unread badge in the sidebar
- Triggered by: new followers, recipe reviews, moderation actions
- Mark individual or all as read

### Admin
- Platform statistics — users, recipes, reviews, daily/monthly active users with bar charts
- Content moderation — search all recipes and reviews, flag with optional reason
- Flagged content hidden from public; owner notified automatically
- Restore flagged content
- Full audit log — searchable by title, author, reason, date

### ChefBot (AI Assistant)
- Floating 🤖 button fixed to the bottom-right corner on every page
- Powered by Ollama — runs locally, no internet required, no API keys
- Responses stream token-by-token as the model generates them
- Conversation history kept for context (last 10 messages per request)
- Quick suggestion chips on first open
- Clear button to reset the session
- Scoped to culinary topics: recipes, cooking techniques, ingredient substitutions, chef profiles, meal planning, and how to use RecipeNest
- Works with any Ollama model — swap by changing `OLLAMA_MODEL` in `.env`

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Example: `Password1`

---

## Production Build

```bash
cd frontend
npm run build       # outputs to frontend/dist/
npm run preview     # preview the production build locally
```

---

## API Reference

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | | Register new account |
| POST | `/api/auth/login` | | Login, returns JWT |

### Recipes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/recipes` | | List (paginated, searchable, filterable) |
| GET | `/api/recipes/search` | | Full-text search |
| GET | `/api/recipes/filter` | | Filter by category / difficulty |
| GET | `/api/recipes/:id` | | Get recipe |
| POST | `/api/recipes` | ✓ | Create recipe |
| PUT | `/api/recipes/:id` | ✓ | Update recipe |
| DELETE | `/api/recipes/:id` | ✓ | Delete recipe |
| POST | `/api/recipes/:id/image` | ✓ | Upload recipe image |
| GET | `/api/recipes/:id/status` | ✓ | Like / favourite state for current user |
| POST | `/api/recipes/:id/like` | ✓ | Like |
| DELETE | `/api/recipes/:id/like` | ✓ | Unlike |
| POST | `/api/recipes/:id/favorite` | ✓ | Favourite |
| DELETE | `/api/recipes/:id/favorite` | ✓ | Unfavourite |
| GET | `/api/recipes/:id/reviews` | | Get reviews |
| POST | `/api/recipes/:id/reviews` | ✓ | Submit review |

### Reviews

| Method | Route | Auth | Description |
|---|---|---|---|
| PUT | `/api/reviews/:id` | ✓ | Edit own review |
| DELETE | `/api/reviews/:id` | ✓ | Delete own review |

### Chefs

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/chefs` | | List chefs (sortable by name or popularity) |
| GET | `/api/chefs/:id` | | Chef profile + recipes |
| GET | `/api/chefs/:id/follow-status` | ✓ | Check follow state |
| POST | `/api/chefs/:id/follow` | ✓ | Follow chef |
| DELETE | `/api/chefs/:id/follow` | ✓ | Unfollow chef |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:id` | | Get user profile |
| PUT | `/api/users/:id` | ✓ | Update profile |
| POST | `/api/users/:id/photo` | ✓ | Upload profile photo |
| GET | `/api/users/:id/favorites` | ✓ | Own favourites |
| GET | `/api/users/:id/following` | ✓ | Own following list |

### Notifications

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✓ | List notifications |
| GET | `/api/notifications/unread-count` | ✓ | Unread count |
| PUT | `/api/notifications/:id/read` | ✓ | Mark one as read |
| PUT | `/api/notifications/read-all` | ✓ | Mark all as read |

### Admin

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/statistics` | admin | Platform stats |
| GET | `/api/admin/flagged` | admin | Flagged content (searchable) |
| GET | `/api/admin/content` | admin | Browse all content (searchable) |
| POST | `/api/admin/recipes/:id/flag` | admin | Flag recipe |
| POST | `/api/admin/reviews/:id/flag` | admin | Flag review |
| PUT | `/api/admin/content/:id/restore` | admin | Restore flagged content |
| GET | `/api/admin/moderation-logs` | admin | Audit log (searchable) |

### Chat (ChefBot)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/chat` | | Send message, streams SSE response from Ollama |

**Request body:**
```json
{
  "message": "What can I make with leftover chicken?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:** `text/event-stream` — each event is `data: {"token":"..."}`, terminated by `data: {"done":true}`.

---

## File Uploads

Files are saved to `backend/uploads/` and served at `/uploads/<filename>`. The frontend resolves them via `mediaUrl()` in `src/api.js`.

| Type | Route | Limit | Formats |
|---|---|---|---|
| Profile photo | `POST /api/users/:id/photo` | 5 MB | jpg, jpeg, png, gif, webp |
| Recipe image | `POST /api/recipes/:id/image` | 10 MB | jpg, jpeg, png, gif, webp |
