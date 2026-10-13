import axios from "axios"

export const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercept requests to attach auth and scope headers dynamically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") // We will store this upon login
  const activeScopeId = localStorage.getItem("activeScopeId")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (activeScopeId) {
    config.headers["x-hss-scope-id"] = activeScopeId
  }

  return config
})