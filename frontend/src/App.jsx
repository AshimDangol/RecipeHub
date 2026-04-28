import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Recipes from './pages/Recipes.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'
import RecipeForm from './pages/RecipeForm.jsx'
import Chefs from './pages/Chefs.jsx'
import ChefDetail from './pages/ChefDetail.jsx'
import Profile from './pages/Profile.jsx'
import ProfileEdit from './pages/ProfileEdit.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Notifications from './pages/Notifications.jsx'
import Admin from './pages/Admin.jsx'
import Moderation from './pages/Moderation.jsx'
import NotFound from './pages/NotFound.jsx'

// Root component — defines all client-side routes under the shared Layout
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
          <Route path="chefs" element={<Chefs />} />
          <Route path="chefs/:id" element={<ChefDetail />} />

          {/* Authenticated routes */}
          <Route path="recipes/create" element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />
          <Route path="recipes/edit/:id" element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />
          <Route path="profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Admin-only routes */}
          <Route path="admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="admin/moderation" element={<ProtectedRoute adminOnly><Moderation /></ProtectedRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
