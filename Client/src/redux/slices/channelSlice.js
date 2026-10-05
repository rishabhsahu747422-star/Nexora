import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getChannels, createChannel } from "../../services/channel.service.js";

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
      });
  },
});

export const { selectChannel, clearChannels, clearChannelError } =
  channelSlice.actions;

export default channelSlice.reducer;
