import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Sparkles, Upload, X } from "lucide-react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import CommunityAvatar from "../common/CommunityAvatar";
import { createServerAsync } from "../../redux/slices/serverSlice";
import { closeModal, addToast } from "../../redux/slices/uiSlice";

export default function CreateServerModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "Technology & AI",
    },
  });

  const communityName = watch("name") || "";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      dispatch(
        addToast({
          type: "error",
          message: "Please select a valid image file (PNG, JPG, WebP)",
        }),
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch(
        addToast({
          type: "error",
          message: "Emblem size must be under 5MB",
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

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("description", (data.description || "").trim());
    formData.append("isPublic", "true");

    if (selectedFile) {
      formData.append("icon", selectedFile);
    }

    try {
      const newServer = await dispatch(createServerAsync(formData)).unwrap();

      handleClose();
      dispatch(closeModal());

      dispatch(
        addToast({
          type: "success",
          message: `Community "${data.name}" established!`,
        }),
      );

      const createdId = newServer._id || newServer.id;
      if (createdId) {
        navigate(`/app/server/${createdId}`);
      }
    } catch (error) {
      dispatch(
        addToast({
          type: "error",
          message: error || "Unable to create community",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Community"
      subtitle="Establish a new decentralized nexus for your project or collective"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Emblem Preview & Upload Area */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Community Emblem
          </label>
          <div className="flex items-center gap-4 p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl">
            {/* Live Community Avatar or Uploaded Preview */}
            <div className="relative group flex-shrink-0">
              <CommunityAvatar
                src={previewUrl}
                name={communityName || "New Community"}
                size="lg"
                shape="rounded-2xl"
              />
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all scale-90 hover:scale-100"
                  title="Remove uploaded image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Upload Button & Guidance */}
            <div className="flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="community-emblem-upload"
              />
              <label
                htmlFor="community-emblem-upload"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--accent)] border border-[var(--accent-border)] rounded-xl text-xs font-medium cursor-pointer transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{selectedFile ? "Replace Image" : "Upload Image"}</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {selectedFile
                  ? selectedFile.name
                  : "Optional. A distinct geometric emblem is generated automatically if skipped."}
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Community Name"
          placeholder="e.g. Synthetix AI Guild"
          error={errors.name?.message}
          {...register("name", {
            required: "Community name is required",
            minLength: { value: 3, message: "Minimum 3 characters" },
          })}
        />

        <Input
          label="Description / Purpose"
          placeholder="What is this collective exploring?"
          multiline
          rows={2}
          error={errors.description?.message}
          {...register("description")}
        />

        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Category
          </label>
          <select
            {...register("category")}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-border)]"
          >
            <option value="Technology & AI">Technology & AI</option>
            <option value="Gaming & 3D">Gaming & 3D</option>
            <option value="Crypto & Protocols">Crypto & Protocols</option>
            <option value="Audio & Music">Audio & Music</option>
            <option value="Creative Arts">Creative Arts</option>
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Sparkles}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Establishing..." : "Establish Community"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
