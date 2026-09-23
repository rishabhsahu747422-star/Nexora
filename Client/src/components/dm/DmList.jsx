import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare, Plus, UserCheck, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { selectDm } from '../../redux/slices/dmSlice';

export default function DmList({ onSelectConversation, selectedDmId }) {
  const dispatch = useDispatch();
  const dms = useSelector((state) => state.dms.conversations);

  const handleSelect = (dmId) => {
    dispatch(selectDm(dmId));
    if (onSelectConversation) onSelectConversation(dmId);
  };

  return (
    <div className="w-72 bg-[#0C0F15] border-r border-white/10 flex flex-col h-full select-none flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#10141C] flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-100">
            Direct Transmissions
          </h3>
          <p className="text-[11px] text-slate-400">Encrypted 1-on-1 channels</p>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {dms.map((conv) => {
          const isSelected = conv.id === selectedDmId;

          return (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-200 border border-cyan-500/30'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <Avatar
                src={conv.avatar}
                name={conv.name}
                size="md"
                status={conv.status}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {conv.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {conv.timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 truncate pr-2">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge variant="unread" size="xs">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
