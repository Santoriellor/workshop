export const getVehicleInfoByVehicleId = (id, vehicles = []) => {
  const vehicle = vehicles.find((v) => v.id === id)
  return vehicle ? vehicle.__str__ : 'Unknown'
}
