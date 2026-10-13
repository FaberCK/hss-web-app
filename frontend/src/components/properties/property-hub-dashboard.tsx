import { useState } from "react"
import { Card, CardHeader, CardBody, Divider, Button, Input, Select, SelectItem, Spinner, CheckboxGroup, Checkbox, Chip } from "@nextui-org/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"

interface Property {
  id: string
  name: string
  code: string
  divisionId: string
}

interface Hub {
  id: string
  name: string
  divisionId: string
  properties: Property[]
}

const DIVISIONS = [
  { id: "d2276a9c-a460-4cb8-b3f7-cbac65bb3194", name: "North America Region" },
  { id: "f99b7d7d-77f1-4d77-b5f8-aca3b8e27e11", name: "Europe Region" }
]

export function PropertyHubDashboard() {
  const queryClient = useQueryClient()

  // --- Queries ---
  const { data: hubs, isLoading: loadingHubs } = useQuery<Hub[]>({
    queryKey: ["hubs"],
    queryFn: async () => {
      const res = await apiClient.get("/hubs")
      return res.data
    },
  })

  const { data: properties, isLoading: loadingProps } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await apiClient.get("/properties")
      return res.data
    },
  })

  // --- Form State ---
  const [newHubName, setNewHubName] = useState("")
  const [newHubDivision, setNewHubDivision] = useState("")
  
  const [editingHubId, setEditingHubId] = useState<string | null>(null)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hubs"] })
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

  if (loadingHubs || loadingProps) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Loading infrastructure..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Create New Hub Section */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="px-6 pt-6 pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Create Custom Hub</h3>
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
              {DIVISIONS.map((div) => (
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

      {/* Hubs List & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hubs?.map((hub) => (
          <Card key={hub.id} className="shadow-sm border border-gray-200">
            <CardHeader className="flex justify-between items-center px-6 py-4 bg-gray-50/50">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{hub.name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">ID: {hub.id}</p>
              </div>
              <Button size="sm" variant="flat" onPress={() => handleOpenEdit(hub)}>
                Manage Properties
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-4">
              
              {/* View Mode */}
              {editingHubId !== hub.id ? (
                <div className="flex flex-wrap gap-2">
                  {hub.properties.length > 0 ? (
                    hub.properties.map(p => (
                      <Chip key={p.id} variant="flat" color="primary" size="sm">
                        {p.name} ({p.code})
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
    </div>
  )
}