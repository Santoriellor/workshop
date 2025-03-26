// Common validations
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.length === 0) return "";
  if (!emailRegex.test(email)) return "Invalid email format.";
  return "";
};

export function isValidYear(year) {
  const currentYear = new Date().getFullYear();
  const yearRegex = /^(19\d{2}|20\d{2}|2100)$/;

  if (!year.toString().trim()) return "This field is required.";
  if (!yearRegex.test(year))
    return `Year must be between 1900 and ${currentYear}.`;
  if (year < 1900 || year > currentYear)
    return `Year must be between 1900 and ${currentYear}.`;

  return "";
}

export function isValidPrice(price) {
  if (!price) return "Price is required.";
  if (!/^\d+(\.\d{1,2})?$/.test(price))
    return "Price must be a positive number with up to 2 decimals.";
  return "";
}

// Login and register validations
export const isValidUsername = (username) => {
  if (username.length === 0) return "";
  if (username.length < 3)
    return "Username must be at least 3 characters long.";
};

export const isTakenUsername = (username, existingUsernames) => {
  if (username.length === 0) return "";
  if (existingUsernames.includes(username)) return "Username is already taken.";
  return "";
};

export const isTakenEmail = (email, existingEmails) => {
  if (email.length === 0) return "";
  return existingEmails.includes(email) ? "Email is already registered." : "";
};

export const isValidPassword = (password) => {
  if (password.length === 0) return "";
  /* if (password.length < 8)
    return "Password must be at least 8 characters long."; */
  /* if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter."; */
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter.";
  /* if (!/[0-9]/.test(password))
    return "Password must contain at least one digit."; */
  /* if (!/[@$!%*?&]/.test(password))
    return "Password must contain at least one special character (@$!%*?&)."; */
  return "";
};

export const passwordsMatch = (password, confirmPassword) => {
  if (confirmPassword.length === 0) return "";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
};

// Vehicles validations
export const isValidOrTakenLicensePlate = (
  licensePlate,
  existingLicensePlates
) => {
  if (!licensePlate.trim()) return "This field is required.";
  if (
    existingLicensePlates.some(
      (plate) => plate.toLowerCase() === licensePlate.toLowerCase()
    )
  ) {
    return "License plate is already taken.";
  }

  const licensePlateRegex = /^[A-Z0-9-\s]{2,10}$/;
  if (!licensePlateRegex.test(licensePlate))
    return "Invalid license plate format.";

  return "";
};

// Owners validations
export const isTakenOwnerName = (ownerName, existingOwnerNames) => {
  if (ownerName.length === 0) return "";
  if (!ownerName.trim()) return "";

  if (
    existingOwnerNames.some(
      (name) => name.toLowerCase() === ownerName.toLowerCase()
    )
  ) {
    return "Owner name is already taken.";
  }

  return "";
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
  if (phone.length === 0) return "";
  if (!phoneRegex.test(phone)) return "Invalid phone number format.";
  return "";
};

export const isValidAddress = (address) => {
  const addressRegex = /^[a-zA-Z0-9\s.,#-]{5,100}$/;
  if (address.length === 0) return "";
  if (!addressRegex.test(address)) return "Invalid address format.";
  return "";
};

// Inventory validations
export const isValidReferenceCode = (refCode, existingReferenceCodes) => {
  if (!refCode.trim()) return "This field is required.";

  const refCodeRegex = /^[A-Z0-9-]+$/i;
  if (!refCodeRegex.test(refCode)) {
    return "Invalid format. Only letters, numbers, and dashes are allowed.";
  }

  if (refCode.length < 3 || refCode.length > 15) {
    return "Reference code must be between 3 and 15 characters.";
  }

  if (existingReferenceCodes.includes(refCode.toUpperCase())) {
    return "Reference code is already taken.";
  }

  return "";
};

export function isValidQuantityInStock(quantity) {
  if (!quantity) return "Quantity is required.";
  if (!/^\d+(\.\d{1,2})?$/.test(quantity))
    return "Quantity must be a positive number with up to 2 decimals.";
  return "";
}

// Task templates
export const isTakenTaskName = (taskName, existingTaskNames) => {
  if (!taskName.trim()) return "This field is required.";

  if (
    existingTaskNames.some(
      (name) => name.toLowerCase() === taskName.toLowerCase()
    )
  ) {
    return "Reference code is already taken.";
  }
};
