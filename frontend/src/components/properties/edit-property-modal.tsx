import { useEffect, useState } from "react"
import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@nextui-org/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { apiClient } from "../../lib/api"

interface Department {
  id: string
  name: string
}

interface PropertyDetail {
  id: string
  name: string
  code: string
  departments: { department: Department }[]
}

interface EditPropertyModalProps {
  propertyId: string | null
  onClose: () => void
}

export function EditPropertyModal({ propertyId, onClose }: EditPropertyModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [departmentIds, setDepartmentIds] = useState<string[]>([])

  const propertyQuery = useQuery<PropertyDetail>({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const response = await apiClient.get(`/properties/${propertyId}`)
      return response.data
    },
    enabled: Boolean(propertyId),
  })

  const departmentsQuery = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiClient.get("/departments")
      return response.data
    },
    enabled: Boolean(propertyId),
  })

  useEffect(() => {
    if (!propertyQuery.data) return

    setName(propertyQuery.data.name)
    setCode(propertyQuery.data.code)
    setDepartmentIds(propertyQuery.data.departments.map(({ department }) => department.id))
  }, [propertyQuery.data])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) throw new Error("Select a property to edit.")
      return apiClient.patch(`/properties/${propertyId}`, { name: name.trim(), code, departmentIds })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["hubs"] }),
        queryClient.invalidateQueries({ queryKey: ["property", propertyId] }),
      ])
      onClose()
    },
  })

  const errorMessage = axios.isAxiosError(updateMutation.error)
    ? updateMutation.error.response?.data?.message
    : updateMutation.error?.message
  const errorText = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage

  return (
    <Modal isOpen={Boolean(propertyId)} onOpenChange={(isOpen) => !isOpen && onClose()} placement="center">
      <ModalContent>
        <ModalHeader>Edit Property</ModalHeader>
        <ModalBody>
          {propertyQuery.isLoading || departmentsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" label="Loading property..." />
            </div>
          ) : propertyQuery.isError || departmentsQuery.isError ? (
            <p className="text-sm text-danger">Could not load the property or its departments.</p>
          ) : (
            <>
              <Input
                label="Property name"
                value={name}
                onValueChange={setName}
                maxLength={100}
                isRequired
              />
              <Input
                label="Property code"
                value={code}
                onValueChange={(value) => setCode(value.toUpperCase())}
                maxLength={5}
                description="5 uppercase letters or numbers"
                isRequired
              />
              <CheckboxGroup
                label="Departments"
                value={departmentIds}
                onValueChange={setDepartmentIds}
              >
                {departmentsQuery.data?.map((department) => (
                  <Checkbox key={department.id} value={department.id}>
                    {department.name}
                  </Checkbox>
                ))}
              </CheckboxGroup>
              {errorText && <p className="text-sm text-danger">{errorText}</p>}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isLoading={updateMutation.isPending}
            isDisabled={!name.trim() || !/^[A-Z0-9]{5}$/.test(code) || propertyQuery.isLoading || departmentsQuery.isLoading}
            onPress={() => updateMutation.mutate()}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}