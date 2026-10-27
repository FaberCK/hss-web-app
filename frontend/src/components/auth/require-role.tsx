import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/use-auth"

interface RequireRoleProps {
  allowedRoles: string[]
  children: ReactNode
  redirectTo?: string
}

export function RequireRole({ allowedRoles, children, redirectTo }: RequireRoleProps) {
  const { hasRole, isLoading } = useAuth()

  // Prevent UI flashing while the profile is fetching
  if (isLoading) return null 

  // Silently drop the component from the DOM if unauthorized
  if (!hasRole(allowedRoles)) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : null
  }

  return <>{children}</>
}