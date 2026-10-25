import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
} from "../../services/channel.service.js";

const getErrorMessage = (error) => {
  return error.response?.data?.message || "Unable to load channels";
};

export const fetchChannels = createAsyncThunk(
  "channels/fetchChannels",
  async (serverId, { rejectWithValue }) => {
    try {
      return await getChannels(serverId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createChannelAsync = createAsyncThunk(
  "channels/createChannel",
  async (payload, { rejectWithValue }) => {
    try {
      return await createChannel(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateChannelAsync = createAsyncThunk(
  "channels/updateChannel",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateChannel(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteChannelAsync = createAsyncThunk(
  "channels/deleteChannel",
  async (payload, { rejectWithValue }) => {
    try {
      await deleteChannel(payload);
      return payload.channelId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  channels: [],
  selectedChannel: null,
  loading: false,
  error: null,
};

const channelSlice = createSlice({
  name: "channels",

  initialState,

  reducers: {
    selectChannel: (state, action) => {
      const channel = state.channels.find(
        (item) => item._id === action.payload || item.id === action.payload,
      );

      state.selectedChannel = channel || null;
    },

    clearChannels: (state) => {
      state.channels = [];
      state.selectedChannel = null;
      state.error = null;
    },

    clearChannelError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH CHANNELS
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload || [];

        state.selectedChannel = state.channels[0] || null;
      })

      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.channels = [];
        state.selectedChannel = null;
      })

      // CREATE CHANNEL
      .addCase(createChannelAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createChannelAsync.fulfilled, (state, action) => {
        state.loading = false;

        state.channels.push(action.payload);

        state.selectedChannel = action.payload;
      })

      .addCase(createChannelAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE CHANNEL
      .addCase(updateChannelAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        if (!updated) return;
        state.channels = state.channels.map((ch) =>
          (ch._id === updated._id || ch.id === updated._id) ? updated : ch
        );
        if (state.selectedChannel?._id === updated._id || state.selectedChannel?.id === updated._id) {
          state.selectedChannel = updated;
        }
      })

      // DELETE CHANNEL
      .addCase(deleteChannelAsync.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.channels = state.channels.filter(
          (ch) => ch._id !== deletedId && ch.id !== deletedId
        );
        if (state.selectedChannel?._id === deletedId || state.selectedChannel?.id === deletedId) {
          state.selectedChannel = state.channels[0] || null;
        }
      });
  },
});

export const { selectChannel, clearChannels, clearChannelError } =
  channelSlice.actions;

export default channelSlice.reducer;
