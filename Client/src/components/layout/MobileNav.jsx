import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Compass,
  MessageSquare,
  Users,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  setMobileDrawerOpen,
  setMobileMembersOpen,
} from '../../redux/slices/uiSlice';
import ChannelList from '../channel/ChannelList';
import MemberList from '../members/MemberList';

export default function MobileNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isDrawerOpen = useSelector((state) => state.ui.isMobileDrawerOpen);
  const isMembersOpen = useSelector((state) => state.ui.isMobileMembersOpen);
  const dms = useSelector((state) => state.dms.conversations);
  const unreadDmsCount = dms.reduce((acc, d) => acc + (d.unreadCount || 0), 0);

  const getActiveTab = () => {
    if (location.pathname.startsWith('/app/messages')) return 'dms';
    if (location.pathname.startsWith('/app/server')) return 'channels';
    if (location.pathname.startsWith('/app/profile')) return 'profile';
    return 'hub';
  };

  const activeTab = getActiveTab();

  return (
    <>
      {/* Mobile Drawer (Left: Channels & Server Navigation) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileDrawerOpen(false))}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-72 bg-[#0C0F15] h-full shadow-2xl flex flex-col"
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">
                  Navigation
                </span>
                <button
                  onClick={() => dispatch(setMobileDrawerOpen(false))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ChannelList onCloseMobile={() => dispatch(setMobileDrawerOpen(false))} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Members Drawer (Right: Community Roster) */}
      <AnimatePresence>
        {isMembersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileMembersOpen(false))}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-72 bg-[#0C0F15] h-full shadow-2xl flex flex-col"
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">
                  Community Roster
                </span>
                <button
                  onClick={() => dispatch(setMobileMembersOpen(false))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <MemberList onCloseMobile={() => dispatch(setMobileMembersOpen(false))} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <div className="h-14 bg-[#0C0F15] border-t border-white/10 md:hidden flex items-center justify-around px-2 z-20 flex-shrink-0 select-none">
        <button
          onClick={() => navigate('/app')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${
            activeTab === 'hub' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-[10px] font-medium">Hub</span>
        </button>

        <button
          onClick={() => dispatch(setMobileDrawerOpen(true))}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${
            activeTab === 'channels' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px] font-medium">Channels</span>
        </button>

        <button
          onClick={() => navigate('/app/messages')}
          className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${
            activeTab === 'dms' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] font-medium">DMs</span>
          {unreadDmsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0C0F15]" />
          )}
        </button>

        <button
          onClick={() => navigate('/app/profile')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${
            activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </>
  );
}
