import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../../assets/login/bg2.jpg";
import logo from "../../assets/login/logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Email validation regex
  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email format");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      const role = (data?.user?.role || data?.users?.role || "").toLowerCase().trim();
      if (role === "lecturer" || role === "admin") {
        navigate("/lecturer");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError("Unable to complete login");
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>

      {/* Card */}
      <div className="relative w-[420px] rounded-2xl shadow-2xl bg-gradient-to-b from-[#e8c29e] to-[#cfd5df] px-8 py-5">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="logo" className="w-30 mb-1" />
          {/* <h1 className="text-xl font-semibold text-[#1e3a5f]">
            Structal<span className="text-orange-500">Q</span>
          </h1> */}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700">
            Email or Username
          </label>

          <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Eg:-jhon,John Doe@gmail.com"
              className="w-full bg-transparent outline-none text-gray-700 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-700">
            Password
          </label>

          <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-between">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="***************"
              className="w-full bg-transparent outline-none text-gray-700 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />

            <i
              className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"} text-gray-500 text-sm cursor-pointer`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-xs mb-3">{error}</p>
        )}

        {/* Forgot */}
        <div className="mb-5">
          <p className="text-xs text-orange-500 cursor-pointer">
            Forgot Password?
          </p>
        </div>

        {/* Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gray-300 text-gray-800 font-semibold shadow-inner hover:bg-gray-400 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;