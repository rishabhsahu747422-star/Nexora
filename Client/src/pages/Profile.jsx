import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Calendar,
  Server,
  Edit2,
  Sparkles,
  Save,
  Check,
  ArrowLeft,
} from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import MobileNav from '../components/layout/MobileNav';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { updateProfile } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/uiSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.currentUser);
  const servers = useSelector((state) => state.servers.servers);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(
      updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
      })
    );
    setIsEditing(false);
    dispatch(
      addToast({
        type: 'success',
        message: 'Profile parameters updated.',
      })
    );
  };

  const userServers = servers.filter((s) => s.members?.includes(currentUser?.id));

  return (
    <div className="h-screen w-screen flex flex-col bg-[#07080C] text-slate-100 overflow-hidden">
      <GlobalHeader />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </button>

          {/* Profile Card Frame */}
          <div className="bg-[#10141C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
            {/* Banner */}
            <div className="h-44 w-full bg-gradient-to-r from-cyan-900/60 via-indigo-950/80 to-violet-950/60 relative">
              {currentUser?.banner && (
                <img
                  src={currentUser.banner}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-60"
                />
              )}
            </div>

            <div className="px-8 pb-8 pt-0 relative">
              {/* Floating Avatar & Actions */}
              <div className="-mt-16 flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
                <Avatar
                  src={currentUser?.avatar}
                  name={currentUser?.name}
                  size="xl"
                  status={currentUser?.status}
                  className="ring-4 ring-[#10141C]"
                />

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                /* Edit Form */
                <form onSubmit={handleSave} className="space-y-4">
                  <Input
                    label="Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    label="Custom Status"
                    placeholder="Refining the Nexora engine..."
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                  />

                  <Input
                    label="Bio / Manifesto"
                    multiline
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" icon={Save}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                /* Display View */
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-extrabold text-2xl text-white">
                      {currentUser?.name}
                    </h2>
                    <p className="font-mono text-xs text-cyan-400 mt-0.5">
                      @{currentUser?.username}
                    </p>
                    {currentUser?.customStatus && (
                      <p className="mt-2 text-xs bg-white/5 border border-white/5 px-3 py-1 rounded-xl text-slate-300 inline-block">
                        {currentUser?.customStatus}
                      </p>
                    )}
                  </div>

                  {currentUser?.bio && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                        About
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {currentUser?.bio}
                      </p>
                    </div>
                  )}

                  {/* Roles */}
                  {currentUser?.roles?.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                        Protocol Roles
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.roles.map((r, i) => (
                          <Badge key={i} variant="cyan" size="sm">
                            <Shield className="w-3.5 h-3.5" />
                            <span>{r}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member since & Communities */}
                  <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{currentUser?.joinedDate || 'Joined March 2024'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-500" />
                      <span>{userServers.length} Active Communities</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
