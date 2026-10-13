import { Select, SelectItem, Spinner } from "@nextui-org/react"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { apiClient } from "../../lib/api"

interface ScopeItem {
  id: string
  name: string
  level: string
}

// Temporary map to resolve entity names until the backend joins entity tables to UserScopes
const ENTITY_NAMES: Record<string, string> = {
  "78f74918-f5e1-4c97-9d26-1b6c37f4a052": "Global Hotel Group",
  "d2276a9c-a460-4cb8-b3f7-cbac65bb3194": "North America Region",
  "a0521c1e-f4c0-43f7-9b4b-4e8c9b2a68c2": "Hilton Downtown",
  "f99b7d7d-77f1-4d77-b5f8-aca3b8e27e11": "Europe Region",
}

export function ScopeSwitcher() {
  const { data: scopes, isLoading } = useQuery<ScopeItem[]>({
    queryKey: ["user-scopes"],
    queryFn: async () => {
      const response = await apiClient.get("/users")
      // Extract Alice Johnson (Admin) for testing purposes
      const adminUser = response.data.find((u: any) => u.email === "alice.johnson@globalhotel.com")
      
      if (!adminUser) return []
      
      return adminUser.scopes.map((scope: any) => ({
        id: scope.entityId,
        name: ENTITY_NAMES[scope.entityId] || `${scope.scopeLevel} Level`,
        level: scope.scopeLevel,
      }))
    },
  })

  const [activeScope, setActiveScope] = useState<string>("")

  // Initialize active scope from localStorage or fallback to the first available scope
  useEffect(() => {
    const savedScope = localStorage.getItem("activeScopeId")
    if (savedScope && scopes?.some(s => s.id === savedScope)) {
      setActiveScope(savedScope)
    } else if (scopes && scopes.length > 0) {
      const defaultScope = scopes[0].id
      setActiveScope(defaultScope)
      localStorage.setItem("activeScopeId", defaultScope)
    }
  }, [scopes])

  function handleScopeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newScopeId = event.target.value
    if (newScopeId) {
      setActiveScope(newScopeId)
      localStorage.setItem("activeScopeId", newScopeId)
      // Hard reload to flush cached React Query data and refetch under the new scope context
      window.location.reload()
    }
  }

  if (isLoading) {
    return (
      <div className="h-10 flex items-center px-4">
        <Spinner size="sm" color="primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-xs">
      <Select
        label="Active Scope"
        placeholder="Select hierarchy level"
        selectedKeys={activeScope ? [activeScope] : []}
        onChange={handleScopeChange}
        size="sm"
        disallowEmptySelection
      >
        {scopes?.map((scope) => (
          <SelectItem key={scope.id} value={scope.id} description={scope.level}>
            {scope.name}
          </SelectItem>
        )) || []}
      </Select>
    </div>
  )
}