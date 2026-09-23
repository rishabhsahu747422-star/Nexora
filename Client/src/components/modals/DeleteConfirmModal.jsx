import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  title = 'Confirm Purge',
  message = 'Are you sure you want to delete this transmission?',
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            Confirm & Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
