import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  Upload,
  X,
} from "lucide-react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import Badge from "../common/Badge";
import CommunityAvatar from "../common/CommunityAvatar";
import { updateServer, deleteServer } from "../../redux/slices/serverSlice";
import { addToast, closeModal } from "../../redux/slices/uiSlice";

export default function ServerSettingsModal({ isOpen, onClose, server }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'roles' | 'members' | 'moderation' | 'danger'
  const [serverName, setServerName] = useState(server?.name || "");
  const [serverDesc, setServerDesc] = useState(server?.description || "");
  const [serverTag, setServerTag] = useState(server?.tag || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!server) return null;

  const sId = server._id || server.id;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      dispatch(
        addToast({
          type: "error",
          message: "Please select an image file (PNG, JPG, WebP)",
        }),
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearImage = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveOverview = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", serverName.trim());
      formData.append("description", serverDesc.trim());
      if (serverTag) formData.append("tag", serverTag.trim().toUpperCase());
      if (selectedFile) {
        formData.append("icon", selectedFile);
      }

      await dispatch(
        updateServer({
          id: sId,
          data: formData,
        }),
      ).unwrap();

      dispatch(
        addToast({
          type: "success",
          message: "Community parameters synchronized.",
        }),
      );
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err || "Failed to update community settings.",
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteServer = () => {
    if (
      window.confirm(
        `Are you sure you want to completely purge and delete "${server.name}"? This action cannot be undone.`,
      )
    ) {
      dispatch(deleteServer(sId));
      dispatch(closeModal());
      dispatch(
        addToast({
          type: "info",
          message: `Community "${server.name}" deleted.`,
        }),
      );
      navigate("/app");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Settings },
    { id: "roles", label: "Roles & Permissions", icon: Shield },
    { id: "moderation", label: "Moderation Safety", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
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
        <div className="w-full sm:w-52 bg-[var(--surface-primary)] border-b sm:border-b-0 sm:border-r border-[var(--border-subtle)] p-3 space-y-1 select-none">
          <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1">
            Community Config
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDanger = tab.id === "danger";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? isDanger
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
                    : isDanger
                      ? "text-rose-400 hover:bg-rose-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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
          {activeTab === "overview" && (
            <form onSubmit={handleSaveOverview} className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Community Overview
              </h3>

              {/* Community Emblem Preview & Upload */}
              <div className="flex items-center gap-4 p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl">
                <div className="relative group flex-shrink-0">
                  <CommunityAvatar
                    src={previewUrl || server.icon}
                    name={serverName || server.name}
                    size="lg"
                    shape="rounded-2xl"
                  />
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all scale-90 hover:scale-100"
                      title="Remove pending upload"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="settings-emblem-upload"
                  />
                  <label
                    htmlFor="settings-emblem-upload"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--accent)] border border-[var(--accent-border)] rounded-xl text-xs font-medium cursor-pointer transition-all shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedFile ? "Replace Emblem" : "Change Community Emblem"}</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {selectedFile
                      ? selectedFile.name
                      : "PNG, JPG or WebP up to 5MB. Leave empty to keep existing or default."}
                  </p>
                </div>
              </div>

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
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-xs text-slate-400 opacity-60"
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

          {activeTab === "roles" && (
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
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
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

          {activeTab === "moderation" && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-100">
                Automated Verification & Filters
              </h3>
              <p className="text-xs text-slate-400">
                Configure protocol filters for spam containment and transmission
                screening.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    title: "Require Verified Cryptographic ID",
                    desc: "Members must authenticate through verified handles.",
                    checked: true,
                  },
                  {
                    title: "Block Unsolicited Executable Snippets",
                    desc: "Automatically flag untrusted shell scripts and binaries.",
                    checked: true,
                  },
                  {
                    title: "Audit Logging",
                    desc: "Stream all role updates and purges to moderation nodes.",
                    checked: true,
                  },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="mt-0.5 w-4 h-4 rounded bg-[var(--app-bg)] border-[var(--border-subtle)] text-[var(--accent)] focus:ring-[var(--accent-soft)]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === "danger" && (
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
                  Purges all channels, messages, roles, and member links for{" "}
                  {server.name}. Once confirmed, data cannot be recovered.
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
