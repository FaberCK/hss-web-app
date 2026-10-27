import { useEffect, useState } from "react"
import axios from "axios"
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Spinner } from "@nextui-org/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"
import { useAuth } from "../../hooks/use-auth"

interface Organization {
  id: string
  name: string
  shortName: string
}

interface Division {
  id: string
  name: string
  organizationId: string
  organization: Organization
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    return Array.isArray(message) ? message.join(", ") : message ?? error.message
  }
  return error instanceof Error ? error.message : "The request failed."
}

export function DivisionManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [newName, setNewName] = useState("")
  const [newOrganizationId, setNewOrganizationId] = useState("")
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const divisionsQuery = useQuery<Division[]>({
    queryKey: ["divisions"],
    queryFn: async () => (await apiClient.get("/divisions")).data,
  })

  const organizationsQuery = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => (await apiClient.get("/organizations")).data,
    enabled: Boolean(user?.roles.includes("ADMIN")),
  })

  const organizations = organizationsQuery.data ?? []

  useEffect(() => {
    if (!newOrganizationId && user?.organizationId) {
      setNewOrganizationId(user.organizationId)
    }
  }, [newOrganizationId, user?.organizationId])

  async function refreshDivisionData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["divisions"] }),
      queryClient.invalidateQueries({ queryKey: ["properties"] }),
      queryClient.invalidateQueries({ queryKey: ["hubs"] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: async () => apiClient.post("/divisions", {
      name: newName.trim(),
      organizationId: newOrganizationId,
    }),
    onSuccess: async () => {
      await refreshDivisionData()
      setNewName("")
      setErrorMessage("")
    },
    onError: (error) => setErrorMessage(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDivision) throw new Error("Select a division to edit.")
      return apiClient.patch(`/divisions/${editingDivision.id}`, {
        name: editingDivision.name.trim(),
        organizationId: editingDivision.organizationId,
      })
    },
    onSuccess: async () => {
      await refreshDivisionData()
      setEditingDivision(null)
      setErrorMessage("")
    },
    onError: (error) => setErrorMessage(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (divisionId: string) => apiClient.delete(`/divisions/${divisionId}`),
    onSuccess: async () => {
      await refreshDivisionData()
      setEditingDivision(null)
      setErrorMessage("")
    },
    onError: (error) => setErrorMessage(getErrorMessage(error)),
  })

  if (divisionsQuery.isLoading || organizationsQuery.isLoading) {
    return <div className="flex justify-center py-8"><Spinner size="sm" label="Loading divisions..." /></div>
  }

  if (divisionsQuery.isError || organizationsQuery.isError) {
    return <p className="text-sm text-danger">Could not load division or organization data.</p>
  }

  const canCreateDivision = user?.scopeLevel === "ORGANIZATION"

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-4">
        <h3 className="text-lg font-semibold text-gray-800">Division Management</h3>
        <p className="text-sm text-gray-500">Each division belongs to one organization.</p>
      </CardHeader>
      <CardBody className="px-6 pb-6 pt-2 space-y-4">
        {canCreateDivision && (
          <form
            className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setErrorMessage("")
              createMutation.mutate()
            }}
          >
            <Input
              label="Division name"
              value={newName}
              onValueChange={setNewName}
              maxLength={100}
              isRequired
            />
            <Select
              label="Organization"
              selectedKeys={newOrganizationId ? [newOrganizationId] : []}
              onChange={(event) => setNewOrganizationId(event.target.value)}
              isRequired
            >
              {organizations.map((organization) => (
                <SelectItem key={organization.id}>{organization.name}</SelectItem>
              ))}
            </Select>
            <Button
              type="submit"
              color="primary"
              isLoading={createMutation.isPending}
              isDisabled={!newName.trim() || !newOrganizationId}
            >
              Create Division
            </Button>
          </form>
        )}

        {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

        {divisionsQuery.data?.length ? (
          <div className="divide-y divide-gray-200">
            {divisionsQuery.data.map((division) => (
              <div key={division.id} className="grid grid-cols-1 items-center gap-3 py-3 md:grid-cols-[1fr_1fr_auto]">
                {editingDivision?.id === division.id ? (
                  <>
                    <Input
                      aria-label="Division name"
                      value={editingDivision.name}
                      onValueChange={(name) => setEditingDivision({ ...editingDivision, name })}
                      maxLength={100}
                    />
                    <Select
                      aria-label="Organization"
                      selectedKeys={[editingDivision.organizationId]}
                      onChange={(event) => setEditingDivision({ ...editingDivision, organizationId: event.target.value })}
                    >
                      {organizations.map((organization) => (
                        <SelectItem key={organization.id}>{organization.name}</SelectItem>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        isLoading={updateMutation.isPending}
                        isDisabled={!editingDivision.name.trim()}
                        onPress={() => {
                          setErrorMessage("")
                          updateMutation.mutate()
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="light" onPress={() => setEditingDivision(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-gray-800">{division.name}</p>
                      <p className="text-xs text-gray-500">{division.organization.name}</p>
                    </div>
                    <span className="text-sm text-gray-600">{division.organization.shortName}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" onPress={() => setEditingDivision(division)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isLoading={deleteMutation.isPending}
                        onPress={() => {
                          if (window.confirm(`Delete division “${division.name}”?`)) {
                            setErrorMessage("")
                            deleteMutation.mutate(division.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No divisions in this scope yet.</p>
        )}
      </CardBody>
    </Card>
  )
}