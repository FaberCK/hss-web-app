import axios from "axios"

export const apiClient = axios.create({
  // Dynamically uses the build-time environment variable, defaults to local NestJS port
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
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

// Log out when the server rejects an expired or invalid token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login")

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("activeScopeId")

      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  },
)