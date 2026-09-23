import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Shield, Sparkles } from 'lucide-react';
import Avatar from '../common/Avatar';
import { openModal } from '../../redux/slices/uiSlice';
import { MOCK_USERS } from '../../data/mockUsers';

export default function MemberList({ onCloseMobile }) {
  const dispatch = useDispatch();
  const activeServerId = useSelector((state) => state.servers.activeServerId);
  const activeServer = useSelector((state) =>
    state.servers.servers.find((s) => s.id === activeServerId)
  );

  // Filter members belonging to this active server
  const serverMemberIds = activeServer?.members || ['usr_me'];
  const serverMembers = MOCK_USERS.filter((u) => serverMemberIds.includes(u.id));

  // Group by status
  const onlineMembers = serverMembers.filter(
    (m) => m.status === 'online' || m.status === 'dnd'
  );
  const idleMembers = serverMembers.filter((m) => m.status === 'idle');
  const offlineMembers = serverMembers.filter((m) => m.status === 'offline');

  const handleMemberClick = (user) => {
    dispatch(openModal({ type: 'PROFILE', props: { user } }));
    if (onCloseMobile) onCloseMobile();
  };

  const renderGroup = (title, members) => {
    if (members.length === 0) return null;

    return (
      <div className="space-y-1 mb-4">
        <h4 className="text-[10px] font-mono uppercase text-slate-500 px-2 tracking-wider">
          {title} — {members.length}
        </h4>
        <div className="space-y-0.5">
          {members.map((member) => (
            <div
              key={member.id}
              onClick={() => handleMemberClick(member)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <Avatar
                src={member.avatar}
                name={member.name}
                size="sm"
                status={member.status}
              />
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                    {member.name}
                  </span>
                  {member.roles?.[0] && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400">
                      {member.roles[0].split(' ')[0]}
                    </span>
                  )}
                </div>
                {member.customStatus ? (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {member.customStatus}
                  </p>
                ) : (
                  <p className="text-[10px] font-mono text-cyan-500/80 truncate">
                    @{member.username}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-60 bg-[#0C0F15] border-l border-white/10 flex flex-col h-full select-none flex-shrink-0 p-3 overflow-y-auto">
      <div className="px-2 py-1 mb-2 text-xs font-semibold text-slate-300 flex items-center justify-between">
        <span>Community Roster</span>
        <span className="text-[10px] font-mono text-slate-500">
          {serverMembers.length} Total
        </span>
      </div>

      {renderGroup('Online & Active', onlineMembers)}
      {renderGroup('Away / Idle', idleMembers)}
      {renderGroup('Offline', offlineMembers)}
    </div>
  );
}
