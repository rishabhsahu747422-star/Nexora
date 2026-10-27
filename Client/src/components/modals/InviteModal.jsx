import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Copy, RefreshCw, Check, Link as LinkIcon, Shield, Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import CommunityAvatar from "../common/CommunityAvatar";
import { regenerateInvite } from "../../redux/slices/serverSlice";
import { createInvite } from "../../services/server.service";
import { addToast } from "../../redux/slices/uiSlice";

export default function InviteModal({ isOpen, onClose, server }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState("7 days");
  const [maxUses, setMaxUses] = useState("No limit");
  const [inviteCode, setInviteCode] = useState(server?.inviteCode || "");
  const [isLoadingCode, setIsLoadingCode] = useState(!server?.inviteCode);

  useEffect(() => {
    const sId = server?._id || server?.id;
    if (!sId) return;

    if (server.inviteCode) {
      setInviteCode(server.inviteCode);
      setIsLoadingCode(false);
    } else {
      setIsLoadingCode(true);
      createInvite(sId)
        .then((res) => {
          if (res?.inviteCode) {
            setInviteCode(res.inviteCode);
          }
        })
        .catch((err) => {
          console.error("Failed to load invite code:", err);
        })
        .finally(() => {
          setIsLoadingCode(false);
        });
    }
  }, [server]);

  if (!server) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const appBaseUrl = import.meta.env.VITE_APP_URL || origin;
  const inviteUrl = inviteCode ? `${appBaseUrl}/invite/${inviteCode}` : "";

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    dispatch(
      addToast({
        type: "success",
        message: "Invite link copied to clipboard!",
      }),
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    const sId = server._id || server.id;
    setIsLoadingCode(true);
    try {
      const res = await dispatch(regenerateInvite(sId)).unwrap();
      if (res?.inviteCode) {
        setInviteCode(res.inviteCode);
      }
      dispatch(
        addToast({
          type: "info",
          message: "New invite token generated.",
        }),
      );
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Failed to generate new invite token.",
        }),
      );
    } finally {
      setIsLoadingCode(false);
    }
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
        {/* Community Info Header */}
        <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl">
          <CommunityAvatar
            src={server.icon}
            name={server.name}
            size="md"
            shape="rounded-xl"
          />
          <div className="min-w-0">
            <h4 className="font-display font-semibold text-sm text-slate-100 truncate">
              {server.name}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              {server.tag || "NEXUS"} • {server.memberCount || 1} members
            </p>
          </div>
        </div>

        {/* Link box */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Community Invite Link
          </label>
          <div className="flex items-center gap-2 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={isLoadingCode ? "Generating encrypted access link..." : inviteUrl}
              className={`bg-transparent text-xs font-mono flex-1 focus:outline-none select-all ${
                isLoadingCode ? "text-slate-500 italic" : "text-slate-200"
              }`}
            />
            <Button
              variant={copied ? "secondary" : "primary"}
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
              disabled={isLoadingCode || !inviteUrl}
            >
              {copied ? "Copied" : "Copy"}
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
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
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
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
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
            disabled={isLoadingCode}
            className="flex items-center gap-1.5 text-[var(--accent)] hover:underline transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCode ? "animate-spin" : ""}`} />
            <span>{isLoadingCode ? "Generating..." : "Generate New Link"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
