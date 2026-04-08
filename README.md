# RecipeNest

A full-stack recipe sharing platform. Users can publish recipes, follow chefs, leave reviews, like and favourite dishes, and receive notifications. Admins can moderate content via a dashboard.

---

## Project Structure

```
RecipeNest/
├── frontend/           # Plain HTML/CSS/JS SPA - no build step needed
│   ├── index.html
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js      # Entry point, route registration
│   │   ├── api.js      # fetch-based API client
│   │   ├── auth.js     # JWT state
│   │   ├── router.js   # History API SPA router
│   │   ├── toast.js
│   │   ├── components/ # layout.js, recipe-card.js
│   │   └── pages/      # 13 page modules
│   └── public/
│
└── backend/            # Node.js, Express, MongoDB, Multer
    ├── .env.example
    ├── package.json
    └── src/
        ├── server.js
        ├── app.js
        ├── config/     # db.js (Mongoose)
        ├── models/     # User, Recipe, Review, Like, Favorite, Follow, Notification, ModerationLog
        ├── routes/     # auth, users, recipes, reviews, chefs, notifications, admin
        ├── middleware/ # auth.js, upload.js (Multer), errorHandler.js
        └── scripts/    # createAdmin.js
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
cp .env.example .env   # then fill in JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5200`.

**.env variables:**

| Variable | Default | Description |
|---|---|---|
| PORT | 5200 | Server port |
| MONGODB_URI | mongodb://localhost:27017/recipenest | MongoDB connection string |
| JWT_SECRET | - | Required — use a long random string |
| JWT_EXPIRES_IN | 7d | Token lifetime |
| UPLOAD_DIR | uploads | Directory for uploaded files |
| CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | Comma-separated allowed origins |

### 2. Frontend

No build step needed. Serve the `frontend/` folder with any static file server:

```powershell
npx serve frontend
```

Opens at `http://localhost:3000`. The API base URL defaults to `http://localhost:5200/api` — change it in `frontend/js/api.js` if needed.

### 3. Create Admin User

After the backend is running, seed the first admin account:

```powershell
cd backend
node src/scripts/createAdmin.js
```

Default admin credentials:

| Field | Value |
|---|---|
| Email | admin@recipenest.com |
| Password | Admin@1234 |

> If login fails after running the script, restart the backend to reset the in-memory rate limiter.

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | | Register |
| POST | /api/auth/login | | Login, returns JWT |
| GET | /api/recipes | | List recipes (paginated, filterable) |
| GET | /api/recipes/search | | Search recipes |
| GET | /api/recipes/filter | | Filter by category / difficulty |
| GET | /api/recipes/:id | | Get recipe |
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
| DELETE | /api/reviews/:id | yes | Delete review |
| GET | /api/chefs | | List chefs |
| GET | /api/chefs/:id | | Chef profile + recipes |
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
| POST | /api/admin/recipes/:id/flag | admin | Flag recipe |
| POST | /api/admin/reviews/:id/flag | admin | Flag review |
| PUT | /api/admin/content/:id/restore | admin | Restore content |
| GET | /api/admin/moderation-logs | admin | Moderation history |

---

## File Uploads

Multer saves files to `uploads/`, served statically at `/uploads/<filename>`.

| Type | Route | Limit |
|---|---|---|
| Profile photo | POST /api/users/:id/photo | 5 MB |
| Recipe image | POST /api/recipes/:id/image | 10 MB |

Accepted formats: jpg, jpeg, png, gif, webp.
