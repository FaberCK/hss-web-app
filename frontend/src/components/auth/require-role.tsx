import type { ReactNode } from "react"
import { useAuth } from "../../hooks/use-auth"

interface RequireRoleProps {
  allowedRoles: string[]
  children: ReactNode
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { hasRole, isLoading } = useAuth()

  // Prevent UI flashing while the profile is fetching
  if (isLoading) return null 

  // Silently drop the component from the DOM if unauthorized
  if (!hasRole(allowedRoles)) return null

  return <>{children}</>
}