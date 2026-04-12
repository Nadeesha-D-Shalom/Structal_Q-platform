import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../../assets/login/bg2.jpg";
import logo from "../../assets/login/logo.png";
import { apiUrl, persistAuth } from "../../api/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const login = String(email || "").trim();
    if (!login || !password) {
      setError("All fields are required");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || "Login failed");
        return;
      }
      persistAuth({ token: data.token, user: data.user });
      const role = String(data.user?.role || "").toLowerCase();
      if (role.includes("student")) {
        navigate("/student", { replace: true });
      } else if (role.includes("lecturer") || role.includes("admin")) {
        navigate("/lecturer", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

      <div className="relative w-[420px] rounded-2xl shadow-2xl bg-gradient-to-b from-[#e8c29e] to-[#cfd5df] px-8 py-5">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="logo" className="w-30 mb-1" />
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700">
            Email or registration number
          </label>
          <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or reg. no."
              className="w-full bg-transparent outline-none text-gray-700 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-700">Password</label>
          <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-between">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="***************"
              className="w-full bg-transparent outline-none text-gray-700 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <i
              className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"} text-gray-500 text-sm cursor-pointer`}
              onClick={() => setShowPassword(!showPassword)}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="mb-5">
          <p className="text-xs text-orange-500 cursor-pointer">Forgot Password?</p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gray-300 text-gray-800 font-semibold shadow-inner hover:bg-gray-400 transition disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
