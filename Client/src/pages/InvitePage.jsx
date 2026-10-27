import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";
import CommunityAvatar from "../components/common/CommunityAvatar";
import Button from "../components/common/Button";
import {
  resolveInviteAsync,
  joinServerAsync,
  selectServer,
} from "../redux/slices/serverSlice";
import { addToast } from "../redux/slices/uiSlice";

export default function InvitePage() {
  const { inviteCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const myServers = useSelector((state) => state.server.servers || []);

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!inviteCode) {
      setError("No invite code provided");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    dispatch(resolveInviteAsync(inviteCode))
      .unwrap()
      .then((data) => {
        if (isMounted) {
          setInviteData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(typeof err === "string" ? err : "Invalid or expired invite token");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [inviteCode, dispatch]);

  const isAlreadyMember = Boolean(
    inviteData &&
      (inviteData.isMember ||
        myServers.some(
          (s) => String(s._id || s.id) === String(inviteData._id || inviteData.id)
        ))
  );

  const handleJoin = async () => {
    if (!inviteCode || isJoining) return;
    setIsJoining(true);

    try {
      const joinedServer = await dispatch(joinServerAsync(inviteCode)).unwrap();
      const sId = joinedServer?._id || joinedServer?.id || inviteData?._id;

      dispatch(
        addToast({
          type: "success",
          message: isAlreadyMember
            ? `Entering ${inviteData?.name || "community"}...`
            : `Joined ${joinedServer?.name || inviteData?.name || "community"}!`,
        })
      );

      dispatch(selectServer(joinedServer || inviteData));
      navigate(`/app/server/${sId}`);
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: typeof err === "string" ? err : "Failed to join community",
        })
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--workspace-bg, #0B0E14)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient grid/glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--accent)] opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md bg-[var(--surface-primary, #11141C)] border border-[var(--border-subtle, rgba(255,255,255,0.08))] rounded-3xl p-7 shadow-2xl shadow-black/80 backdrop-blur-xl"
      >
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
            <p className="text-xs font-mono text-slate-400">
              Decrypting collective invite transmission...
            </p>
          </div>
        ) : error ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Transmission Link Invalid
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs font-mono">
                {error}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(isAuthenticated ? "/app" : "/login")}
              className="w-full mt-2"
            >
              Return to Safe Terminal
            </Button>
          </div>
        ) : inviteData ? (
          <div className="flex flex-col items-center text-center space-y-5">
            {/* Community Avatar & Badges */}
            <div className="relative">
              <CommunityAvatar
                src={inviteData.icon}
                name={inviteData.name}
                size="xl"
                shape="rounded-2xl"
                className="ring-4 ring-white/5 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 bg-[var(--surface-elevated)] p-1.5 rounded-full border border-white/10 text-[var(--accent)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--accent-border)]">
                Collective Invitation
              </span>
              <h2 className="font-display font-bold text-xl text-white tracking-tight">
                {inviteData.name}
              </h2>
              {inviteData.description && (
                <p className="text-xs text-slate-400 max-w-sm line-clamp-3 leading-relaxed">
                  {inviteData.description}
                </p>
              )}
            </div>

            {/* Member Stats */}
            <div className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl py-2.5 px-4 flex items-center justify-around font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>
                  <strong className="text-white font-semibold">
                    {inviteData.memberCount || 1}
                  </strong>{" "}
                  Operatives
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Link
              </div>
            </div>

            {/* Action Buttons */}
            {isAuthenticated ? (
              <div className="w-full space-y-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full justify-center py-3 text-sm font-semibold"
                  onClick={handleJoin}
                  loading={isJoining}
                  icon={ArrowRight}
                >
                  {isAlreadyMember
                    ? "Enter Community Workspace"
                    : "Accept Transmission & Join"}
                </Button>
                {isAlreadyMember && (
                  <p className="text-[11px] font-mono text-slate-400 text-center">
                    You are already registered in this collective.
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  className="w-full justify-center py-3 text-sm font-semibold"
                  onClick={() => navigate(`/login?redirect=/invite/${inviteCode}`)}
                  icon={LogIn}
                >
                  Log In to Accept Invite
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-center py-2.5 text-xs"
                  onClick={() => navigate(`/register?redirect=/invite/${inviteCode}`)}
                  icon={UserPlus}
                >
                  Create New Account
                </Button>
                <p className="text-[11px] text-slate-500 font-mono">
                  Authentication required to verify identity clearance.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
