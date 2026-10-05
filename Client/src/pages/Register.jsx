import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  User,
  AtSign,
  Mail,
  Lock,
  UserPlus,
  ArrowRight,
  Check,
  Phone,
} from "lucide-react";
import NexoraLogo from "../assets/logo/NexoraLogo";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { registerUserAsync } from "../redux/slices/authSlice";
import { addToast } from "../redux/slices/uiSlice";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password", "");

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "Empty", color: "bg-slate-700" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, text: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 50, text: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 75, text: "Good", color: "bg-cyan-500" };
    return { score: 100, text: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data) => {
    const formData = new FormData();

    formData.append("username", data.username);
    formData.append("fullname", data.fullname);
    formData.append("mobile_no", data.mobile_no);
    formData.append("email", data.email);
    formData.append("password", data.password);

    if (data.profile_pic?.[0]) {
      formData.append("image", data.profile_pic[0]);
    }

    try {
      await dispatch(registerUserAsync(formData)).unwrap();

      dispatch(
        addToast({
          type: "success",
          message: `Welcome to Nexora, ${data.fullname}!`,
        }),
      );

      navigate("/app");
    } catch (error) {
      dispatch(
        addToast({
          type: "error",
          message: error || "Unable to create your account",
        }),
      );
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleRegister = () => {
    setGoogleLoading(true);

    window.location.href = "http://localhost:3000/api/auth/google";
    setGoogleLoading(false);
    dispatch(
      addToast({
        type: "success",
        message: "Register successfully with Google account.",
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none py-12">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-[#10141C] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/80 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <NexoraLogo size="lg" showTagline onClick={() => navigate("/")} />
          <h2 className="font-display font-bold text-2xl text-white mt-6">
            Create Your Account
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Join the next generation of decentralized communities
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Rishabh Sahu"
              error={errors.fullname?.message}
              {...register("fullname", {
                required: "Full name is required",
                minLength: { value: 2, message: "Minimum 2 characters" },
              })}
            />

            <Input
              label="Username"
              type="text"
              icon={AtSign}
              placeholder="rishabh-star"
              error={errors.username?.message}
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: "Letters, numbers, underscores only",
                },
              })}
            />
          </div>

          <Input
            label="Mobile Number"
            type="text"
            icon={Phone}
            placeholder="9616000016"
            error={errors.mobile_no?.message}
            {...register("mobile_no", {
              required: "Mobile Number is required",
              minLength: { value: 10, message: "Minimum 10 characters" },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: "10 digits Only",
              },
            })}
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="rishabh@gmail.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email address is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />

          {/* Password strength meter */}
          {passwordVal && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Strength:</span>
                <span className="font-mono font-medium text-slate-300">
                  {strength.text}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#0C0F15] rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Re-enter password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (val) =>
                val === passwordVal || "Passwords do not match",
            })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="w-full"
              icon={UserPlus}
            >
              Register
            </Button>
          </div>
        </form>

        {/* Google One-Click Auth */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#151A23] hover:bg-[#1E2535] border border-white/10 hover:border-white/20 text-slate-200 text-sm font-medium py-3 rounded-xl transition-all mb-6 active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.48 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.52 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
          >
            Sign in <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
