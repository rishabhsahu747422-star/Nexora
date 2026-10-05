import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Server, Sparkles, Image as ImageIcon } from "lucide-react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { createServerAsync } from "../../redux/slices/serverSlice";
import { closeModal, addToast } from "../../redux/slices/uiSlice";

const DEFAULT_SERVER_ICONS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80",
];

export default function CreateServerModal({ isOpen, onClose }) {
  const { servers } = useSelector((state) => state.server);
  console.log(servers);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_SERVER_ICONS[0]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "Technology & AI",
    },
  });

  const onSubmit = async (data) => {
    const formData = new FormData();

    formData.append("name", data.name.trim());
    formData.append("description", data.description.trim());
    formData.append("isPublic", "true");

    try {
      const newServer = await dispatch(createServerAsync(formData)).unwrap();

      dispatch(closeModal());
      reset();

      dispatch(
        addToast({
          type: "success",
          message: `Community "${data.name}" established!`,
        }),
      );

      navigate(`/app/server/${newServer._id}`);
    } catch (error) {
      dispatch(
        addToast({
          type: "error",
          message: error || "Unable to create server",
        }),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Community"
      subtitle="Establish a new decentralized nexus for your project or collective"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Icon Selection */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Select Community Emblem
          </label>
          <div className="flex items-center gap-3">
            {DEFAULT_SERVER_ICONS.map((icon, idx) => (
              <img
                key={idx}
                src={icon}
                alt="Emblem"
                onClick={() => setSelectedIcon(icon)}
                className={`w-11 h-11 rounded-xl object-cover cursor-pointer transition-all ${
                  selectedIcon === icon
                    ? "ring-2 ring-cyan-400 scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
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
            className="w-full bg-[#0C0F15] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="Technology & AI">Technology & AI</option>
            <option value="Gaming & 3D">Gaming & 3D</option>
            <option value="Crypto & Protocols">Crypto & Protocols</option>
            <option value="Audio & Music">Audio & Music</option>
            <option value="Creative Arts">Creative Arts</option>
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" icon={Sparkles}>
            Establish Community
          </Button>
        </div>
      </form>
    </Modal>
  );
}
