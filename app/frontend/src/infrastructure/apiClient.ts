import axios from "axios"

export const AUTH_TOKEN_KEY = "veedoria_auth_token"

const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    const detailMsg = typeof detail === "object" && detail !== null ? detail.message : detail
    const message =
      detailMsg ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error de conexión"
    const enrichedError = new Error(message) as Error & { status?: number }
    enrichedError.status = error.response?.status
    return Promise.reject(enrichedError)
  },
)

export default apiClient