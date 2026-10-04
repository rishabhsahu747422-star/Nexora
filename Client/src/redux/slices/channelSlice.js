import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { MOCK_CHANNELS } from "../../data/mockChannels";
import { getChannels, createChannel } from "../../services/channel.server";

const STORAGE_KEY = "nexora_channels_state";

// const loadPersistedChannels = () => {
//   try {
//     const serialized = localStorage.getItem(STORAGE_KEY);
//     if (serialized) {
//       return JSON.parse(serialized);
//     }
//   } catch (err) {
//     console.error('Failed to load channels from localStorage:', err);
//   }
//   return {
//     channels: MOCK_CHANNELS,
//     activeChannelId: 'chn_syn_gen',
//   };
// };

// const initialState = loadPersistedChannels();

const errorMessage = (error) =>
  error.response?.data?.message || "Unable to load channel";

export const fetchChannels = createAsyncThunk(
  "channels/fetch",
  async (serverId, { rejectWithValue }) => {
    try {
      return await getChannels(serverId);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createChannelAsync = createAsyncThunk(
  "channel/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createChannel(payload);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const channelSlice = createSlice({
  name: "channels",
  initialState: {
    channels: [],
    selectedChannel: null,
    loading: false,
    error: null,
  },
  reducers: {
    selectChannel: (state, action) => {
      state.selectedChannel =
        state.channels.find(
          (channel) => (channel._id || channel.id) === action.payload,
        ) || action.payload;
    },
    addChannel: (state, action) => {
      state.channels.push(action.payload);
    },

    //AI COde
    // createChannel: (state, action) => {
    //   const {
    //     serverId,
    //     name,
    //     type = "text",
    //     topic = "",
    //     isPrivate = false,
    //   } = action.payload;
    //   let category = "Transmissions";
    //   if (type === "announcement") category = "Broadcasting";
    //   if (type === "voice") category = "Nexus Audio";

    //   const newChannel = {
    //     id: "chn_" + Date.now(),
    //     serverId,
    //     name: name.toLowerCase().replace(/\s+/g, "-"),
    //     type,
    //     topic,
    //     category,
    //     isPrivate,
    //     unread: false,
    //     activeParticipants: type === "voice" ? [] : undefined,
    //     createdAt: new Date().toISOString(),
    //   };
    //   state.channels.push(newChannel);
    //   state.activeChannelId = newChannel.id;
    //   try {
    //     localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    //   } catch (e) {
    //     console.error(e);
    //   }
    // },
    // updateChannel: (state, action) => {
    //   const { id, data } = action.payload;
    //   const index = state.channels.findIndex((c) => c.id === id);
    //   if (index !== -1) {
    //     state.channels[index] = { ...state.channels[index], ...data };
    //     try {
    //       localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    //     } catch (e) {
    //       console.error(e);
    //     }
    //   }
    // },
    // deleteChannel: (state, action) => {
    //   const id = action.payload;
    //   state.channels = state.channels.filter((c) => c.id !== id);
    //   if (state.activeChannelId === id) {
    //     const remaining = state.channels.filter(
    //       (c) => c.serverId === state.channels[0]?.serverId,
    //     );
    //     state.activeChannelId = remaining[0]?.id || null;
    //   }
    //   try {
    //     localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    //   } catch (e) {
    //     console.error(e);
    //   }
    // },
    // markChannelRead: (state, action) => {
    //   const id = action.payload;
    //   const channel = state.channels.find((c) => c.id === id);
    //   if (channel) {
    //     channel.unread = false;
    //     try {
    //       localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    //     } catch (e) {
    //       console.error(e);
    //     }
    //   }
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        ((state.loading = false),
          (state.channels = action),
          payload || [],
          (state.selectedChannel = state.channels[0] || null));
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        ((state.loading = false), (state.error = action.payload));
      })
      .addCase(createChannelAsync.fulfilled, (state, action) => {
        state.channels.push(action.payload);
        state.selectedChannel = action.payload;
      })
      .addCase(createChannelAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  selectChannel,
  addChannel,
  //Ai Code
  createChannel,
  updateChannel,
  deleteChannel,
  markChannelRead,
} = channelSlice.actions;

export default channelSlice.reducer;
