import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Hash, Volume2, Megaphone, Lock, Plus } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { createChannel } from '../../redux/slices/channelSlice';
import { closeModal, addToast } from '../../redux/slices/uiSlice';

export default function CreateChannelModal({ isOpen, onClose, serverId, defaultType = 'text' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: defaultType,
      topic: '',
      isPrivate: false,
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data) => {
    const channelName = data.name.toLowerCase().replace(/\s+/g, '-');
    dispatch(
      createChannel({
        serverId,
        name: channelName,
        type: data.type,
        topic: data.topic,
        isPrivate: data.isPrivate,
      })
    );

    dispatch(closeModal());
    reset();
    dispatch(
      addToast({
        type: 'success',
        message: `Channel #${channelName} created!`,
      })
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Channel"
      subtitle="Add a new transmission or audio frequency to this community"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Channel Type Selector */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Channel Frequency Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'text', label: 'Text', desc: 'Transmissions', icon: Hash },
              { id: 'announcement', label: 'Dispatch', desc: 'Read-only', icon: Megaphone },
              { id: 'voice', label: 'Audio', desc: 'Stage', icon: Volume2 },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <label
                  key={t.id}
                  className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedType === t.id
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                      : 'bg-[#0C0F15] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    value={t.id}
                    className="hidden"
                    {...register('type')}
                  />
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Input
          label="Channel Name"
          placeholder="e.g. quantum-benchmarks"
          error={errors.name?.message}
          {...register('name', {
            required: 'Channel name is required',
            minLength: { value: 2, message: 'Minimum 2 characters' },
          })}
        />

        <Input
          label="Topic / Purpose"
          placeholder="Guidelines or topic for this channel"
          error={errors.topic?.message}
          {...register('topic')}
        />

        {/* Private Toggle */}
        <label className="flex items-center gap-3 p-3 bg-[#0C0F15] border border-white/5 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded bg-[#07080C] border-white/10 text-cyan-500 focus:ring-cyan-500/20"
            {...register('isPrivate')}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Private Channel</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Only designated role tiers will have read access
            </p>
          </div>
        </label>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" icon={Plus}>
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
