import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { ScopeSwitcher } from "./scope-switcher"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold mb-8 text-blue-600">HSS Web App</h1>
        <nav className="flex flex-col space-y-2">
          <NavLink 
            to="/users" 
            className={({ isActive }) => 
              `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
            }
          >
            User Management
          </NavLink>
          <NavLink 
            to="/hubs" 
            className={({ isActive }) => 
              `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
            }
          >
            Properties & Hubs
          </NavLink>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `p-2 rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100'}`
            }
          >
            Analytics & Summary
          </NavLink>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Admin Dashboard</h2>
          <ScopeSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}