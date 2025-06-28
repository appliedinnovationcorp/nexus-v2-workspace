import { create } from 'zustand'

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Mobile navigation
  isMobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
  toggleMobileNav: () => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  title?: string
  autoClose?: boolean
  duration?: number
}

export const useUIStore = create<UIState>((set) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  
  // Mobile navigation
  isMobileNavOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [
        ...state.notifications,
        { 
          id: crypto.randomUUID(),
          autoClose: true,
          duration: 5000,
          ...notification 
        }
      ] 
    })),
  removeNotification: (id) => 
    set((state) => ({ 
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ) 
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
