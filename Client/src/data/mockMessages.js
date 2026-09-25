export const MOCK_MESSAGES = {
  // Transmissions General in Synthetix AI Lab
  'chn_syn_gen': [
    {
      id: 'msg_syn_01',
      channelId: 'chn_syn_gen',
      authorId: 'usr_elena',
      authorName: 'Miss Somvi Bhairam',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Founding Scientist',
      authorRoleColor: '#00F0FF',
      content: 'Good morning everyone! We just finished the evaluation runs for the Neuro-Symbolic Agent Swarm v4.2. Latency dropped by 34% with zero regression in logic puzzles! 🚀',
      createdAt: '2024-05-18T09:15:00Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '🔥', count: 7, users: ['usr_me', 'usr_liam', 'usr_alex', 'usr_maya'] },
        { emoji: '🧠', count: 5, users: ['usr_me', 'usr_anya'] },
        { emoji: '🚀', count: 8, users: ['usr_devon', 'usr_liam'] }
      ],
      replyTo: null,
      attachments: []
    },
    {
      id: 'msg_syn_02',
      channelId: 'chn_syn_gen',
      authorId: 'usr_liam',
      authorName: 'Om Verma',
      authorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Core Researcher',
      authorRoleColor: '#8B5CF6',
      content: '@elena_ai That is massive! Did the multi-hop reasoning hold up on the GSM8k benchmarks without self-consistency sampling?',
      createdAt: '2024-05-18T09:18:20Z',
      isEdited: false,
      isPinned: false,
      reactions: [
        { emoji: '👍', count: 3, users: ['usr_elena', 'usr_me'] }
      ],
      replyTo: {
        id: 'msg_syn_01',
        authorName: 'Om Verma',
        content: 'Good morning everyone! We just finished the evaluation runs for the Neuro-Symbolic Agent Swarm v4.2...'
      },
      attachments: []
    },
    {
      id: 'msg_syn_03',
      channelId: 'chn_syn_gen',
      authorId: 'usr_elena',
      authorName: 'Reetika Dhaneshwar',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Founding Scientist',
      authorRoleColor: '#00F0FF',
      content: 'Yes! It hit 94.8% on single-pass execution. Here is the architecture diagram showing how the memory tree caches intermediate theorem proofs.',
      createdAt: '2024-05-18T09:22:15Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '❤️', count: 6, users: ['usr_liam', 'usr_me', 'usr_maya'] }
      ],
      replyTo: null,
      attachments: [
        {
          id: 'att_syn_1',
          name: 'neuro-symbolic-architecture-v4.png',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          size: '2.4 MB'
        }
      ]
    },
    {
      id: 'msg_syn_04',
      channelId: 'chn_syn_gen',
      authorId: 'usr_me',
      authorName: 'Rishan Dev',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Founding Architect',
      authorRoleColor: '#00F0FF',
      content: 'Phenomenal work @elena_ai. I can connect this into the Nexora distributed event bus so agent status pulses stream directly into our collaboration channels.',
      createdAt: '2024-05-18T09:30:00Z',
      isEdited: true,
      isPinned: false,
      reactions: [
        { emoji: '🙌', count: 4, users: ['usr_elena', 'usr_liam', 'usr_alex'] }
      ],
      replyTo: null,
      attachments: []
    },
    {
      id: 'msg_syn_05',
      channelId: 'chn_syn_gen',
      authorId: 'usr_maya',
      authorName: 'Maya Lin',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Design Lead',
      authorRoleColor: '#EC4899',
      content: 'I already prepared the telemetry widgets for the agent dashboard! Dropping the specs PDF right here:',
      createdAt: '2024-05-18T09:42:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [
        { emoji: '✨', count: 3, users: ['usr_me', 'usr_elena'] }
      ],
      replyTo: null,
      attachments: [
        {
          id: 'att_syn_doc',
          name: 'Agent_Telemetry_UI_Specs_v2.pdf',
          type: 'document',
          size: '4.8 MB',
          ext: 'PDF'
        }
      ]
    }
  ],

  // Research Dispatches in Synthetix
  'chn_syn_dispatch': [
    {
      id: 'msg_syn_ann_1',
      channelId: 'chn_syn_dispatch',
      authorId: 'usr_elena',
      authorName: 'Dr. Elena Rostova',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Founding Scientist',
      authorRoleColor: '#00F0FF',
      content: '📢 [DISPATCH 089] Synthetix Swarm v4.2 weights and benchmark datasets have been officially released to community partners. Review the whitepaper and cryptographic validation hashes.',
      createdAt: '2024-05-17T14:00:00Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '🎉', count: 18, users: ['usr_me', 'usr_liam', 'usr_alex', 'usr_maya', 'usr_anya'] },
        { emoji: '🚀', count: 12, users: ['usr_me', 'usr_devon'] }
      ],
      replyTo: null,
      attachments: []
    }
  ],

  // CyberSphere Studio Lounge
  'chn_cs_gen': [
    {
      id: 'msg_cs_01',
      channelId: 'chn_cs_gen',
      authorId: 'usr_marcus',
      authorName: 'Marcus Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Studio Director',
      authorRoleColor: '#F59E0B',
      content: 'Hey team! The new procedural voxel biomes are now running at locked 120 FPS on RTX 4070. Check out the volumetric fog illumination in the canyon pass.',
      createdAt: '2024-05-18T10:00:00Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '🎮', count: 9, users: ['usr_me', 'usr_zack', 'usr_kai'] },
        { emoji: '🔥', count: 7, users: ['usr_me', 'usr_maya'] }
      ],
      replyTo: null,
      attachments: [
        {
          id: 'att_cs_1',
          name: 'canyon-pass-volumetric-preview.jpg',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
          size: '3.1 MB'
        }
      ]
    },
    {
      id: 'msg_cs_02',
      channelId: 'chn_cs_gen',
      authorId: 'usr_kai',
      authorName: 'Kai Thorne',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Audio Lead',
      authorRoleColor: '#00F0FF',
      content: '@marcus_v Just finished baking the 3D ambisonics impulse response for the canyon! When you walk near the basalt pillars, the wind resonates through the rock hollows in real-time.',
      createdAt: '2024-05-18T10:14:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [
        { emoji: '🔊', count: 5, users: ['usr_marcus', 'usr_me', 'usr_zack'] }
      ],
      replyTo: null,
      attachments: []
    }
  ],

  // Vanguard Protocol General
  'chn_vn_gen': [
    {
      id: 'msg_vn_01',
      channelId: 'chn_vn_gen',
      authorId: 'usr_sora',
      authorName: 'Sora Takahashi',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Core Protocol',
      authorRoleColor: '#00F0FF',
      content: 'Security audit complete for the recursive SNARK rollup verifier. Zero critical vulnerabilities found by Trail of Bits. Audit summary committed to repo.',
      createdAt: '2024-05-18T11:00:00Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '🛡️', count: 14, users: ['usr_me', 'usr_nathan', 'usr_tara'] },
        { emoji: '🥂', count: 8, users: ['usr_me', 'usr_sora'] }
      ],
      replyTo: null,
      attachments: []
    }
  ],

  // Echo Soundworks Frequency Commons
  'chn_ec_gen': [
    {
      id: 'msg_ec_01',
      channelId: 'chn_ec_gen',
      authorId: 'usr_kai',
      authorName: 'Kai Thorne',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Sound Architect',
      authorRoleColor: '#00F0FF',
      content: 'Welcome sound designers! Tonight we are doing an open spatial listening session in the voice stage. Bring your cleanest binaural stems!',
      createdAt: '2024-05-18T12:00:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [
        { emoji: '🎧', count: 6, users: ['usr_me', 'usr_chloe'] }
      ],
      replyTo: null,
      attachments: []
    }
  ],

  // Quantum Systems Kernel
  'chn_qt_gen': [
    {
      id: 'msg_qt_01',
      channelId: 'chn_qt_gen',
      authorId: 'usr_anya',
      authorName: 'Anya Sharma',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Principal Architect',
      authorRoleColor: '#00F0FF',
      content: 'The new zero-copy ring buffer benchmark results: 12.8 million messages/sec per thread core with under 85 nanoseconds p99 latency. Code is in `quantum-ring/crates/core`.',
      createdAt: '2024-05-18T08:30:00Z',
      isEdited: false,
      isPinned: true,
      reactions: [
        { emoji: '⚡', count: 16, users: ['usr_me', 'usr_devon', 'usr_sophia', 'usr_oscar'] },
        { emoji: '🦀', count: 11, users: ['usr_me', 'usr_devon'] }
      ],
      replyTo: null,
      attachments: []
    },
    {
      id: 'msg_qt_02',
      channelId: 'chn_qt_gen',
      authorId: 'usr_devon',
      authorName: 'Devon Cross',
      authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Kernel Engineer',
      authorRoleColor: '#3B82F6',
      content: 'Verified on AMD EPYC 9654. L3 cache miss rate is basically zero now thanks to the cacheline padding alignment.',
      createdAt: '2024-05-18T08:45:00Z',
      isEdited: false,
      isPinned: false,
      reactions: [
        { emoji: '🚀', count: 5, users: ['usr_anya', 'usr_me'] }
      ],
      replyTo: {
        id: 'msg_qt_01',
        authorName: 'Anya Sharma',
        content: 'The new zero-copy ring buffer benchmark results: 12.8 million messages/sec...'
      },
      attachments: []
    }
  ]
};
