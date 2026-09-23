import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeModal } from '../../redux/slices/uiSlice';
import CreateServerModal from './CreateServerModal';
import CreateChannelModal from './CreateChannelModal';
import InviteModal from './InviteModal';
import ServerSettingsModal from './ServerSettingsModal';
import UserSettingsModal from './UserSettingsModal';
import MemberProfileModal from '../profile/MemberProfileModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ImagePreviewModal from './ImagePreviewModal';

export default function ModalManager() {
  const dispatch = useDispatch();
  const activeModal = useSelector((state) => state.ui.activeModal);

  if (!activeModal) return null;

  const handleClose = () => dispatch(closeModal());
  const { type, props = {} } = activeModal;

  switch (type) {
    case 'CREATE_SERVER':
      return <CreateServerModal isOpen={true} onClose={handleClose} {...props} />;
    case 'CREATE_CHANNEL':
      return <CreateChannelModal isOpen={true} onClose={handleClose} {...props} />;
    case 'INVITE':
      return <InviteModal isOpen={true} onClose={handleClose} {...props} />;
    case 'SERVER_SETTINGS':
      return <ServerSettingsModal isOpen={true} onClose={handleClose} {...props} />;
    case 'USER_SETTINGS':
      return <UserSettingsModal isOpen={true} onClose={handleClose} {...props} />;
    case 'PROFILE':
      return <MemberProfileModal isOpen={true} onClose={handleClose} {...props} />;
    case 'DELETE_CONFIRM':
      return <DeleteConfirmModal isOpen={true} onClose={handleClose} {...props} />;
    case 'IMAGE_PREVIEW':
      return <ImagePreviewModal isOpen={true} onClose={handleClose} {...props} />;
    default:
      return null;
  }
}
