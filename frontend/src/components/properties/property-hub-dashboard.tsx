import { useState } from "react"
import { Card, CardHeader, CardBody, Divider, Button, Input, Select, SelectItem, Spinner, CheckboxGroup, Checkbox, Chip } from "@nextui-org/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"
import { RequireRole } from "../auth/require-role"
import { AddPropertyModal } from "./add-property-modal"
import { EditPropertyModal } from "./edit-property-modal"
import { useAuth } from "../../hooks/use-auth"
import { DivisionManagement } from "./division-management"

interface Property {
  id: string
  name: string
  code: string
  divisionId: string
}

interface PropertyListItem extends Property {
  division: { id: string; name: string }
  _count: { hubs: number }
}

interface Division {
  id: string
  name: string
  organizationId: string
}

interface Hub {
  id: string
  name: string
  divisionId: string
  properties: Property[]
}

export function PropertyHubDashboard() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null)
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)

  // --- Queries ---
  const { data: hubs, isLoading: loadingHubs } = useQuery<Hub[]>({
    queryKey: ["hubs"],
    queryFn: async () => {
      const res = await apiClient.get("/hubs")
      return res.data
    },
  })

  const { data: properties, isLoading: loadingProps } = useQuery<PropertyListItem[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await apiClient.get("/properties")
      return res.data
    },
  })

  const { data: divisions, isLoading: loadingDivisions } = useQuery<Division[]>({
    queryKey: ["divisions"],
    queryFn: async () => (await apiClient.get("/divisions")).data,
  })

  // --- Form State ---
  const [newHubName, setNewHubName] = useState("")
  const [newHubDivision, setNewHubDivision] = useState("")
  
  const [editingHubId, setEditingHubId] = useState<string | null>(null)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const availableDivisions = divisions ?? []
  const standaloneDivisions = user?.scopeLevel === "ORGANIZATION"
    ? availableDivisions.filter((division) => division.organizationId === user.organizationId)
    : user?.scopeLevel === "DIVISION"
      ? availableDivisions.filter((division) => division.id === user.activeScopeId)
      : []

  // --- Mutations ---
  const createHubMutation = useMutation({
    mutationFn: async (payload: { name: string; divisionId: string }) => {
      return await apiClient.post("/hubs", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hubs"] })
      setNewHubName("")
      setNewHubDivision("")
    }
  })

  const updateHubPropertiesMutation = useMutation({
    mutationFn: async ({ hubId, propertyIds }: { hubId: string, propertyIds: string[] }) => {
      return await apiClient.patch(`/hubs/${hubId}/properties`, { propertyIds })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hubs"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
      ])
      setEditingHubId(null)
    }
  })

  // --- Handlers ---
  function handleCreateHub() {
    if (!newHubName || !newHubDivision) return
    createHubMutation.mutate({ name: newHubName, divisionId: newHubDivision })
  }

  function handleOpenEdit(hub: Hub) {
    setEditingHubId(hub.id)
    setSelectedPropertyIds(hub.properties.map(p => p.id))
  }

  function handleSaveProperties() {
    if (!editingHubId) return
    updateHubPropertiesMutation.mutate({ 
      hubId: editingHubId, 
      propertyIds: selectedPropertyIds 
    })
  }

  if (loadingHubs || loadingProps || loadingDivisions) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Loading infrastructure..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {(user?.scopeLevel === "ORGANIZATION" || user?.scopeLevel === "DIVISION") && (
        <RequireRole allowedRoles={["ADMIN"]}>
          <DivisionManagement />
        </RequireRole>
      )}

      {/* Create New Hub & Property Section */}
      <RequireRole allowedRoles={["ADMIN"]}>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="px-6 pt-6 pb-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Infrastructure Management</h3>

        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <Input 
              label="Hub Name" 
              placeholder="e.g. Boutique Cluster" 
              variant="bordered"
              value={newHubName}
              onValueChange={setNewHubName}
              className="flex-1"
            />
            <Select 
              label="Division" 
              placeholder="Select parent division" 
              variant="bordered"
              selectedKeys={newHubDivision ? [newHubDivision] : []}
              onChange={(e) => setNewHubDivision(e.target.value)}
              className="flex-1"
            >
              {availableDivisions.map((div) => (
                <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
              ))}
            </Select>
            <Button 
              color="primary" 
              onPress={handleCreateHub}
              isLoading={createHubMutation.isPending}
              className="h-14 px-8"
              isDisabled={!newHubName || !newHubDivision}
            >
              Create Hub
            </Button>
          </div>
        </CardBody>
      </Card>
      </RequireRole>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Unassigned Properties</h3>
            <p className="text-sm text-gray-500">Properties not assigned to a Hub</p>
          </div>
          {standaloneDivisions.length > 0 && (
            <RequireRole allowedRoles={["ADMIN"]}>
              <Button
                color="primary"
                size="sm"
                onPress={() => {
                  setSelectedHub(null)
                  setIsAddPropertyModalOpen(true)
                }}
              >
                Create Property
              </Button>
            </RequireRole>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-4">
          {properties?.filter((property) => property._count.hubs === 0).length ? (
            <div className="flex flex-wrap gap-2">
              {properties.filter((property) => property._count.hubs === 0).map((property) => (
                <Chip key={property.id} variant="flat" color="primary" size="sm">
                  <RequireRole allowedRoles={["ADMIN"]}>
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      aria-label={`Edit ${property.name}`}
                      onClick={() => setEditingPropertyId(property.id)}
                    >
                      {property.name}
                    </button>
                  </RequireRole>
                  <span> ({property.code})</span>
                </Chip>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No unassigned properties.</span>
          )}
        </CardBody>
      </Card>

      {/* Hubs List & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hubs?.map((hub) => (
          <Card key={hub.id} className="shadow-sm border border-gray-200">
            <CardHeader className="flex justify-between items-center px-6 py-4 bg-gray-50/50">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{hub.name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">ID: {hub.id}</p>
              </div>
              <RequireRole allowedRoles={["ADMIN"]}>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      setSelectedHub(hub);
                      setIsAddPropertyModalOpen(true);
                    }}
                  >
                    +
                  </Button>
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(hub)}>
                    Manage Properties
                  </Button>
                </div>
              </RequireRole>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-4">
              
              {/* View Mode */}
              {editingHubId !== hub.id ? (
                <div className="flex flex-wrap gap-2">
                  {hub.properties.length > 0 ? (
                    hub.properties.map(p => (
                      <Chip key={p.id} variant="flat" color="primary" size="sm">
                        <RequireRole allowedRoles={["ADMIN"]}>
                          <button
                            type="button"
                            className="underline underline-offset-2"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => setEditingPropertyId(p.id)}
                          >
                            {p.name}
                          </button>
                        </RequireRole>
                        <span> ({p.code})</span>
                      </Chip>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">No properties assigned.</span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <CheckboxGroup
                    label="Assign properties to this hub:"
                    value={selectedPropertyIds}
                    onValueChange={setSelectedPropertyIds}
                  >
                    {/* Only show properties that belong to the same division as the hub */}
                    {properties?.filter(p => p.divisionId === hub.divisionId).map((property) => (
                      <Checkbox key={property.id} value={property.id}>
                        {property.name} <span className="text-gray-400 text-sm">({property.code})</span>
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                  <div className="flex gap-2 justify-end">
                    {updateHubPropertiesMutation.isError && (
                      <p className="self-center text-sm text-danger">
                        {updateHubPropertiesMutation.error.message || "Could not update Hub properties."}
                      </p>
                    )}
                    <Button size="sm" variant="light" onPress={() => setEditingHubId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      color="primary" 
                      onPress={handleSaveProperties}
                      isLoading={updateHubPropertiesMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
      
      {/* Add Property Modal */}
      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen}
        onOpenChange={(isOpen) => {
          setIsAddPropertyModalOpen(isOpen)
          if (!isOpen) setSelectedHub(null)
        }}
        hub={selectedHub ?? undefined}
        divisions={standaloneDivisions}
      />
      <EditPropertyModal
        propertyId={editingPropertyId}
        onClose={() => setEditingPropertyId(null)}
      />
    </div>
  )
}