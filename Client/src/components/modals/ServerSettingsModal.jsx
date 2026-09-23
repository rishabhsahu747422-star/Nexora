import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Users,
  Compass,
  Bell,
  Trash2,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { updateServer, deleteServer } from '../../redux/slices/serverSlice';
import { addToast, closeModal } from '../../redux/slices/uiSlice';

export default function ServerSettingsModal({ isOpen, onClose, server }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'roles' | 'members' | 'moderation' | 'danger'
  const [serverName, setServerName] = useState(server?.name || '');
  const [serverDesc, setServerDesc] = useState(server?.description || '');
  const [serverTag, setServerTag] = useState(server?.tag || '');

  if (!server) return null;

  const handleSaveOverview = (e) => {
    e.preventDefault();
    dispatch(
      updateServer({
        id: server.id,
        data: {
          name: serverName.trim(),
          description: serverDesc.trim(),
          tag: serverTag.trim().toUpperCase(),
        },
      })
    );
    dispatch(
      addToast({
        type: 'success',
        message: 'Community parameters synchronized.',
      })
    );
  };

  const handleDeleteServer = () => {
    if (
      window.confirm(
        `Are you sure you want to completely purge and delete "${server.name}"? This action cannot be undone.`
      )
    ) {
      dispatch(deleteServer(server.id));
      dispatch(closeModal());
      dispatch(
        addToast({
          type: 'info',
          message: `Community "${server.name}" deleted.`,
        })
      );
      navigate('/app');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'moderation', label: 'Moderation Safety', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${server.name} Settings`}
      maxWidth="max-w-2xl"
      className="p-0"
    >
      <div className="flex flex-col sm:flex-row min-h-[420px]">
        {/* Left Subnav */}
        <div className="w-full sm:w-52 bg-[#0C0F15] border-b sm:border-b-0 sm:border-r border-white/5 p-3 space-y-1 select-none">
          <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1">
            Community Config
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? isDanger
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : isDanger
                    ? 'text-rose-400 hover:bg-rose-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <form onSubmit={handleSaveOverview} className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Community Overview
              </h3>

              <Input
                label="Community Name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Community Tag"
                  value={serverTag}
                  onChange={(e) => setServerTag(e.target.value)}
                  placeholder="e.g. SYNTH"
                />
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    disabled
                    value={server.category}
                    className="w-full bg-[#0C0F15] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-400 opacity-60"
                  />
                </div>
              </div>

              <Input
                label="About / Description"
                multiline
                rows={3}
                value={serverDesc}
                onChange={(e) => setServerDesc(e.target.value)}
              />

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-base text-slate-100">
                    Roles & Hierarchy
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Access privileges granted to collective participants
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {server.roles?.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0C0F15] border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        {role.name}
                      </span>
                    </div>
                    <Badge variant="default" size="xs">
                      Default Permissions
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Automated Verification & Filters
              </h3>
              <p className="text-xs text-slate-400">
                Configure protocol filters for spam containment and transmission screening.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    title: 'Require Verified Cryptographic ID',
                    desc: 'Members must authenticate through verified handles.',
                    checked: true,
                  },
                  {
                    title: 'Block Unsolicited Executable Snippets',
                    desc: 'Automatically flag untrusted shell scripts and binaries.',
                    checked: true,
                  },
                  {
                    title: 'Audit Logging',
                    desc: 'Stream all role updates and purges to moderation nodes.',
                    checked: true,
                  },
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

          {activeTab === 'danger' && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-base text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-slate-400">
                Irreversible actions that affect this entire community.
              </p>

              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <h4 className="text-xs font-bold text-rose-300">
                  Delete This Community
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Purges all channels, messages, roles, and member links for {server.name}. Once confirmed, data cannot be recovered.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleDeleteServer}
                >
                  Permanently Delete Community
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
