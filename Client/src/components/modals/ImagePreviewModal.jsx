import React from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import Modal from '../common/Modal';

export default function ImagePreviewModal({ isOpen, onClose, url, name }) {
  if (!url) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      className="p-2 bg-[var(--surface-elevated)]/90 border-[var(--border-subtle)]"
      showClose={true}
    >
      <div className="flex flex-col items-center justify-center p-2">
        <div className="max-h-[75vh] max-w-full rounded-xl overflow-hidden shadow-2xl">
          <img
            src={url}
            alt={name || 'Preview'}
            className="w-full h-full object-contain max-h-[75vh]"
          />
        </div>
        {name && (
          <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-slate-400">
            <span className="truncate">{name}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--accent)] hover:underline transition-colors"
            >
              <span>Full resolution</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}
