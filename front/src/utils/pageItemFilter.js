export const filterItems = (
  item,
  filters,
  vehicles,
  getVehicleInfoByVehicleId
) => {
  if (!item) return false;

  // Handle different entity types
  if (filters.type === "report") {
    // Find the vehicle associated with this report
    const vehicle = vehicles.find((v) => v.id === item.vehicle);
    // Get the owner ID from the vehicle (if it exists)
    const ownerId = vehicle ? vehicle.owner : null;
    const vehicleInfo = getVehicleInfoByVehicleId(item.vehicle) || "";

    return (
      (filters.vehicle === "" ||
        vehicleInfo.toLowerCase().includes(filters.vehicle.toLowerCase())) &&
      (filters.user === "" || item.user?.toString() === filters.user) &&
      (filters.created_at === "" ||
        item.formatted_created_at.includes(filters.created_at)) &&
      (filters.owner === "" || ownerId?.toString() === filters.owner) &&
      (filters.status === "" || item.status === filters.status)
    );
  }

  if (filters.type === "owner") {
    return (
      (filters.name === "" ||
        item.full_name.toLowerCase().includes(filters.name)) &&
      (filters.email === "" || item.email.toLowerCase().includes(filters.email))
    );
  }

  if (filters.type === "vehicle") {
    return (
      (filters.brand === "" ||
        item.brand.toLowerCase().includes(filters.brand.toLowerCase())) &&
      (filters.model === "" ||
        item.model.toLowerCase().includes(filters.model.toLowerCase())) &&
      (filters.year === "" || item.year.toString().includes(filters.year)) &&
      (filters.license_plate === "" ||
        item.license_plate
          .toLowerCase()
          .includes(filters.license_plate.toLowerCase())) &&
      (filters.vehicle_owner === "" ||
        (item.owner &&
          item.owner.toString().includes(filters.vehicle_owner.toString())))
    );
  }

  if (filters.type === "inventory") {
    return (
      (filters.part_name === "" ||
        item.name.toLowerCase().includes(filters.part_name.toLowerCase())) &&
      (filters.reference_code === "" ||
        item.reference_code
          .toLowerCase()
          .includes(filters.reference_code.toLowerCase())) &&
      (filters.category === "" || item.category.includes(filters.category)) &&
      (filters.updated_at === "" ||
        item.formatted_updated_at.includes(filters.updated_at))
    );
  }

  if (filters.type === "task_template") {
    return (
      filters.search === "" ||
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  if (filters.type === "invoices") {
    return (
      filters.formatted_issued_date === "" ||
      item.formatted_issued_date.includes(filters.formatted_issued_date)
    );
  }

  return true;
};
