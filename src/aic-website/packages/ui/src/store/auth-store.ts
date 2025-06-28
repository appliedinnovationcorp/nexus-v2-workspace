import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  username: string
  fullName?: string
  role: string
  isActive: boolean
  isVerified: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  clearError: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Login failed')
          }
          
          const data = await response.json()
          
          // Get user info with the new token
          const userResponse = await fetch(`${API_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          })
          
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user information')
          }
          
          const userData = await userResponse.json()
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: {
              id: userData.id,
              email: userData.email,
              username: userData.username,
              fullName: userData.full_name,
              role: userData.role,
              isActive: userData.is_active,
              isVerified: userData.is_verified,
            },
            isLoading: false,
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false 
          })
        }
      },
      
      logout: async () => {
        set({ isLoading: true })
        
        try {
          const { accessToken } = get()
          
          if (accessToken) {
            await fetch(`${API_URL}/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear state regardless of API success
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          })
        }
      },
      
      refreshSession: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          return false
        }
        
        try {
          const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })
          
          if (!response.ok) {
            // If refresh fails, clear auth state
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
            })
            return false
          }
          
          const data = await response.json()
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          })
          
          return true
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          })
          return false
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      // Only persist these fields
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

// Helper hook for protected routes
export const useRequireAuth = () => {
  const { user, isLoading, refreshSession } = useAuthStore()
  
  // This would be used in a React component with useEffect
  const checkAuth = async () => {
    if (!user && !isLoading) {
      // Try to refresh the session if no user is found
      const refreshed = await refreshSession()
      return refreshed
    }
    return !!user
  }
  
  return { user, isLoading, checkAuth }
}
