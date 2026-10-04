import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { MOCK_MESSAGES } from "../../data/mockMessages";
import { MOCK_DM_MESSAGES } from "../../data/mockDms";
import { createMessage, getMessages } from "../../services/message.service";

const STORAGE_KEY = "nexora_messages_state";

// const loadPersistedMessages = () => {
//   try {
//     const serialized = localStorage.getItem(STORAGE_KEY);
//     if (serialized) {
//       return JSON.parse(serialized);
//     }
//   } catch (err) {
//     console.error('Failed to load messages from localStorage:', err);
//   }
//   return {
//     ...MOCK_MESSAGES,
//     ...MOCK_DM_MESSAGES,
//   };
// };

// const initialState = {
//   messagesByContext: loadPersistedMessages(),
//   replyTarget: null, // message object or null
//   editingMessageId: null,
//   highlightedMessageId: null,
// };

// const saveMessages = (state) => {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messagesByContext));
//   } catch (e) {
//     console.error(e);
//   }
// };

const errorMessage = (error) =>
  error.response?.data?.message || "Unable to load messages";

export const fetchMessages = createAsyncThunk(
  "messages/fetch",
  async (channelId, { rejectWithValue }) => {
    try {
      return await getMessages(channelId);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const sendMessage = createAsyncThunk(
  "message/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createMessage(payload);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const messageSlice = createSlice({
  name: "messages",
  initialState: { messages: [], loading: false, error: null },
  reducers: {
    addMessage: (state, action) => {
      if (
        !state.messages.some(
          (message) =>
            (message._id || message.id) ===
            (action.payload._id || action, payload.id),
        )
      )
        state.messages.push(action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(
        (message) =>
          (message.id || message._id) === action.payload.id ||
          action.payload._id,
      );
      if (index !== -1)
        state.messages[index] = { ...state.messages[index], ...action.payload };
    },

    removeMessage: (state, action) => {
      state.messages = state.messages.filter(
        (message) =>
          (message._id || message.id) ===
          (action.payload._id || action.payload.id),
      );
    },

    //AI code
    // sendMessage: (state, action) => {
    //   const {
    //     contextId, // channelId or dmId
    //     content,
    //     author,
    //     replyTo = null,
    //     attachments = [],
    //   } = action.payload;

    //   if (!content.trim() && attachments.length === 0) return;

    //   const newMessage = {
    //     id: "msg_" + Date.now(),
    //     channelId: contextId,
    //     authorId: author.id,
    //     authorName: author.name,
    //     authorAvatar: author.avatar,
    //     authorRole: author.roles?.[0] || "Member",
    //     authorRoleColor: "#00F0FF",
    //     content,
    //     createdAt: new Date().toISOString(),
    //     isEdited: false,
    //     isPinned: false,
    //     reactions: [],
    //     replyTo: replyTo
    //       ? {
    //           id: replyTo.id,
    //           authorName: replyTo.authorName,
    //           content:
    //             replyTo.content.substring(0, 80) +
    //             (replyTo.content.length > 80 ? "..." : ""),
    //         }
    //       : null,
    //     attachments,
    //   };

    //   if (!state.messagesByContext[contextId]) {
    //     state.messagesByContext[contextId] = [];
    //   }
    //   state.messagesByContext[contextId].push(newMessage);
    //   state.replyTarget = null;
    //   saveMessages(state);
    // },
    // editMessage: (state, action) => {
    //   const { contextId, messageId, newContent } = action.payload;
    //   const list = state.messagesByContext[contextId];
    //   if (list) {
    //     const msg = list.find((m) => m.id === messageId);
    //     if (msg) {
    //       msg.content = newContent;
    //       msg.isEdited = true;
    //       saveMessages(state);
    //     }
    //   }
    //   state.editingMessageId = null;
    // },
    // deleteMessage: (state, action) => {
    //   const { contextId, messageId } = action.payload;
    //   if (state.messagesByContext[contextId]) {
    //     state.messagesByContext[contextId] = state.messagesByContext[
    //       contextId
    //     ].filter((m) => m.id !== messageId);
    //     saveMessages(state);
    //   }
    // },
    // toggleReaction: (state, action) => {
    //   const { contextId, messageId, emoji, userId } = action.payload;
    //   const list = state.messagesByContext[contextId];
    //   if (!list) return;

    //   const msg = list.find((m) => m.id === messageId);
    //   if (!msg) return;

    //   if (!msg.reactions) msg.reactions = [];

    //   const existingRxn = msg.reactions.find((r) => r.emoji === emoji);
    //   if (existingRxn) {
    //     if (existingRxn.users.includes(userId)) {
    //       // Remove user reaction
    //       existingRxn.users = existingRxn.users.filter((u) => u !== userId);
    //       existingRxn.count -= 1;
    //       if (existingRxn.count <= 0) {
    //         msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
    //       }
    //     } else {
    //       // Add user reaction
    //       existingRxn.users.push(userId);
    //       existingRxn.count += 1;
    //     }
    //   } else {
    //     // Create new reaction
    //     msg.reactions.push({
    //       emoji,
    //       count: 1,
    //       users: [userId],
    //     });
    //   }
    //   saveMessages(state);
    // },
    // togglePinMessage: (state, action) => {
    //   const { contextId, messageId } = action.payload;
    //   const list = state.messagesByContext[contextId];
    //   if (list) {
    //     const msg = list.find((m) => m.id === messageId);
    //     if (msg) {
    //       msg.isPinned = !msg.isPinned;
    //       saveMessages(state);
    //     }
    //   }
    // },
    // setReplyTarget: (state, action) => {
    //   state.replyTarget = action.payload;
    // },
    // clearReplyTarget: (state) => {
    //   state.replyTarget = null;
    // },
    // setEditingMessageId: (state, action) => {
    //   state.editingMessageId = action.payload;
    // },
    // setHighlightedMessageId: (state, action) => {
    //   state.highlightedMessageId = action.payload;
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload || [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  addMessage,
  updateMessage,
  removeMessage,
  //AI CODE
  // sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  togglePinMessage,
  setReplyTarget,
  clearReplyTarget,
  setEditingMessageId,
  setHighlightedMessageId,
} = messageSlice.actions;

export default messageSlice.reducer;
