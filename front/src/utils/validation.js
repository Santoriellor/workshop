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

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.length === 0) return "";
  if (!emailRegex.test(email)) return "Invalid email format.";
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
