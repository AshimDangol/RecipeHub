# RecipeNest

A full-stack recipe sharing platform built with React and Node.js. Chefs can publish recipes, build a portfolio, and manage their profile. Food lovers can discover recipes, follow chefs, leave reviews, like and favourite dishes, and receive notifications. Admins can moderate content via a dedicated dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite 5 |
| Styling | Plain CSS (custom futuristic design system, dark mode, responsive) |
| Backend | Node.js, Express 4, MongoDB (Mongoose 8), Multer, JWT |
| Auth | JWT (bcryptjs, 7-day expiry, IP-based rate limiting) |

---

## Project Structure

```
RecipeNest/
├── frontend/
│   ├── index.html
│   ├── vite.config.js          # Vite + API proxy to :5200
│   ├── package.json
│   ├── css/
│   │   └── styles.css          # Global design system (dark-first, futuristic)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Route definitions
│       ├── api.js              # fetch-based API client + mediaUrl()
│       ├── toast.js            # Toast notification helper
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state (React Context + hooks)
│       ├── components/
│       │   ├── Layout.jsx      # Collapsible sidebar, search modal, bell
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
│           ├── Dashboard.jsx   # Chef dashboard
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
        │   └── db.js               # Mongoose connection
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
        │   └── admin.js
        ├── middleware/
        │   ├── auth.js             # JWT verify, requireAdmin
        │   ├── upload.js           # Multer config
        │   └── errorHandler.js
        └── scripts/
            ├── createAdmin.js
            └── seed.js             # 10 chefs, 50 recipes, follows, likes
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (default port 27017)

---

### 1. Backend

```bash
# from the backend/ folder
cp .env.example .env    # then fill in JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5200`.

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5200` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/recipenest` | MongoDB connection string |
| `JWT_SECRET` | — | Required — use a long random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded files |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed origins |

---

### 2. Frontend

```bash
# from the frontend/ folder
npm install
npm run dev
```

Opens at `http://localhost:3000`. Vite proxies `/api` and `/uploads` to the backend on port 5200 — no CORS config needed during development.

To build for production:

```bash
npm run build       # outputs to frontend/dist/
npm run preview     # preview the production build locally
```

---

### 3. Seed Data

**Step 1 — Create the admin account:**

```bash
# from the backend/ folder
node src/scripts/createAdmin.js
```

**Step 2 — Seed 10 chefs and 50 recipes:**

```bash
node src/scripts/seed.js
```

> If login fails immediately after seeding, restart the backend to reset the in-memory rate limiter.

The seed script is idempotent — running it again skips any records that already exist.

**Admin credentials:**

| Field | Value |
|---|---|
| Email | admin@recipenest.com |
| Password | Admin@1234 |

**Seeded chef credentials:**

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

**What the seed creates:**

| Data | Count |
|---|---|
| Chef users | 10 |
| Recipes (5 per chef) | 50 |
| Follow relationships | 30 |
| Likes | 22 |

Recipes span all 8 categories (Breakfast, Lunch, Dinner, Dessert, Snack, Soup, Salad, Drinks) and all 3 difficulty levels, each with real Unsplash food photos, 6–8 ingredients, and 4–5 step-by-step instructions.

---

## Features

### Navigation
- Collapsible sidebar with icon-only collapsed mode
- `Ctrl+K` / `Cmd+K` quick search modal — search pages and recipe categories
- Category quick-filter chips in the sidebar
- Live notification badge with unread count (polls every 30 seconds)
- Mobile drawer with hamburger toggle

### Chefs & Profiles
- Register and log in with JWT authentication
- Profile hero card with cover gradient, avatar, follower/recipe counts, bio, and links
- Upload and crop a profile photo (up to 5 MB)
- Follow / unfollow chefs
- Profile tabs: Recipes, Favourites, Following

### Recipes
- Browse with category filters, difficulty filters, full-text search, and pagination
- Create, edit, and delete your own recipes with dynamic ingredient and instruction lists
- Upload a recipe photo (up to 10 MB)
- Like and favourite recipes
- Share via X/Twitter, Facebook, WhatsApp, or copy link
- Star ratings and written reviews (edit and delete your own)

### Chef Dashboard
- Stats: recipe count, follower count, total likes, total reviews
- Manage all your recipes (edit or delete) from one place
- Saved favourites grid

### Notifications
- Sidebar notification link with live unread badge
- Notifications for new followers, recipe reviews, and moderation actions
- Mark individual or all notifications as read

### Admin
- Platform statistics with bar charts (users, recipes, reviews, active users)
- Content moderation — search and browse all recipes and reviews, flag with optional reason
- Flagged content hidden from public; owners notified automatically
- Restore flagged content
- Audit log with content title, author, reason, admin, and date — searchable

---

## Password Requirements

Passwords must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.  
Example: `Password1`

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
| GET | `/api/recipes` | | List recipes (paginated, searchable, filterable) |
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

---

## File Uploads

Uploaded files are saved to `backend/uploads/` and served statically at `/uploads/<filename>`. The frontend resolves these to full URLs via `mediaUrl()` in `src/api.js`.

| Type | Route | Size limit | Formats |
|---|---|---|---|
| Profile photo | `POST /api/users/:id/photo` | 5 MB | jpg, jpeg, png, gif, webp |
| Recipe image | `POST /api/recipes/:id/image` | 10 MB | jpg, jpeg, png, gif, webp |
