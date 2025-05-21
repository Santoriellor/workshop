import React, { Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
// Components
import Sidebar from './components/Sidebar'
import Login from './components/authentication/Login'
import Register from './components/authentication/Register'
import PrivateRoute from './components/authentication/PrivateRoute'
import DeleteModal from './components/DeleteModal'
import LoadingScreen from './components/LoadingScreen'
// Pages
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Owner from './pages/Owner'
import Vehicle from './pages/Vehicle'
import Invoices from './pages/Invoices'
import Inventory from './pages/Inventory'
import TaskTemplate from './pages/TaskTemplate'
// Zustand fetchers
import VehicleFetcher from './components/fetchers/VehicleFetcher'
import OwnerFetcher from './components/fetchers/OwnerFetcher'
import InventoryFetcher from './components/fetchers/InventoryFetcher'
import TaskTemplateFetcher from './components/fetchers/TaskTemplateFetcher'
import InvoiceFetcher from './components/fetchers/InvoiceFetcher'
import ReportFetcher from './components/fetchers/ReportFetcher'
import UserFetcher from './components/fetchers/UserFetcher'
// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GlobalProvider, useGlobalContext } from './contexts/GlobalContext'
// Styles
import './App.css'
import './styles/Buttons.css'

const App = () => {
  return (
    <AuthProvider>
      <GlobalProvider>
        <Main />
      </GlobalProvider>
    </AuthProvider>
  )
}

const Main = () => {
  const { authenticatedUser, loadingAuth } = useAuth()
  const { modalState } = useGlobalContext()
  const ModalComponent = modalState.modalComponent

  if (loadingAuth) return <LoadingScreen fullscreen />

  return (
    <>
      {authenticatedUser ? (
        <>
          <UserFetcher />
          <ReportFetcher />
          <InvoiceFetcher />
          <VehicleFetcher />
          <OwnerFetcher />
          <InventoryFetcher />
          <TaskTemplateFetcher />
          <div className="container">
            {/* <div className="left-menu"> */}
            <Sidebar />
            {/* </div> */}
            <div className="main">
              <div className="content">
                <Routes>
                  {/* Private Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/report" element={<Report />} />
                    <Route path="/owner" element={<Owner />} />
                    <Route path="/vehicle" element={<Vehicle />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/tasktemplate" element={<TaskTemplate />} />
                  </Route>

                  {/* Redirect to dashboard by default */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          </div>
          {modalState.isModalReady && modalState.showModal && ModalComponent && (
            <Suspense fallback={<LoadingScreen fullscreen />}>
              <ModalComponent />
            </Suspense>
          )}

          {modalState.showDeleteModal && <DeleteModal />}
        </>
      ) : (
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  )
}

export default App
