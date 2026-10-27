import { Select, SelectItem, Spinner } from "@nextui-org/react"
import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/use-auth"

interface ScopeItem {
  id: string
  name: string
  level: string
}

function getScopeKey(scope: ScopeItem): string {
  return `${scope.level}:${scope.id}`
}

export function ScopeSwitcher() {
  const { user, isLoading } = useAuth()
  const assignedScopes = user?.assignedScopes ?? []
  const scopes: ScopeItem[] = assignedScopes.map((scope) => ({
    id: scope.entityId,
    name: scope.name || `${scope.scopeLevel} (${scope.entityId.slice(0, 8)})`,
    level: scope.scopeLevel,
  })) ?? []

  const [activeScopeKey, setActiveScopeKey] = useState<string>("")

  // Initialize active scope from localStorage or fallback to the first available scope
  useEffect(() => {
    if (isLoading) return

    const savedScopeId = localStorage.getItem("activeScopeId")
    const savedScopeLevel = localStorage.getItem("activeScopeLevel")
    const savedScope = scopes.find(
      (scope) => scope.id === savedScopeId && scope.level === savedScopeLevel,
    )

    if (savedScope) {
      setActiveScopeKey(getScopeKey(savedScope))
    } else if (scopes.length > 0) {
      const defaultScope = scopes[0]
      setActiveScopeKey(getScopeKey(defaultScope))
      localStorage.setItem("activeScopeId", defaultScope.id)
      localStorage.setItem("activeScopeLevel", defaultScope.level)
      if (savedScopeId !== defaultScope.id || savedScopeLevel !== defaultScope.level) {
        window.location.reload()
      }
    } else {
      localStorage.removeItem("activeScopeId")
      localStorage.removeItem("activeScopeLevel")
      setActiveScopeKey("")
    }
  }, [isLoading, user?.assignedScopes])

  function handleScopeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedScope = scopes.find((scope) => getScopeKey(scope) === event.target.value)
    if (selectedScope) {
      setActiveScopeKey(getScopeKey(selectedScope))
      localStorage.setItem("activeScopeId", selectedScope.id)
      localStorage.setItem("activeScopeLevel", selectedScope.level)
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
        selectedKeys={activeScopeKey ? [activeScopeKey] : []}
        onChange={handleScopeChange}
        size="sm"
        disallowEmptySelection
      >
        {scopes.map((scope) => (
          <SelectItem key={getScopeKey(scope)} value={getScopeKey(scope)} description={scope.level}>
            {scope.name}
          </SelectItem>
        )) || []}
      </Select>
    </div>
  )
}