import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  Bell,
  Lock,
  LogOut,
  Laptop,
  Check,
  Save,
  Moon,
  Sun,
  LayoutGrid,
} from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { updateProfile, logout } from '../../redux/slices/authSlice';
import { setTheme, setMessageDensity, addToast, closeModal } from '../../redux/slices/uiSlice';

export default function UserSettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.currentUser);
  const theme = useSelector((state) => state.ui.theme);
  const messageDensity = useSelector((state) => state.ui.messageDensity);

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'appearance' | 'notifications' | 'privacy'
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    dispatch(
      updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
      })
    );
    dispatch(
      addToast({
        type: 'success',
        message: 'Profile parameters updated and persisted.',
      })
    );
  };

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    dispatch(
      addToast({
        type: 'info',
        message: `Visual theme switched to ${newTheme}.`,
      })
    );
  };

  const handleDensityChange = (density) => {
    dispatch(setMessageDensity(density));
    dispatch(
      addToast({
        type: 'info',
        message: `Message density set to ${density}.`,
      })
    );
  };

  const tabs = [
    { id: 'account', label: 'My Account', icon: User },
    { id: 'appearance', label: 'Appearance & UI', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Sessions', icon: Lock },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Preferences"
      maxWidth="max-w-2xl"
      className="p-0"
    >
      <div className="flex flex-col sm:flex-row min-h-[440px]">
        {/* Left Subnav */}
        <div className="w-full sm:w-52 bg-[#0C0F15] border-b sm:border-b-0 sm:border-r border-white/5 p-3 space-y-1 select-none">
          <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1">
            User Settings
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="border-t border-white/5 pt-2 mt-2">
            <button
              onClick={() => {
                dispatch(closeModal());
                dispatch(logout());
                dispatch(addToast({ type: 'info', message: 'Signed out of Nexora.' }));
                navigate('/login');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Account Credentials
              </h3>

              <div className="flex items-center gap-4 p-3 bg-[#0C0F15] rounded-xl border border-white/5">
                <Avatar
                  src={currentUser?.avatar}
                  name={currentUser?.name}
                  size="lg"
                  status={currentUser?.status}
                />
                <div>
                  <h4 className="text-sm font-semibold text-white">{currentUser?.name}</h4>
                  <p className="text-xs font-mono text-cyan-400">@{currentUser?.username}</p>
                  <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
                </div>
              </div>

              <Input
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Custom Status"
                placeholder="What's happening?"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
              />

              <Input
                label="Bio / Notes"
                multiline
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Save Profile
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-semibold text-base text-slate-100 mb-1">
                  Color Mode & Theme
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Select your preferred ambient lighting profile.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Void', icon: Moon, desc: 'Nexora signature' },
                    { id: 'light', label: 'Luminescence', icon: Sun, desc: 'High daylight' },
                    { id: 'system', label: 'System Sync', icon: Laptop, desc: 'Match OS' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`flex flex-col items-center text-center p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                            : 'bg-[#0C0F15] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span className="text-xs font-semibold">{t.label}</span>
                        <span className="text-[10px] opacity-70">{t.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h3 className="font-display font-semibold text-base text-slate-100 mb-1">
                  Message Spacing & Density
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Control how information is compressed in the transmission stream.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: 'comfortable',
                      label: 'Comfortable',
                      desc: 'Generous avatars and spacing',
                    },
                    {
                      id: 'compact',
                      label: 'Compact',
                      desc: 'Maximum message density',
                    },
                  ].map((d) => {
                    const isSelected = messageDensity === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => handleDensityChange(d.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                            : 'bg-[#0C0F15] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{d.label}</span>
                        <span className="text-[11px] opacity-70 block mt-0.5">
                          {d.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Notification Rules
              </h3>
              <p className="text-xs text-slate-400">
                Select when you want to receive alerts and visual indicators.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { title: 'Desktop Transmissions Alert', desc: 'Push notifications for direct mentions', checked: true },
                  { title: 'Audible Sound Effects', desc: 'Subtle acoustic click when sending and receiving', checked: true },
                  { title: 'Direct Transmission Highlights', desc: 'Notify on 1-on-1 private transmissions', checked: true },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#0C0F15] border border-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="mt-0.5 w-4 h-4 rounded bg-[#07080C] border-white/10 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Active Sessions
              </h3>
              <div className="p-3 bg-[#0C0F15] rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Windows Chrome • Current Session
                      </p>
                      <p className="text-[10px] font-mono text-emerald-400">
                        Active Now • IP: 192.168.1.104
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
