import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      type = 'text',
      icon: Icon = null,
      multiline = false,
      rows = 3,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || props.name;
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-300 flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              <Icon className="w-4 h-4" />
            </div>
          )}

          {multiline ? (
            <textarea
              ref={ref}
              id={inputId}
              rows={rows}
              className={`w-full bg-[#0C0F15] border ${
                error
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-white/10 focus:border-cyan-500/60 focus:ring-cyan-500/20'
              } text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
                Icon ? 'pl-10' : ''
              } ${className}`}
              {...props}
            />
          ) : (
            <input
              ref={ref}
              id={inputId}
              type={computedType}
              className={`w-full bg-[#0C0F15] border ${
                error
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-white/10 focus:border-cyan-500/60 focus:ring-cyan-500/20'
              } text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                Icon ? 'pl-10' : ''
              } ${isPassword ? 'pr-10' : ''} ${className}`}
              {...props}
            />
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-0.5 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
