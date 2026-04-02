# RecipeNest

A full-stack recipe sharing platform. Users can publish recipes, follow chefs, leave reviews, like and favourite dishes, and receive notifications. Admins can moderate content via a dashboard.

---

## Project Structure

`
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
├── backend-node/       # Node.js, Express, MongoDB, Multer
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/     # db.js (Mongoose)
│       ├── models/     # User, Recipe, Review, Like, Favorite, Follow, Notification, ModerationLog
│       ├── routes/     # auth, users, recipes, reviews, chefs, notifications, admin
│       └── middleware/ # auth.js, upload.js (Multer), errorHandler.js
│
└── backend-csharp/     # ASP.NET Core 10, C#, SQLite, EF Core
    ├── RecipeNest.Api/
    └── RecipeNest.Api.Tests/
`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (ES modules, no framework) |
| Node backend | Node.js, Express, MongoDB (Mongoose), Multer, JWT |
| C# backend | ASP.NET Core 10, Entity Framework Core, SQLite, JWT |

---

## Getting Started

### Frontend

No build step. Serve the frontend/ folder with any static file server:

    python -m http.server 3000 --directory frontend
    npx serve frontend

The API base URL defaults to http://localhost:5200/api. Change it in frontend/js/api.js.

---

### Node.js Backend

Requires Node.js 18+ and MongoDB.

    cd backend-node
    cp .env.example .env
    npm install
    npm run dev

.env variables:

| Variable | Default | Description |
|---|---|---|
| PORT | 5200 | Port |
| MONGODB_URI | mongodb://localhost:27017/recipenest | MongoDB connection |
| JWT_SECRET | - | Required |
| JWT_EXPIRES_IN | 7d | Token lifetime |
| UPLOAD_DIR | uploads | Upload directory |
| CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | Allowed origins |

---

### C# Backend

Requires .NET 10 SDK.

    cd backend-csharp/RecipeNest.Api
    dotnet run

Swagger UI at /swagger in development. Run tests:

    cd backend-csharp
    dotnet test

---

## API Reference

Both backends expose identical routes:

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | | Register |
| POST | /api/auth/login | | Login, returns JWT |
| GET | /api/recipes | | List recipes (paginated, searchable) |
| GET | /api/recipes/:id | | Get recipe |
| POST | /api/recipes | yes | Create recipe |
| PUT | /api/recipes/:id | yes | Update recipe |
| DELETE | /api/recipes/:id | yes | Delete recipe |
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

## File Uploads (Node backend)

Multer saves files to uploads/, served at /uploads/<filename>.

| Type | Route | Limit |
|---|---|---|
| Profile photo | POST /api/users/:id/photo | 5 MB |
| Recipe image | (extend recipe routes) | 10 MB |

Accepted: jpg, jpeg, png, gif, webp.
