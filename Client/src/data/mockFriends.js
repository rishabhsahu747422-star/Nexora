export const MOCK_FRIENDS = [
  {
    id: 'fr_elena',
    userId: 'usr_elena',
    name: 'Dr. Elena Rostova',
    username: 'elena_ai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Training multi-agent cluster v4.2',
    mutualServersCount: 2,
  },
  {
    id: 'fr_marcus',
    userId: 'usr_marcus',
    name: 'Marcus Vance',
    username: 'marcus_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Compiling Unreal 5.4 shaders...',
    mutualServersCount: 1,
  },
  {
    id: 'fr_sora',
    userId: 'usr_sora',
    name: 'Sora Takahashi',
    username: 'sora_t',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'idle',
    customStatus: 'Auditing smart rollups 🛡️',
    mutualServersCount: 2,
  },
  {
    id: 'fr_kai',
    userId: 'usr_kai',
    name: 'Kai Thorne',
    username: 'kaithorne',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Patching Eurorack modular rack 🎛️',
    mutualServersCount: 2,
  },
  {
    id: 'fr_anya',
    userId: 'usr_anya',
    name: 'Anya Sharma',
    username: 'anyasharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'dnd',
    customStatus: 'Debugging distributed lock manager 🛑',
    mutualServersCount: 2,
  },
  {
    id: 'fr_nathan',
    userId: 'usr_nathan',
    name: 'Nathan Brooks',
    username: 'nate_brooks',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    customStatus: 'Away from keyboard',
    mutualServersCount: 1,
  }
];

export const MOCK_FRIEND_REQUESTS = [
  {
    id: 'req_chloe',
    userId: 'usr_chloe',
    name: 'Chloe Monet',
    username: 'chloe_m',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    type: 'incoming', // 'incoming' | 'outgoing'
    mutualServersCount: 1,
    time: '2 hours ago'
  },
  {
    id: 'req_devon',
    userId: 'usr_devon',
    name: 'Devon Cross',
    username: 'devon_c',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    type: 'outgoing',
    mutualServersCount: 2,
    time: 'Yesterday'
  }
];
