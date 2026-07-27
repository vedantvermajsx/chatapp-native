import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import { ensureSocket } from '../events/chatSocketEvents';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

// Public STUN only -- works for most networks. For users behind symmetric
// NATs / restrictive firewalls (mobile carrier NAT, some corporate wifi)
// this will fail to connect; add a TURN server (e.g. Twilio, coturn) here
// for production reliability.
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const RING_TIMEOUT_MS = 30000;

export function CallProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [isVideo, setIsVideo] = useState(false);
  const [peer, setPeer] = useState(null); // { id, username, avatar } of the other party
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const callIdRef = useRef(null);
  const localStreamRef = useRef(null);
  // Socket handlers are registered once per user/callState change and would
  // otherwise close over stale versions of endCall/declineCall (which change
  // identity whenever `peer` changes). Route through a ref so handlers
  // always invoke the current implementation.
  const liveRef = useRef({});

  // ---- socket wiring ----
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let socket;
    const handlers = {};

    (async () => {
      socket = await ensureSocket(user);
      if (!mounted) return;
      socketRef.current = socket;

      handlers['call:invite'] = ({ callId, from, isVideo: video, sdp }) => {
        // Already on a call -> auto-busy
        if (callState !== 'idle') {
          socket.emit('call:busy', { to: from.id, callId });
          return;
        }
        callIdRef.current = callId;
        pendingOfferRef.current = sdp;
        setPeer(from);
        setIsVideo(!!video);
        setCallState('incoming');
        ringTimeoutRef.current = setTimeout(() => {
          _cleanup();
          setCallState('idle');
        }, RING_TIMEOUT_MS);
      };

      handlers['call:answer'] = async ({ callId, sdp }) => {
        if (callId !== callIdRef.current || !pcRef.current) return;
        clearTimeout(ringTimeoutRef.current);
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          _flushPendingCandidates();
          setCallState('connected');
        } catch (e) {
          setError('Failed to connect call');
          liveRef.current.endCall?.();
        }
      };

      handlers['call:ice-candidate'] = ({ callId, candidate }) => {
        if (callId !== callIdRef.current || !candidate) return;
        if (pcRef.current?.remoteDescription) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      };

      handlers['call:decline'] = ({ callId }) => {
        if (callId !== callIdRef.current) return;
        _cleanup();
        setCallState('idle');
      };

      handlers['call:busy'] = ({ callId }) => {
        if (callId !== callIdRef.current) return;
        setError('User is busy');
        _cleanup();
        setCallState('idle');
      };

      handlers['call:end'] = ({ callId }) => {
        if (callId !== callIdRef.current) return;
        _cleanup();
        setCallState('idle');
      };

      Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));
    })();

    return () => {
      mounted = false;
      if (socket) Object.entries(handlers).forEach(([ev, fn]) => socket.off(ev, fn));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id || user?.id, callState]);

  const _flushPendingCandidates = () => {
    if (!pcRef.current) return;
    pendingCandidatesRef.current.forEach((c) => {
      pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    });
    pendingCandidatesRef.current = [];
  };

  const _createPeerConnection = useCallback((targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('call:ice-candidate', {
          to: targetId,
          callId: callIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.iceConnectionState)) {
        if (pc.iceConnectionState === 'failed') {
          setError('Call connection lost');
          liveRef.current.endCall?.();
        }
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) setRemoteStream(e.streams[0]);
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const _getLocalStream = async (video) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: video
        ? { facingMode: 'user', width: 640, height: 480 }
        : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const _cleanup = () => {
    clearTimeout(ringTimeoutRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pendingCandidatesRef.current = [];
    callIdRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setPeer(null);
  };

  // ---- public API ----

  const startCall = useCallback(async (targetUser, video) => {
    if (!targetUser?.id && !targetUser?._id) return;
    const targetId = targetUser.id || targetUser._id;
    setError(null);
    setIsVideo(!!video);
    setPeer(targetUser);
    setCallState('outgoing');
    callIdRef.current = `${(user?._id || user?.id)}-${Date.now()}`;

    try {
      const stream = await _getLocalStream(video);
      const pc = _createPeerConnection(targetId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: !!video,
      });
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('call:invite', {
        to: targetId,
        callId: callIdRef.current,
        isVideo: !!video,
        from: {
          id: user?._id || user?.id,
          username: user?.username,
          avatar: user?.avatar,
        },
        sdp: offer,
      });

      ringTimeoutRef.current = setTimeout(() => {
        setError('No answer');
        liveRef.current.endCall?.();
      }, RING_TIMEOUT_MS);
    } catch (e) {
      setError(
        e?.message?.includes('Permission')
          ? 'Camera/microphone permission denied'
          : 'Could not start call'
      );
      _cleanup();
      setCallState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const acceptCall = useCallback(async () => {
    if (callState !== 'incoming' || !peer) return;
    clearTimeout(ringTimeoutRef.current);
    const targetId = peer.id || peer._id;
    const offerSdp = pendingOfferRef.current;
    try {
      const stream = await _getLocalStream(isVideo);
      const pc = _createPeerConnection(targetId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (offerSdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
        _flushPendingCandidates();
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('call:answer', {
        to: targetId,
        callId: callIdRef.current,
        sdp: answer,
      });

      setCallState('connected');
    } catch (e) {
      setError(
        e?.message?.includes('Permission')
          ? 'Camera/microphone permission denied'
          : 'Could not answer call'
      );
      liveRef.current.declineCall?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState, peer, isVideo]);

  const declineCall = useCallback(() => {
    if (peer) {
      socketRef.current?.emit('call:decline', {
        to: peer.id || peer._id,
        callId: callIdRef.current,
      });
    }
    _cleanup();
    setCallState('idle');
  }, [peer]);

  const endCall = useCallback(() => {
    if (peer && callIdRef.current) {
      socketRef.current?.emit('call:end', {
        to: peer.id || peer._id,
        callId: callIdRef.current,
      });
    }
    _cleanup();
    setCallState('idle');
  }, [peer]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCameraOff;
    stream.getVideoTracks().forEach((t) => { t.enabled = !next; });
    setIsCameraOff(next);
  }, [isCameraOff]);

  const switchCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => t._switchCamera && t._switchCamera());
  }, []);

  liveRef.current = { endCall, declineCall, acceptCall, startCall };

  return (
    <CallContext.Provider
      value={{
        callState,
        isVideo,
        peer,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        error,
        clearError: () => setError(null),
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
        switchCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
