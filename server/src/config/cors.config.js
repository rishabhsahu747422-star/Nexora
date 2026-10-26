import dotenv from "dotenv";
dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = [
  "https://nexora-umber-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

/**
 * Normalizes an origin or URL string:
 * - Trims whitespace
 * - Extracts scheme + host + port (stripping path, trailing slash, queries)
 */
export const normalizeOrigin = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

/**
 * Retrieves the complete set of normalized allowed origins,
 * combining defaults with any environment-provided origins.
 */
export const getAllowedOrigins = () => {
  const envCandidates = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.ALLOWED_ORIGINS,
  ];

  const envOrigins = envCandidates
    .filter(Boolean)
    .flatMap((val) => val.split(","))
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  const normalizedDefaults = DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin);

  return Array.from(new Set([...normalizedDefaults, ...envOrigins]));
};

/**
 * Checks whether an incoming request origin is allowed.
 * Allows requests with no origin (e.g. curl, postman, mobile apps, same-origin).
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalizedIncoming = normalizeOrigin(origin);
  const allowedList = getAllowedOrigins();
  return allowedList.includes(normalizedIncoming);
};

/**
 * Express CORS Middleware Options
 */
export const expressCorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
  ],
};

/**
 * Socket.IO CORS Options
 */
export const socketCorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
  ],
};
