export const MOCK_DMS = [
  {
    id: 'dm_elena',
    recipientId: 'usr_elena',
    name: 'Dr. Elena Rostova',
    username: 'elena_ai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastMessage: 'Let us sync on the agent coordination architecture at 2 PM.',
    timestamp: '10:45 AM',
    unreadCount: 1,
  },
  {
    id: 'dm_marcus',
    recipientId: 'usr_marcus',
    name: 'Marcus Vance',
    username: 'marcus_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastMessage: 'The new shader pipeline is running smooth now.',
    timestamp: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'dm_sora',
    recipientId: 'usr_sora',
    name: 'Sora Takahashi',
    username: 'sora_t',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'idle',
    lastMessage: 'Can you review the cryptographic proof circuit?',
    timestamp: 'May 16',
    unreadCount: 0,
  },
  {
    id: 'dm_kai',
    recipientId: 'usr_kai',
    name: 'Kai Thorne',
    username: 'kaithorne',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastMessage: 'Shared the spatial audio preset in the cloud drive.',
    timestamp: 'May 14',
    unreadCount: 0,
  },
];

export const MOCK_DM_MESSAGES = {
  'dm_elena': [
    {
      id: 'dm_msg_1',
      channelId: 'dm_elena',
      authorId: 'usr_elena',
      authorName: 'Dr. Elena Rostova',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      content: 'Hey Rishan, how is the real-time event pipeline coming along?',
      createdAt: '2024-05-18T10:30:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [],
      replyTo: null,
      attachments: []
    },
    {
      id: 'dm_msg_2',
      channelId: 'dm_elena',
      authorId: 'usr_me',
      authorName: 'Rishan Dev',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content: 'Almost done! Sub-millisecond latency on websocket broadcast simulation. Ready for the multi-agent cluster demo.',
      createdAt: '2024-05-18T10:35:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [{ emoji: '🔥', count: 1, users: ['usr_elena'] }],
      replyTo: null,
      attachments: []
    },
    {
      id: 'dm_msg_3',
      channelId: 'dm_elena',
      authorId: 'usr_elena',
      authorName: 'Dr. Elena Rostova',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      content: 'Let us sync on the agent coordination architecture at 2 PM.',
      createdAt: '2024-05-18T10:45:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [],
      replyTo: null,
      attachments: []
    }
  ]
};
