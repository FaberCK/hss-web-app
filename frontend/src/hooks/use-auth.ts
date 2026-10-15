import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../lib/api"

export interface UserProfile {
  userId: string
  email: string
  organizationId: string
  activeScopeId?: string
  roles: string[]
  allowedDepartments: string[]
  scopeLevel?: string
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiClient.get("/auth/me")
      return res.data
    },
    retry: false, // Prevents infinite retries if the user is genuinely unauthorized (401)
  })

  // Helper to check if the user has at least one of the required roles
  function hasRole(allowedRoles: string[]): boolean {
    if (!user?.roles) return false
    return allowedRoles.some((role) => user.roles.includes(role))
  }

  // Helper to check department access
  function hasDepartmentAccess(departmentId: string): boolean {
    if (!user) return false
    if (user.roles.includes("ADMIN")) return true
    return user.allowedDepartments.includes(departmentId)
  }

  return { user, isLoading, error, hasRole, hasDepartmentAccess }
}