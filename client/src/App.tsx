import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from './pages/LoginPage'
import DashboardPage from "./pages/DashboardPage";
import GroupPage from "./pages/GroupPage";

function PrivateRoute( { children}: { children: React.ReactNode }){
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/" replace />
}

export default function App(){
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />}/>
      <Route path ="/dahsboar" element={<PrivateRoute> <DashboardPage/> </PrivateRoute>}/>
      <Route path="/group/:id" element={<PrivateRoute><GroupPage /></PrivateRoute>}/>
      </Routes>
      </BrowserRouter>
  )
}