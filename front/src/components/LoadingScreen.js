import React from 'react'
import '../styles/LoadingScreen.css'
import logo from '../assets/logo-garage-opti.svg'

const LoadingScreen = ({ fullscreen = true, small = false }) => {
  return (
    <div className={`loading-container ${fullscreen ? 'fullscreen' : small ? 'small' : 'inline'}`}>
      {fullscreen && <img className="loading-logo" src={logo} alt="logo" />}
      <div className="spinner"></div>
      <p className="loading-text">Loading, please wait...</p>
    </div>
  )
}

export default LoadingScreen
