import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createServer,
  getServers,
  getServer,
  joinServer,
  leaveServer,
  updateServer,
  deleteServer,
  createInvite,
  getServerMembers,
  getInviteDetails,
} from "../../services/server.service.js";

const getErrorMessage = (error) => {
  return error.response?.data?.message || "Something went wrong";
};

export const fetchServerMembers = createAsyncThunk(
  "server/fetchServerMembers",
  async (serverId, { rejectWithValue }) => {
    try {
      return await getServerMembers(serverId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

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

export const leaveServerAsync = createAsyncThunk(
  "server/leaveServer",
  async (serverId, { rejectWithValue }) => {
    try {
      await leaveServer(serverId);
      return serverId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateServerAsync = createAsyncThunk(
  "server/updateServer",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateServer(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteServerAsync = createAsyncThunk(
  "server/deleteServer",
  async (serverId, { rejectWithValue }) => {
    try {
      await deleteServer(serverId);
      return serverId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const resolveInviteAsync = createAsyncThunk(
  "server/resolveInvite",
  async (inviteCode, { rejectWithValue }) => {
    try {
      return await getInviteDetails(inviteCode.trim());
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const regenerateInvite = createAsyncThunk(
  "server/regenerateInvite",
  async (serverId, { rejectWithValue }) => {
    try {
      return await createInvite(serverId, { regenerate: true });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  servers: [],
  selectedServer: null,
  members: [],
  loading: false,
  error: null,
};

const serverSlice = createSlice({
  name: "server",

  initialState,

  reducers: {
    selectServer: (state, action) => {
      const targetId = action.payload?._id || action.payload?.id || action.payload;
      const server =
        state.servers.find(
          (item) => String(item._id || item.id) === String(targetId),
        ) || (typeof action.payload === "object" && action.payload ? action.payload : null);

      if (state.selectedServer?._id !== server?._id) {
        state.members = [];
      }
      state.selectedServer = server || null;
    },

    clearServerError: (state) => {
      state.error = null;
    },

    clearSelectedServer: (state) => {
      state.selectedServer = null;
      state.members = [];
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

        if (state.selectedServer) {
          const currentId = state.selectedServer._id || state.selectedServer.id;
          const matched = state.servers.find(
            (s) => String(s._id || s.id) === String(currentId),
          );
          if (matched) {
            state.selectedServer = matched;
          }
        } else if (state.servers.length > 0) {
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
        const joined = action.payload;
        if (joined) {
          const exists = state.servers.some(
            (s) => String(s._id || s.id) === String(joined._id || joined.id)
          );
          if (!exists) {
            state.servers.push(joined);
          }
          state.selectedServer = joined;
        }
        state.error = null;
      })

      .addCase(joinServerAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // REGENERATE INVITE
      .addCase(regenerateInvite.fulfilled, (state, action) => {
        const newCode = action.payload?.inviteCode;
        if (newCode) {
          if (state.selectedServer) {
            state.selectedServer.inviteCode = newCode;
          }
          const sId = action.meta?.arg;
          if (sId) {
            const server = state.servers.find(
              (s) => String(s._id || s.id) === String(sId),
            );
            if (server) {
              server.inviteCode = newCode;
            }
          }
        }
      })

      // LEAVE SERVER
      .addCase(leaveServerAsync.fulfilled, (state, action) => {
        state.servers = state.servers.filter(
          (s) => (s._id || s.id) !== action.payload,
        );
        if ((state.selectedServer?._id || state.selectedServer?.id) === action.payload) {
          state.selectedServer = state.servers[0] || null;
        }
      })

      // DELETE SERVER
      .addCase(deleteServerAsync.fulfilled, (state, action) => {
        state.servers = state.servers.filter(
          (s) => (s._id || s.id) !== action.payload,
        );
        if ((state.selectedServer?._id || state.selectedServer?.id) === action.payload) {
          state.selectedServer = state.servers[0] || null;
        }
      })

      // UPDATE SERVER
      .addCase(updateServerAsync.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.servers.findIndex(
            (s) => (s._id || s.id) === (action.payload._id || action.payload.id),
          );
          if (index !== -1) {
            state.servers[index] = action.payload;
          }
          if ((state.selectedServer?._id || state.selectedServer?.id) === (action.payload._id || action.payload.id)) {
            state.selectedServer = action.payload;
          }
        }
      })

      // FETCH SERVER MEMBERS
      .addCase(fetchServerMembers.fulfilled, (state, action) => {
        state.members = action.payload || [];
      });
  },
});

export const { selectServer, clearServerError, clearSelectedServer } =
  serverSlice.actions;

// Aliases for component compatibility
export {
  leaveServerAsync as leaveServer,
  deleteServerAsync as deleteServer,
  updateServerAsync as updateServer,
};

export default serverSlice.reducer;
