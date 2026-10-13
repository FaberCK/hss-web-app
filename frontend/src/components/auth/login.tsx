import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardBody, Input, Button } from "@nextui-org/react"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [employeeId, setEmployeeId] = useState("")

  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; employeeId: string }) => {
      const response = await apiClient.post("/auth/login", payload)
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken)
      // Navigate to the main dashboard and refresh to initialize API interceptors
      navigate("/users")
      window.location.reload()
    },
    onError: (error: any) => {
      alert(`Login failed: ${error.response?.data?.message || error.message}`)
    },
  })

  function handleLogin() {
    if (!email || !employeeId) return
    loginMutation.mutate({ email, employeeId })
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader className="flex flex-col items-center pt-8 pb-4">
          <h1 className="text-2xl font-bold text-blue-600">HSS Web App</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
        </CardHeader>
        <CardBody className="px-8 py-6 space-y-6">
          <Input 
            label="Email Address" 
            placeholder="alice.johnson@globalhotel.com" 
            variant="bordered"
            value={email}
            onValueChange={setEmail}
          />
          <Input 
            label="Employee ID" 
            placeholder="EID10001" 
            variant="bordered"
            value={employeeId}
            onValueChange={setEmployeeId}
            type="password"
          />
          <Button 
            color="primary" 
            className="w-full font-medium mt-4" 
            size="lg"
            onPress={handleLogin}
            isLoading={loginMutation.isPending}
          >
            Sign In
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}