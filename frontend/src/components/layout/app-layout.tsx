import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Button } from "@nextui-org/react"
import { ScopeSwitcher } from "./scope-switcher"
import { useAuth } from "../../hooks/use-auth"
import { RequireRole } from "../auth/require-role"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth()

  function handleLogout() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("activeScopeId")
    window.location.href = "/login"
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold mb-8 text-blue-600">HSS Web App</h1>
        <nav className="flex flex-col space-y-2">
          
          {/* 1. Restored Dashboard Link */}
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
            }
          >
            Analytics & Summary
          </NavLink>

          {/* 2. User Management dynamically restricted to ADMINs only */}
          <RequireRole allowedRoles={["ADMIN"]}>
            <NavLink 
              to="/users" 
              className={({ isActive }) => 
                `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
              }
            >
              User Management
            </NavLink>
          </RequireRole>

          <NavLink 
            to="/hubs" 
            className={({ isActive }) => 
              `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
            }
          >
            Properties & Hubs
          </NavLink>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-800">Admin Dashboard</h2>
            <ScopeSwitcher />
          </div>
          
          <div className="flex items-center space-x-4">
            {user && <span className="text-sm text-gray-600 font-medium">{user.email}</span>}
            <Button size="sm" color="danger" variant="flat" onPress={handleLogout}>
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}