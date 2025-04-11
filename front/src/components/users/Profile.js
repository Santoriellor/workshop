import React from 'react'
import { useAxios } from '../utils/useAxios'
import Swal from 'sweetalert2'

const Profile = () => {
  const axiosInstance = useAxios()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('profile/')
        setProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        setError('Failed to fetch profile. Please try again.')
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch profile. Please try again.',
        })
      }
    }

    fetchProfile()
  }, [])

  return (
    <div>
      {profile && (
        <div>
          <p>Full Name: {profile.full_name}</p>
          <p>Bio: {profile.bio}</p>
          <p>Verified: {profile.verified ? 'Yes' : 'No'}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default Profile
