import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { User, AtSign, Mail, Lock, UserPlus, ArrowRight, Check } from 'lucide-react';
import NexoraLogo from '../assets/logo/NexoraLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { registerSuccess } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/uiSlice';

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
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password', '');

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, text: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, text: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, text: 'Good', color: 'bg-cyan-500' };
    return { score: 100, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(passwordVal);

  const onSubmit = (data) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser = {
        id: 'usr_' + Date.now(),
        name: data.fullName,
        username: data.username.toLowerCase(),
        email: data.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        status: 'online',
        customStatus: 'Exploring Nexora Nexus',
        bio: 'New member of the Nexora communication network.',
        roles: ['Member'],
        joinedDate: 'Joined Just Now',
        mutualServers: ['srv_synthetix'],
      };

      dispatch(registerSuccess({ user: newUser }));
      dispatch(
        addToast({
          type: 'success',
          message: `Welcome to Nexora, ${data.fullName}!`,
        })
      );
      navigate('/app');
    }, 600);
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
          <NexoraLogo size="lg" showTagline onClick={() => navigate('/')} />
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
              placeholder="e.g. Alex Morgan"
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Minimum 2 characters' },
              })}
            />

            <Input
              label="Username"
              type="text"
              icon={AtSign}
              placeholder="e.g. alexm"
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Minimum 3 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Letters, numbers, underscores only',
                },
              })}
            />
          </div>

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
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
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
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) =>
                val === passwordVal || 'Passwords do not match',
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
              Complete Registration
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
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
