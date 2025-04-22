export const getOwnerNameByVehicleId = (vehicleId, vehicles = [], owners = []) => {
  const vehicle = vehicles.find((v) => v.id === vehicleId)
  if (!vehicle) return 'Unknown'

  const owner = owners.find((o) => o.id === vehicle.owner)
  return owner ? owner.full_name : 'Unknown'
}
