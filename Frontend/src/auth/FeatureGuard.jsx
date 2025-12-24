import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

/**
 * Component to guard routes based on feature access
 * @param {string} feature - The feature name to check
 * @param {JSX.Element} children - The component to render if access is granted
 * @param {string} redirectTo - Optional redirect path if access is denied
 */
export default function FeatureGuard({ feature, children, redirectTo = null }) {
  const { user } = useAuth()
  const features = user?.features || {}

  // If feature is not enabled, show access denied or redirect
  if (!features[feature]) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this feature. Please contact your administrator.
        </p>
      </div>
    )
  }

  return children
}
