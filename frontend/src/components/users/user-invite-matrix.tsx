import { useState } from "react"
import { Card, CardHeader, CardBody, Checkbox, Divider, Button, Input, Select, SelectItem, Spinner } from "@nextui-org/react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"

interface Department {
  id: string
  name: string
}

interface Property {
  id: string
  name: string
  code: string
  departments: { department: Department }[]
}

export function UserInviteMatrix() {
  // Fetch real properties and their associated departments from the backend
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await apiClient.get("/properties")
      return response.data
    },
  })

  const roles = [
    { key: "ADMIN", label: "Admin" },
    { key: "EDITOR", label: "Editor" },
    { key: "OPERATOR", label: "Operator" },
    { key: "VIEWER", label: "Viewer" },
  ]

  const [formData, setFormData] = useState({
    email: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    role: "",
  })

  // State maps a property ID to an array of selected department IDs
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({})

  const inviteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post("/users/invite", payload)
      return response.data
    },
    onSuccess: () => {
      alert("User invited successfully!")
      setFormData({ email: "", employeeId: "", firstName: "", lastName: "", role: "" })
      setSelectedPermissions({})
    },
    onError: (error: any) => {
      alert(`Failed to invite user: ${error.response?.data?.message || error.message}`)
    },
  })

  function handleInputChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleDepartmentToggle(propertyId: string, departmentId: string, isSelected: boolean) {
    setSelectedPermissions((prev) => {
      const currentPropertyDepts = prev[propertyId] || []
      const updatedDepts = isSelected
        ? [...currentPropertyDepts, departmentId]
        : currentPropertyDepts.filter((id) => id !== departmentId)
      
      return { ...prev, [propertyId]: updatedDepts }
    })
  }

  function handleSelectAllDepartments(propertyId: string, allDepartmentIds: string[], isSelected: boolean) {
    setSelectedPermissions((prev) => ({
      ...prev,
      [propertyId]: isSelected ? allDepartmentIds : [],
    }))
  }

  function handleInvite() {
    // Flatten the selected department IDs from all properties into a single array
    const allSelectedDepartments = Array.from(
      new Set(Object.values(selectedPermissions).flat())
    )

    const payload = {
      ...formData,
      organizationId: "78f74918-f5e1-4c97-9d26-1b6c37f4a052", // Global Hotel Group ID
      scopeLevel: "ORGANIZATION",
      entityId: "78f74918-f5e1-4c97-9d26-1b6c37f4a052",
      departmentIds: allSelectedDepartments,
    }
    
    inviteMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Loading properties..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Invite New User</h3>
          <p className="text-sm text-gray-500 mt-1">Configure user details, role, and granular property permissions.</p>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Email Address" 
              placeholder="user@globalhotel.com" 
              variant="bordered"
              value={formData.email}
              onValueChange={(val) => handleInputChange("email", val)}
            />
            <Input 
              label="Employee ID" 
              placeholder="EID100XX" 
              variant="bordered"
              value={formData.employeeId}
              onValueChange={(val) => handleInputChange("employeeId", val)}
            />
            <Input 
              label="First Name" 
              placeholder="Jane" 
              variant="bordered"
              value={formData.firstName}
              onValueChange={(val) => handleInputChange("firstName", val)}
            />
            <Input 
              label="Last Name" 
              placeholder="Doe" 
              variant="bordered"
              value={formData.lastName}
              onValueChange={(val) => handleInputChange("lastName", val)}
            />
            <Select 
              label="Role" 
              placeholder="Select role" 
              variant="bordered" 
              className="md:col-span-2"
              selectedKeys={formData.role ? [formData.role] : []}
              onChange={(e) => handleInputChange("role", e.target.value)}
            >
              {roles.map((role) => (
                <SelectItem key={role.key} value={role.key}>
                  {role.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Property & Department Matrix</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {properties?.map((property) => {
                const propertyDeptIds = property.departments.map((d) => d.department.id)
                const selectedCount = selectedPermissions[property.id]?.length || 0
                const isAllSelected = selectedCount === property.departments.length && selectedCount > 0

                return (
                  <div key={property.id} className="p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          isSelected={isAllSelected}
                          onValueChange={(checked) => handleSelectAllDepartments(property.id, propertyDeptIds, checked)}
                        />
                        <span className="font-semibold text-gray-800">{property.name}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {property.code}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {selectedCount} / {property.departments.length} selected
                      </span>
                    </div>
                    <div className="pl-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.departments.map(({ department }) => (
                        <Checkbox
                          key={department.id}
                          size="sm"
                          isSelected={selectedPermissions[property.id]?.includes(department.id) || false}
                          onValueChange={(checked) => handleDepartmentToggle(property.id, department.id, checked)}
                        >
                          <span className="text-gray-700">{department.name}</span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              color="primary" 
              onPress={handleInvite} 
              className="px-8 font-medium"
              isLoading={inviteMutation.isPending}
            >
              Send Invitation
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}