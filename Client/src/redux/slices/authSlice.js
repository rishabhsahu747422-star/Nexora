import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
} from "../../services/auth.service.js";

const responseData = (response) => response?.data ?? response?.user ?? response;

export const loginUserAsync = createAsyncThunk(
  "/auth/login",
  async (data, { rejectWithValue }) => {
    try {
      return await loginUser(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "unable to sign in",
      );
    }
  },
);

export const registerUserAsync = createAsyncThunk(
  "/auth/register",
  async (data, { rejectWithValue }) => {
    try {
      return await registerUser(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to create your account",
      );
    }
  },
);

export const getMeAsync = createAsyncThunk(
  "/auth/me",
  async (_, { rejectWithValue }) => {
    try {
      return await getMe();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "your session has expired",
      );
    }
  },
);

export const logoutUserAsync = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      return await logoutUser();
    } catch (error) {
      return (
        rejectWithValue(error.response?.data?.message) || "Unable to sign out"
      );
    }
  },
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUserAsync.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.isAuthenticated = true;
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        ((state.user = null),
          (state.isAuthenticated = false),
          (state.loading = false));
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(getMeAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMeAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        ((state.isAuthenticated = true), (state.error = null));
        state.loading = false;
      })
      .addCase(getMeAsync.rejected, (state, action) => {
        state.user = null;
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.isAuthenticated = false;
      });
    builder
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
    builder
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(logoutUserAsync.pending, (state) => {
        state.loading = true;
      });
  },
});

export const { clearUser } = authSlice.actions;

export default authSlice.reducer;
