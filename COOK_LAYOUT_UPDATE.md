# Cook Dashboard Layout Update

## Changes Made

### 1. Created CookLayout Component
**File:** `Frontend/src/layouts/CookLayout.jsx`

Similar to ReceptionistLayout, this provides:
- Left sidebar navigation
- "Kitchen" title
- "Dashboard" navigation link (currently active)
- Logout button
- Main content area with `<Outlet />` for child routes

### 2. Updated App.jsx Routes
**File:** `Frontend/src/App.jsx`

**Before:**
```jsx
<Route element={<RequireRole role="cook" />}>
  <Route path="/cook" element={<CookDashboard />} />
</Route>
```

**After:**
```jsx
<Route element={<RequireRole role="cook" />}>
  <Route path="/cook" element={<CookLayout />}>
    <Route index element={<CookDashboard />} />
  </Route>
</Route>
```

### 3. Layout Structure

```
┌─────────────────────────────────────────┐
│  Kitchen                                │
│  ┌─────────────┐  ┌──────────────────┐ │
│  │ Sidebar     │  │ Main Content     │ │
│  │             │  │                  │ │
│  │ Dashboard ✓ │  │ Kitchen Orders   │ │
│  │             │  │ Dashboard        │ │
│  │             │  │                  │ │
│  │ [Logout]    │  │                  │ │
│  └─────────────┘  └──────────────────┘ │
└─────────────────────────────────────────┘
```

### 4. Features

#### Sidebar
- **Width:** 260px (via CSS variable `--sidebar-width`)
- **Background:** Dark slate (slate-900)
- **Title:** "Kitchen" (white, semibold, large)
- **Navigation:** Dashboard link (active state highlighted)
- **Logout:** Red button at bottom

#### Navigation States
- **Active Link:** White text on dark slate background (slate-800)
- **Inactive Link:** Light gray text (slate-300) with hover effect (slate-700)

#### Main Content Area
- **Background:** Light gray (slate-100)
- **Padding:** 1.5rem (24px)
- **Responsive:** Flexbox layout
- **Content:** Renders child routes via `<Outlet />`

### 5. Styling

Uses same styling as ReceptionistLayout:
```jsx
const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-700"
  }`
```

### 6. Navigation Flow

1. User logs in as cook
2. Redirected to `/cook`
3. CookLayout renders with sidebar
4. CookDashboard renders in main content area
5. "Dashboard" link is highlighted as active

### 7. Future Navigation Items

To add more pages (e.g., Completed Orders, Settings):

```jsx
<NavLink to="/cook" end className={linkClass}>
  Dashboard
</NavLink>
<NavLink to="/cook/completed" className={linkClass}>
  Completed Orders
</NavLink>
<NavLink to="/cook/settings" className={linkClass}>
  Settings
</NavLink>
```

Then add routes:
```jsx
<Route path="/cook" element={<CookLayout />}>
  <Route index element={<CookDashboard />} />
  <Route path="completed" element={<CompletedOrdersPage />} />
  <Route path="settings" element={<CookSettingsPage />} />
</Route>
```

### 8. Comparison

| Feature | ReceptionistLayout | CookLayout |
|---------|-------------------|------------|
| Title | "Reception" | "Kitchen" |
| Pages | 6 navigation items | 1 navigation item (Dashboard) |
| Sidebar Width | 260px | 260px |
| Style | Slate theme | Slate theme |
| Logout | ✅ | ✅ |

### 9. Benefits

- ✅ Consistent UI with receptionist dashboard
- ✅ Easy to navigate and understand
- ✅ Professional appearance
- ✅ Room for future navigation items
- ✅ Clear visual hierarchy
- ✅ Responsive design
- ✅ Active state indication

### 10. Testing

1. Login as cook
2. Should see:
   - Left sidebar with "Kitchen" title
   - "Dashboard" link (highlighted)
   - Kitchen orders dashboard in main area
   - Logout button at bottom
3. Click logout → redirects to login page
4. Click "Dashboard" → stays on same page (already active)

---

## Files Modified

1. ✅ Created `Frontend/src/layouts/CookLayout.jsx`
2. ✅ Modified `Frontend/src/App.jsx`

## Files Referenced

- `Frontend/src/index.css` (--sidebar-width variable)
- `Frontend/src/auth/AuthContext.jsx` (useAuth hook)
- `Frontend/src/layouts/ReceptionistLayout.jsx` (reference)

---

## Notes

- The layout is ready for future expansion with more navigation items
- Follows the same pattern as ReceptionistLayout for consistency
- Uses React Router's `<Outlet />` component for nested routing
- Maintains authentication via `RequireRole` wrapper
