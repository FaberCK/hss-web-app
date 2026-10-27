import { useEffect, useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"
import { useAuth } from "../../hooks/use-auth"

interface AddPropertyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  hub?: {
    id: string;
    divisionId: string;
    name: string;
  };
  divisions: { id: string; name: string }[];
}

export function AddPropertyModal({ isOpen, onOpenChange, hub, divisions }: AddPropertyModalProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    code: ""
  })
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [divisionId, setDivisionId] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setDivisionId(hub?.divisionId ?? divisions[0]?.id ?? "")
  }, [divisions, hub?.divisionId, isOpen])


  const handleInputChange = (field: 'name' | 'code', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async () => {
    // Basic validation
    const newErrors: { name?: string; code?: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Property name is required"
    }
    
    if (!formData.code.trim()) {
      newErrors.code = "Property code is required"
    } else if (!/^[A-Z0-9]{5}$/.test(formData.code)) {
      newErrors.code = "Code must be 5 uppercase letters or numbers"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true);
    try {
      await apiClient.post("/properties", {
        name: formData.name,
        code: formData.code,
        divisionId: hub?.divisionId ?? divisionId,
        organizationId: user?.organizationId || "",
        ...(hub ? { hubId: hub.id } : {}),
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
      
      // Reset form and close modal
      setFormData({ name: "", code: "" });
      setErrors({});
      onOpenChange(false);
      
    } catch (error: any) {
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes("code") && message.includes("already exists")) {
          setErrors({ code: "This code already exists in the selected division" });
        } else {
          setErrors({ name: message });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {hub ? `Add Property to ${hub.name}` : "Create Unassigned Property"}
            </ModalHeader>
            <ModalBody>
              {!hub && (
                <Select
                  label="Division"
                  placeholder="Select division"
                  variant="bordered"
                  selectedKeys={divisionId ? [divisionId] : []}
                  onChange={(event) => setDivisionId(event.target.value)}
                >
                  {divisions.map((division) => (
                    <SelectItem key={division.id}>{division.name}</SelectItem>
                  ))}
                </Select>
              )}
              <Input
                label="Property Name"
                placeholder="Enter property name"
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                variant="bordered"
              />
              
              <Input
                label="Property Code"
                placeholder="Enter 5-character code (e.g., HLD01)"
                value={formData.code}
                onValueChange={(value) => handleInputChange("code", value.toUpperCase())}
                isInvalid={!!errors.code}
                errorMessage={errors.code}
                variant="bordered"
                maxLength={5}
                description="Must be 5 uppercase letters or numbers"
              />
              

            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={!formData.name || !formData.code || !user?.organizationId || !(hub?.divisionId ?? divisionId)}
              >
                Create Property
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
