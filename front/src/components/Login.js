import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isValidEmail, isValidPassword } from "../utils/validation";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Error messages
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Live validation
  useEffect(() => {
    const emailError = isValidEmail(email);
    setErrors((prevErrors) =>
      prevErrors.email !== emailError
        ? { ...prevErrors, email: emailError }
        : prevErrors
    );
  }, [email]);

  /* useEffect(() => {
    const passwordError = isValidPassword(password);
    setErrors((prevErrors) =>
      prevErrors.password !== passwordError
        ? { ...prevErrors, password: passwordError }
        : prevErrors
    );
  }, [password]); */

  const isFormValid = !errors.email && !errors.password && email && password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isLoggedIn = await login(email, password);
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            id="email"
            type="email"
            placeholder="Email"
            title="Email is required"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "invalid" : "valid"}
            required
          />
          <p className="error-text">{errors.email && <>{errors.email}</>}</p>

          <input
            id="password"
            type="password"
            placeholder="Password"
            title="Password is required"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "invalid" : "valid"}
            required
          />
          <p className="error-text">
            {errors.password && <>{errors.password}</>}
          </p>

          <button type="submit" disabled={!isFormValid || loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="bottomline">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
