import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getConversations,
  openOrCreateConversation,
  getConversationMessages,
  sendDirectMessage,
  deleteDirectMessage,
} from "../../services/conversation.service.js";

const getErrorMessage = (error) =>
  error.response?.data?.message || "Failed to process direct transmission";

export const fetchConversations = createAsyncThunk(
  "dms/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await getConversations();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const startConversation = createAsyncThunk(
  "dms/startConversation",
  async (recipientId, { rejectWithValue }) => {
    try {
      return await openOrCreateConversation(recipientId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDmMessages = createAsyncThunk(
  "dms/fetchDmMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await getConversationMessages(conversationId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const sendDm = createAsyncThunk(
  "dms/sendDm",
  async ({ conversationId, content, files }, { rejectWithValue }) => {
    try {
      let payload;
      if (files && files.length > 0) {
        payload = new FormData();
        payload.append("content", content || "");
        files.forEach((f) => payload.append("files", f));
      } else {
        payload = { content };
      }
      return await sendDirectMessage(conversationId, payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteDmMessage = createAsyncThunk(
  "dms/deleteDmMessage",
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await deleteDirectMessage({ conversationId, messageId });
      return messageId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  conversations: [],
  activeDmId: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  error: null,
};

export const dmSlice = createSlice({
  name: "dms",
  initialState,
  reducers: {
    selectDm: (state, action) => {
      state.activeDmId = action.payload ? String(action.payload) : null;
    },
    addConversation: (state, action) => {
      const conv = action.payload;
      if (!conv) return;
      const convId = String(conv._id || conv.id);
      const exists = state.conversations.some(
        (c) => String(c._id || c.id) === convId
      );
      if (!exists) {
        state.conversations.unshift(conv);
      }
    },
    addDmMessage: (state, action) => {
      const msg = action.payload;
      if (!msg) return;

      const msgId = String(msg._id || msg.id);
      const convId = String(msg.conversation_id?._id || msg.conversation_id || "");

      // Update conversation lastMessage
      const conv = state.conversations.find(
        (c) => String(c._id || c.id) === convId
      );
      if (conv) {
        conv.lastMessage = {
          content: msg.content || "Sent an attachment",
          sender: msg.author_id?._id || msg.author_id,
          createdAt: msg.createdAt,
        };
        conv.updatedAt = msg.createdAt;
      }

      // If active conversation matches, append message if not already present
      if (
        state.activeDmId &&
        String(state.activeDmId) === convId
      ) {
        const exists = state.messages.some(
          (m) => String(m._id || m.id) === msgId
        );
        if (!exists) {
          state.messages.push(msg);
        }
      }
    },
    removeDmMessage: (state, action) => {
      const deletedId = String(action.payload);
      state.messages = state.messages.filter(
        (m) => String(m._id || m.id) !== deletedId
      );
    },
    updateConversationLastMessage: (state, action) => {
      const { conversationId, lastMessage, conversation } = action.payload || {};
      const targetId = String(conversationId || conversation?._id || conversation?.id || "");
      const convIndex = state.conversations.findIndex(
        (c) => String(c._id || c.id) === targetId
      );
      if (convIndex !== -1) {
        if (lastMessage) {
          state.conversations[convIndex].lastMessage = lastMessage;
        }
        state.conversations[convIndex].updatedAt = lastMessage?.createdAt || new Date().toISOString();
      } else if (conversation) {
        state.conversations.unshift(conversation);
      }
    },
    clearDms: (state) => {
      state.conversations = [];
      state.activeDmId = null;
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload || [];
        if (!state.activeDmId && state.conversations.length > 0) {
          state.activeDmId = state.conversations[0]._id;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Start / Open Conversation
      .addCase(startConversation.fulfilled, (state, action) => {
        const conv = action.payload;
        if (!conv) return;

        const convId = conv._id || conv.id;
        const exists = state.conversations.some(
          (c) => (c._id || c.id) === convId
        );
        if (!exists) {
          state.conversations.unshift(conv);
        }
        state.activeDmId = convId;
      })

      // Fetch DM Messages
      .addCase(fetchDmMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchDmMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload || [];
      })
      .addCase(fetchDmMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
        state.messages = [];
      })

      // Send DM
      .addCase(sendDm.fulfilled, (state, action) => {
        const msg = action.payload;
        if (!msg) return;

        const msgId = msg._id || msg.id;
        const exists = state.messages.some(
          (m) => (m._id || m.id) === msgId
        );
        if (!exists) {
          state.messages.push(msg);
        }

        // Update conversation lastMessage
        const conv = state.conversations.find(
          (c) => (c._id || c.id) === (msg.conversation_id?._id || msg.conversation_id)
        );
        if (conv) {
          conv.lastMessage = {
            content: msg.content || "Sent an attachment",
            sender: msg.author_id?._id || msg.author_id,
            createdAt: msg.createdAt,
          };
        }
      })

      // Delete DM
      .addCase(deleteDmMessage.fulfilled, (state, action) => {
        const deletedId = String(action.payload);
        state.messages = state.messages.filter(
          (m) => String(m._id || m.id) !== deletedId
        );
      });
  },
});

export const {
  selectDm,
  addConversation,
  addDmMessage,
  removeDmMessage,
  updateConversationLastMessage,
  clearDms,
} = dmSlice.actions;

export const openOrCreateDm = createAsyncThunk(
  "dms/openOrCreateDm",
  async (target, { dispatch, rejectWithValue }) => {
    try {
      const recipientId =
        typeof target === "string"
          ? target
          : target?._id || target?.id || target?.userId;
      if (!recipientId) throw new Error("Recipient ID is required");
      return await dispatch(startConversation(recipientId)).unwrap();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export default dmSlice.reducer;
