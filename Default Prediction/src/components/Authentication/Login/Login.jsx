import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaUserTie,
} from "react-icons/fa";

function Login() {
  const URL = "https://defaultprediction-backend-mongodb.onrender.com";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBanker, setIsBanker] = useState(false); // New state for banker checkbox

  const navigate = useNavigate();

  const validate = () => {
    const newErrors = { email: "", password: "", form: "" };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (Object.values(touched).some((field) => field)) {
      validate();
    }
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBankerChange = (e) => {
    setIsBanker(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (validate()) {
      setIsLoading(true);
      setErrors((prev) => ({ ...prev, form: "" }));

      try {
        const endpoint = isBanker ? `${URL}/user/checkbanker` : `${URL}/user/checkuser`;
        const result = await axios.post(endpoint, formData);
        
        localStorage.setItem("token", result.data.authToken);
        localStorage.setItem("userType", isBanker ? "banker" : "user");
        
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
      } catch (err) {
        if (err.response?.status === 401) {
          setErrors((prev) => ({ 
            ...prev, 
            form: `Invalid email or password${isBanker ? ' for banker account' : ''}` 
          }));
        } else if (err.response?.data?.message) {
          setErrors((prev) => ({ ...prev, form: err.response.data.message }));
        } else {
          setErrors((prev) => ({
            ...prev,
            form: "An error occurred. Please try again.",
          }));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Card */}
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-gray-200">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-900">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">
            Sign in to continue to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Account Type Checkbox */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="banker"
                checked={isBanker}
                onChange={handleBankerChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="banker" className="ml-2 flex items-center text-sm text-blue-900">
                <FaUserTie className="mr-1 text-blue-600" />
                Login as Banker
              </label>
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-blue-900"
            >
              Email Address
            </label>
            <div className="mt-1 relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder={isBanker ? "banker@bank.com" : "you@example.com"}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2 rounded-md text-sm
                border shadow-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${touched.email && errors.email ? "border-red-500" : "border-gray-300"}
              `}
              />
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FaExclamationCircle className="mr-1" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-blue-900"
            >
              Password
            </label>
            <div className="mt-1 relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-10 py-2 rounded-md text-sm
                border shadow-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${touched.password && errors.password ? "border-red-500" : "border-gray-300"}
              `}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FaExclamationCircle className="mr-1" /> {errors.password}
              </p>
            )}
            <div className="text-right mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Form Error */}
          {errors.form && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 px-3 py-2 rounded-md flex items-center">
              <FaExclamationCircle className="mr-2" /> {errors.form}
            </div>
          )}

          {/* Submit Button */}
          <div className="mb-4">
            <button
              type="submit"
              className={`w-full font-semibold py-2 rounded-md transition-all text-white ${
                isBanker 
                  ? 'bg-green-700 hover:bg-green-800' 
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex justify-center items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isBanker ? 'Logging in as Banker...' : 'Logging in...'}
                </span>
              ) : (
                <>
                  {isBanker ? (
                    <span className="flex justify-center items-center gap-2">
                      <FaUserTie />
                      Log In as Banker
                    </span>
                  ) : (
                    'Log In'
                  )}
                </>
              )}
            </button>
          </div>

          {/* OR Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </div>

          {/* Sign Up */}
          <p className="text-center text-sm text-blue-900">
            Don't have an account?
            <Link
              to="/signup"
              className="ml-1 text-blue-600 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
