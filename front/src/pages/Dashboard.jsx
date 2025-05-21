import React from 'react'

// Components
import LatestReports from '../components/reports/LatestReports'
import LowestInventory from '../components/inventory/LowestInventory'
import LatestInvoices from '../components/invoices/LatestInvoices'
import ScrollToTopButton from '../components/buttons/ScrollToTopButton'
// Contexts
import { useAuth } from '../contexts/AuthContext'
// Styles
import '../styles/Dashboard.css'
// Utils
import { capitalizeFirstLetter } from '../utils/stringUtils'

const Dashboard = () => {
  const { authenticatedUser } = useAuth()

  return (
    <>
      <div className="dashboard-header">
        Dashboard - You are logged in as {capitalizeFirstLetter(authenticatedUser.username)}
      </div>
      <div className="dashboard">
        <section className="lowest-inventory">
          <LowestInventory />
        </section>
        <div className="divider top"></div>
        <section className="latest-invoices">
          <LatestInvoices />
        </section>
        <div className="divider bottom"></div>
        <section className="latest-reports">
          <LatestReports />
        </section>
      </div>
      {/* Floating ScrollToTopButton */}
      <ScrollToTopButton />
    </>
  )
}

export default Dashboard
