import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Copy, RefreshCw, Check, Link as LinkIcon, Shield } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { regenerateInvite } from '../../redux/slices/serverSlice';
import { addToast } from '../../redux/slices/uiSlice';

export default function InviteModal({ isOpen, onClose, server }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('7 days');
  const [maxUses, setMaxUses] = useState('No limit');

  if (!server) return null;

  const inviteCode = server.inviteCode || 'nx-synth-ai';
  const inviteUrl = `https://nexora.io/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    dispatch(
      addToast({
        type: 'success',
        message: 'Invite link copied to clipboard!',
      })
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    dispatch(regenerateInvite(server.id));
    dispatch(
      addToast({
        type: 'info',
        message: 'New invite token generated.',
      })
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite to Community"
      subtitle={`Share an encrypted access link to "${server.name}"`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Link box */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Community Invite Link
          </label>
          <div className="flex items-center gap-2 bg-[#0C0F15] border border-white/10 rounded-xl p-2">
            <LinkIcon className="w-4 h-4 text-cyan-400 ml-1.5 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs font-mono text-slate-200 flex-1 focus:outline-none select-all"
            />
            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Link Expiration
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full bg-[#0C0F15] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="30 minutes">30 minutes</option>
              <option value="1 day">1 day</option>
              <option value="7 days">7 days</option>
              <option value="Never">Never</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Max Number of Uses
            </label>
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full bg-[#0C0F15] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="No limit">No limit</option>
              <option value="1 use">1 use</option>
              <option value="5 uses">5 uses</option>
              <option value="25 uses">25 uses</option>
            </select>
          </div>
        </div>

        {/* Regenerate Trigger */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>Need a fresh token?</span>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Link</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
