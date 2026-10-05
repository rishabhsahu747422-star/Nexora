import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createServer,
  getServers,
  getServer,
  joinServer,
} from "../../services/server.service.js";

const getErrorMessage = (error) => {
  return error.response?.data?.message || "Something went wrong";
};

export const fetchServers = createAsyncThunk(
  "server/fetchServers",
  async (_, { rejectWithValue }) => {
    try {
      return await getServers();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchServer = createAsyncThunk(
  "server/fetchServer",
  async (serverId, { rejectWithValue }) => {
    try {
      return await getServer(serverId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createServerAsync = createAsyncThunk(
  "server/createServer",
  async (formData, { rejectWithValue }) => {
    try {
      return await createServer(formData);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const joinServerAsync = createAsyncThunk(
  "server/joinServer",
  async (inviteCode, { rejectWithValue }) => {
    try {
      return await joinServer(inviteCode.trim());
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  servers: [],
  selectedServer: null,
  loading: false,
  error: null,
};

const serverSlice = createSlice({
  name: "server",

  initialState,

  reducers: {
    selectServer: (state, action) => {
      const server = state.servers.find(
        (item) => item._id === action.payload || item.id === action.payload,
      );

      state.selectedServer = server || null;
    },

    clearServerError: (state) => {
      state.error = null;
    },

    clearSelectedServer: (state) => {
      state.selectedServer = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH SERVERS
      .addCase(fetchServers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchServers.fulfilled, (state, action) => {
        state.loading = false;
        state.servers = action.payload || [];

        if (!state.selectedServer && state.servers.length > 0) {
          state.selectedServer = state.servers[0];
        }
      })

      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE SERVER
      .addCase(fetchServer.fulfilled, (state, action) => {
        state.selectedServer = action.payload;
      })

      .addCase(fetchServer.rejected, (state, action) => {
        state.error = action.payload;
      })

      // CREATE SERVER
      .addCase(createServerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createServerAsync.fulfilled, (state, action) => {
        state.loading = false;

        state.servers.push(action.payload);
        state.selectedServer = action.payload;
      })

      .addCase(createServerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // JOIN SERVER
      .addCase(joinServerAsync.fulfilled, (state, action) => {
        state.servers.push(action.payload);
        state.selectedServer = action.payload;
        state.error = null;
      })

      .addCase(joinServerAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { selectServer, clearServerError, clearSelectedServer } =
  serverSlice.actions;

export default serverSlice.reducer;
