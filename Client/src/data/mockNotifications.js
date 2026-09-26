export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: 'mention', // 'mention' | 'reply' | 'friend_request' | 'invite' | 'system'
    title: 'Mentioned in #transmissions-general',
    message: 'Somvi Bhairam mentioned you in Synthetix AI Lab: "Phenomenal work @rishandev..."',
    timestamp: '15m ago',
    read: false,
    link: '/app/server/srv_synthetix/channel/chn_syn_gen',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    meta: { serverId: 'srv_synthetix', channelId: 'chn_syn_gen' }
  },
  {
    id: 'notif_2',
    type: 'reply',
    title: 'Reply to your transmission',
    message: 'Om Verma replied: "Did the multi-hop reasoning hold up on the GSM8k benchmarks?"',
    timestamp: '1h ago',
    read: false,
    link: '/app/server/srv_synthetix/channel/chn_syn_gen',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    meta: { serverId: 'srv_synthetix', channelId: 'chn_syn_gen' }
  },
  {
    id: 'notif_3',
    type: 'friend_request',
    title: 'Incoming Friend Request',
    message: 'Sneha Purwar sent you a connection request.',
    timestamp: '2h ago',
    read: false,
    link: '/app/messages',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    meta: { requestId: 'req_chloe' }
  },
  {
    id: 'notif_4',
    type: 'invite',
    title: 'Community Invite',
    message: 'You were invited to join "Echo Soundworks" by Kai Thorne.',
    timestamp: 'Yesterday',
    read: true,
    link: '/app/server/srv_echo/channel/chn_ec_gen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    meta: { serverId: 'srv_echo' }
  },
  {
    id: 'notif_5',
    type: 'system',
    title: 'Nexora Core v2.4 Active',
    message: 'Ultra-low latency audio codecs and zero-latency state sync are now running on all nodes.',
    timestamp: '2 days ago',
    read: true,
    link: '/app/settings',
    avatar: null,
    meta: {}
  }
];
