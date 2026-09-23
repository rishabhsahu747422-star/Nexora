import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import NexoraLogo from '../assets/logo/NexoraLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { loginSuccess } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/uiSlice';
import { CURRENT_USER } from '../data/mockUsers';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'rishan@nexora.io',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Simulate brief network auth handshake
    setTimeout(() => {
      setIsLoading(false);
      dispatch(
        loginSuccess({
          user: {
            ...CURRENT_USER,
            email: data.email,
          },
          token: 'mock_jwt_token_nexora_' + Date.now(),
        })
      );
      dispatch(
        addToast({
          type: 'success',
          message: `Welcome back, ${CURRENT_USER.name}!`,
        })
      );
      navigate('/app');
    }, 600);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      dispatch(
        loginSuccess({
          user: CURRENT_USER,
          token: 'google_oauth_mock_token_' + Date.now(),
        })
      );
      dispatch(
        addToast({
          type: 'success',
          message: 'Signed in successfully with Google account.',
        })
      );
      navigate('/app');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#10141C] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/80 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <NexoraLogo size="lg" showTagline onClick={() => navigate('/')} />
          <h2 className="font-display font-bold text-2xl text-white mt-6">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Access your secure communication channels
          </p>
        </div>

        {/* Google One-Click Auth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#10141C] px-3 text-xs uppercase font-mono text-slate-500">
            or with credentials
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="name@domain.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address format',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-[#0C0F15] border-white/10 text-cyan-500 focus:ring-cyan-500/20"
                {...register('rememberMe')}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                dispatch(
                  addToast({
                    type: 'info',
                    message: 'Password reset link sent to registered email.',
                  })
                );
              }}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            className="w-full mt-4"
            icon={LogIn}
          >
            Sign In to Nexora
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
          >
            Create account <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
