# Feature-Based Access Control System

## Overview
This system implements granular feature-level access control for different user roles (Owner, Receptionist, Cook, Manager). Each role has a `features` object in the database that determines which pages and functionality they can access.

## Database Schema

### Hotel Collection Structure
Each role in the `roles` array has a `features` object:

```json
{
  "_id": "HOTEL_ID",
  "roles": [
    {
      "roleId": "OWN001",
      "role": "owner",
      "owner_Email": "owner@example.com",
      "owner_Password": "password",
      "features": {
        "dashboard": true,
        "inventory": true,
        "liveCCTV": true,
        "staffManagement": true,
        "performanceAnalysis": false,
        "businessEvaluation": false
      }
    },
    {
      "roleId": "REC001",
      "role": "receptionalist",
      "Receptionalist_Email": "receptionist@example.com",
      "Receptionalist_Password": "password",
      "features": {
        "dashboard": true,
        "reservations": true,
        "ordersBilling": true,
        "reports": true,
        "addEmployee": false,
        "menuManagement": false
      }
    },
    {
      "roleId": "COOK001",
      "role": "cook",
      "Cook_Email": "cook@example.com",
      "Cook_Password": "password",
      "features": {
        "dashboard": true
      }
    }
  ]
}
```

## Feature Mappings

### Owner Features
- `dashboard` → Dashboard page
- `inventory` → Inventory management
- `liveCCTV` → Live CCTV monitoring
- `staffManagement` → Staff/Employee management
- `performanceAnalysis` → Performance analysis reports
- `businessEvaluation` → Business evaluation tools

### Receptionist Features
- `dashboard` → Dashboard page
- `reservations` → Reservations management
- `ordersBilling` → Orders & Billing
- `reports` → Reports page
- `addEmployee` → Add Employee functionality
- `menuManagement` → Menu management

### Cook Features
- `dashboard` → Dashboard page

## Implementation Details

### Backend (auth.js)
1. **Login Response**: The login endpoint returns the user's features in the response:
   ```javascript
   {
     success: true,
     token: "jwt_token",
     user: {
       role: "owner",
       email: "owner@example.com",
       features: { dashboard: true, inventory: true, ... }
     }
   }
   ```

2. **Field Names**: The backend uses underscore notation for field names:
   - `owner_Email`, `owner_Password`
   - `Receptionalist_Email`, `Receptionalist_Password`
   - `Cook_Email`, `Cook_Password`
   - `Manager_Email`, `Manager_Password`

### Frontend

#### 1. AuthContext (src/auth/AuthContext.jsx)
- Stores user features from login response
- Persists features in localStorage
- Provides features to all components via context

#### 2. Navigation Filtering
Each dashboard/layout filters menu items based on features:

**Owner Dashboard** (`src/pages/admin/Dashboard.jsx`):
```javascript
const items = allItems.filter(item => features[item.feature] === true)
```

**Receptionist Layout** (`src/layouts/ReceptionistLayout.jsx`):
```javascript
{features.dashboard !== false && <NavLink>Dashboard</NavLink>}
{features.reservations && <NavLink>Reservations</NavLink>}
```

**Cook Layout** (`src/layouts/CookLayout.jsx`):
```javascript
{features.dashboard !== false && <NavLink>Dashboard</NavLink>}
```

#### 3. Route Protection (FeatureGuard)
The `FeatureGuard` component protects individual routes:

**Location**: `src/auth/FeatureGuard.jsx`

**Usage in App.jsx**:
```javascript
<Route path="billing" element={
  <FeatureGuard feature="ordersBilling">
    <BillingPage />
  </FeatureGuard>
} />
```

If user tries to access a restricted feature:
- Shows "Access Denied" message
- OR redirects to another page (if `redirectTo` prop is provided)

#### 4. Content Protection
Dashboard components check features before rendering:

```javascript
{activeSection === "dashboard" && features.dashboard && <DashboardOverview />}
{activeSection === "inventory" && features.inventory && <InventoryDashboard />}
```

## How to Use

### For Administrators
To enable/disable features for a user, update the database:

```javascript
// Enable performance analysis for owner
db.hotels.updateOne(
  { "_id": "HOTEL_ID", "roles.role": "owner" },
  { "$set": { "roles.$.features.performanceAnalysis": true } }
)
```

### For Developers
To add a new feature:

1. **Add to database schema**: Add the feature key to the role's `features` object
2. **Add navigation item**: Add to the dashboard/layout with feature check
3. **Create route**: Wrap route component with `FeatureGuard`
4. **Add page content**: Implement the feature page

Example:
```javascript
// In Owner Dashboard
{ id: "new-feature", label: "New Feature", feature: "newFeature" }

// In App.jsx
<Route path="new-feature" element={
  <FeatureGuard feature="newFeature">
    <NewFeaturePage />
  </FeatureGuard>
} />
```

## Security Notes

1. **Double Protection**: Features are checked both:
   - At navigation level (hiding menu items)
   - At route level (FeatureGuard component)

2. **Default Behavior**:
   - If `features` object is missing → all features disabled
   - If specific feature is undefined → treated as false (disabled)
   - Exception: `dashboard` uses `!== false` check to allow by default

3. **Access Denied**: Users attempting to directly access restricted URLs will see an "Access Denied" page

## Testing

To test feature restrictions:

1. Set feature to `false` in database
2. Login as that user
3. Verify:
   - Menu item is hidden in navigation
   - Direct URL access shows "Access Denied"
   - No console errors

## Future Enhancements

- [ ] Add feature permissions to JWT token for backend validation
- [ ] Create admin UI for managing user features
- [ ] Add feature-level audit logging
- [ ] Implement feature groups/templates
