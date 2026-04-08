# RecipeNest

A full-stack recipe sharing platform. Users can publish recipes, follow chefs, leave reviews, like and favourite dishes, and receive notifications. Admins can moderate content via a dashboard.

---

## Project Structure

```
RecipeNest/
├── frontend/               # Plain HTML/CSS/JS SPA - no build step needed
│   ├── index.html
│   ├── serve.json          # SPA rewrite rules for npx serve
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js          # Entry point, route registration
│   │   ├── api.js          # fetch-based API client
│   │   ├── auth.js         # JWT state management
│   │   ├── router.js       # History API SPA router
│   │   ├── toast.js
│   │   ├── components/     # layout.js, recipe-card.js
│   │   └── pages/          # 13 page modules
│   └── public/
│
└── backend/                # Node.js, Express, MongoDB, Multer
    ├── .env.example
    ├── package.json
    └── src/
        ├── server.js
        ├── app.js
        ├── config/         # db.js (Mongoose)
        ├── models/         # User, Recipe, Review, Like, Favorite, Follow, Notification, ModerationLog
        ├── routes/         # auth, users, recipes, reviews, chefs, notifications, admin
        ├── middleware/     # auth.js, upload.js (Multer), errorHandler.js
        └── scripts/        # createAdmin.js, seed.js
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (ES modules, no framework) |
| Backend | Node.js, Express, MongoDB (Mongoose), Multer, JWT |

---

## Getting Started

### 1. Backend

Requires Node.js 18+ and MongoDB running locally.

```powershell
cd backend
cp .env.example .env   # fill in JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5200`.

**.env variables:**

| Variable | Default | Description |
|---|---|---|
| PORT | 5200 | Server port |
| MONGODB_URI | mongodb://localhost:27017/recipenest | MongoDB connection string |
| JWT_SECRET | — | Required — use a long random string |
| JWT_EXPIRES_IN | 7d | Token lifetime |
| UPLOAD_DIR | uploads | Directory for uploaded files |
| CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | Comma-separated allowed origins (any localhost port is allowed automatically) |

### 2. Frontend

No build step needed. Serve the `frontend/` folder with any static file server:

```powershell
npx serve frontend
```

The `serve.json` inside `frontend/` handles SPA routing so hard-refreshing on any page works correctly. Opens at `http://localhost:3000` by default.

The API base URL is derived automatically from `window.location.hostname`, so it works on both localhost and local network (e.g. `192.168.x.x`).

### 3. Seed Data (optional)

Create the first admin account:

```powershell
cd backend
node src/scripts/createAdmin.js
```

Seed sample chefs and recipes:

```powershell
node src/scripts/seed.js
```

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

> If login fails after seeding, restart the backend to reset the in-memory rate limiter.

---

## Features

- Register / login with JWT auth (password requires 8+ chars, upper, lower, number)
- Browse, search, and filter recipes by category and difficulty
- Create, edit, and delete your own recipes with ingredients and step-by-step instructions
- Upload recipe images and profile photos
- Like and favourite recipes
- Follow / unfollow chefs
- Leave, edit, and delete reviews with star ratings
- Notification bell for follows, reviews, and moderation actions
- Admin dashboard with platform statistics
- Admin moderation panel — browse all content, flag with reason, restore flagged content, audit log
- Flagged content owners receive notifications; admins and owners can still view flagged recipes

---

## Password Requirements

Passwords must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number. Example: `Password1`

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | | Register |
| POST | /api/auth/login | | Login, returns JWT |
| GET | /api/recipes | | List recipes (paginated, searchable, filterable) |
| GET | /api/recipes/search | | Full-text search |
| GET | /api/recipes/filter | | Filter by category / difficulty |
| GET | /api/recipes/:id | | Get recipe (flagged visible to owner + admin only) |
| POST | /api/recipes | yes | Create recipe |
| PUT | /api/recipes/:id | yes | Update recipe |
| DELETE | /api/recipes/:id | yes | Delete recipe |
| POST | /api/recipes/:id/image | yes | Upload recipe image |
| GET | /api/recipes/:id/status | yes | Get like/favorite state for current user |
| POST | /api/recipes/:id/like | yes | Like |
| DELETE | /api/recipes/:id/like | yes | Unlike |
| POST | /api/recipes/:id/favorite | yes | Favourite |
| DELETE | /api/recipes/:id/favorite | yes | Unfavourite |
| GET | /api/recipes/:id/reviews | | Get reviews |
| POST | /api/recipes/:id/reviews | yes | Submit review |
| PUT | /api/reviews/:id | yes | Edit own review |
| DELETE | /api/reviews/:id | yes | Delete own review |
| GET | /api/chefs | | List chefs |
| GET | /api/chefs/:id | | Chef profile + recipes |
| GET | /api/chefs/:id/follow-status | yes | Check if following |
| POST | /api/chefs/:id/follow | yes | Follow chef |
| DELETE | /api/chefs/:id/follow | yes | Unfollow chef |
| GET | /api/users/:id | | User profile |
| PUT | /api/users/:id | yes | Update profile |
| POST | /api/users/:id/photo | yes | Upload profile photo |
| GET | /api/users/:id/favorites | yes | Own favourites |
| GET | /api/users/:id/following | yes | Own following list |
| GET | /api/notifications | yes | Notifications |
| GET | /api/notifications/unread-count | yes | Unread count |
| PUT | /api/notifications/:id/read | yes | Mark read |
| PUT | /api/notifications/read-all | yes | Mark all read |
| GET | /api/admin/statistics | admin | Platform stats |
| GET | /api/admin/flagged | admin | List all flagged content |
| GET | /api/admin/content | admin | Browse all content for moderation |
| POST | /api/admin/recipes/:id/flag | admin | Flag recipe (notifies owner) |
| POST | /api/admin/reviews/:id/flag | admin | Flag review (notifies owner) |
| PUT | /api/admin/content/:id/restore | admin | Restore content (notifies owner) |
| GET | /api/admin/moderation-logs | admin | Audit log |

---

## File Uploads

Multer saves files to `uploads/`, served statically at `/uploads/<filename>`.

| Type | Route | Limit |
|---|---|---|
| Profile photo | POST /api/users/:id/photo | 5 MB |
| Recipe image | POST /api/recipes/:id/image | 10 MB |

Accepted formats: jpg, jpeg, png, gif, webp.
