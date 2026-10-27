// import { Routes, Route, Navigate } from "react-router-dom"
// import { UserInviteMatrix } from "./components/users/user-invite-matrix"
// import { PropertyHubDashboard } from "./c
// omponents/properties/property-hub-dashboard"

// function App() {
//   return (
//     <div className="w-full">
//       <Routes>
//         <Route path="/users" element={<UserInviteMatrix />} />
//         <Route path="/hubs" element={<PropertyHubDashboard />} />
//         {/* Redirect any unknown routes to the User Matrix by default */}
//         <Route path="*" element={<Navigate to="/users" replace />} />
//       </Routes>
//     </div>
//   )
// }

// export default App

import { Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/app-layout"
import { DashboardSummary } from "./components/dashboard/dashboard-summary"
import { UserInviteMatrix } from "./components/users/user-invite-matrix"
import { PropertyHubDashboard } from "./components/properties/property-hub-dashboard"
import { Login } from "./components/auth/login"
import { RequireRole } from "./components/auth/require-role"

function App() {
  const isAuthenticated = !!localStorage.getItem("accessToken")

  return (
    <div className="w-full h-full">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        
        {/* Authenticated Routes wrapped in AppLayout */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <AppLayout><DashboardSummary /></AppLayout> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/users" 
          element={isAuthenticated ? <AppLayout><RequireRole allowedRoles={["ADMIN"]} redirectTo="/dashboard"><UserInviteMatrix /></RequireRole></AppLayout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/hubs" 
          element={isAuthenticated ? <AppLayout><PropertyHubDashboard /></AppLayout> : <Navigate to="/login" replace />} 
        />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  )
}

export default App