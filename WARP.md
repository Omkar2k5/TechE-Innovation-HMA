# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Frontend Development (React + Vite)
The main application is a React frontend located in the `Frontend/` directory.

```powershell
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Opens on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
The project includes Playwright for E2E testing:

```powershell
# Run tests (from Frontend directory)
npx playwright test
```

## High-Level Architecture

### Project Structure
- `Frontend/` - React application with Vite build system
- `DATABASE/` - JSON mock data files for hotel operations
- Root level contains project documentation and requirements

### Frontend Architecture

**Tech Stack:**
- React 18 with JSX
- Vite for build tooling and dev server
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

**Authentication & Authorization:**
- Role-based authentication system (`AuthContext.jsx`)
- Three user roles: `receptionist`, `cook`, `admin`
- Protected routes using `RequireRole` component
- Mock authentication with localStorage persistence

**Key Application Flow:**
1. Users login with hotel ID, email, password, and role selection
2. Role-based routing directs users to appropriate dashboards
3. Each role has distinct UI layouts and accessible features

**Main Components Structure:**
```
src/
├── auth/AuthContext.jsx          # Authentication provider
├── layouts/ReceptionistLayout.jsx # Main layout with sidebar
├── pages/
│   ├── auth/                     # Login, password reset
│   ├── receptionist/             # Reception dashboard, reservations, tables, billing
│   ├── cook/                     # Kitchen operations
│   └── admin/                    # Administrative functions
├── lib/api.js                    # API communication utilities
└── simple-menu/                  # Standalone menu management module
```

### Data Layer

**Database Structure:**
The `DATABASE/` directory contains MongoDB-exported JSON files representing the data schema:
- `HMS.hotel.json` - Hotel configuration and settings
- `HMS.staff.json` - Employee records and roles
- `HMS.reservation.json` - Room bookings and guest data
- `HMS.table.json` - Restaurant table management
- `HMS.menu.json` - Menu items with pricing and dietary info
- `HMS.order.json` - Customer orders and order tracking
- `HMS.payment.json` - Payment processing and billing

**API Integration:**
- Frontend uses `lib/api.js` for HTTP requests
- API base URL configurable via `VITE_API_BASE` environment variable
- Default API endpoint: `http://localhost:4000/api`

### Key Features

**Table Management System:**
- Real-time table status tracking (Vacant, Reserved, Occupied, Billing)
- Guest information management with group size tracking
- Visual table grid with color-coded status indicators
- Status flow automation with click-to-advance functionality

**Menu Management:**
- Standalone menu application at `/menu` route (no auth required)
- Ingredient suggestion system with autocomplete
- Menu item creation with dietary information tracking
- Dynamic ingredient management across menu items

**State Management:**
- Uses React's built-in state management (useState, useContext)
- Local state for UI interactions and temporary data
- AuthContext for global authentication state
- No external state management library (Redux, Zustand, etc.)

## Development Notes

### Styling Approach
- Tailwind CSS with custom component patterns
- Responsive design with mobile-first approach
- Color-coded status systems for visual clarity
- Consistent spacing and typography scale

### Code Patterns
- Functional components with hooks throughout
- Props destructuring and composition patterns
- Error boundaries for graceful error handling
- Modular component architecture with clear separation of concerns

### Environment Configuration
- Uses Vite's environment variable system
- TypeScript support with path aliases (`@/*` maps to `src/*`)
- ESLint configuration for code quality
- PostCSS with Autoprefixer for CSS processing