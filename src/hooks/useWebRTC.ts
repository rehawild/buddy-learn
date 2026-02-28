import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomParticipant } from "./useRealtimeRoom";

interface UseWebRTCOptions {
  localStream: MediaStream | null;
  channel: RealtimeChannel | null;
  localPeerId: string;
  participants: RoomParticipant[];
  enabled: boolean;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "e7e6549af4af40509bfcb082",
      credential: "mFKR6FUZP6RISrFc",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "e7e6549af4af40509bfcb082",
      credential: "mFKR6FUZP6RISrFc",
    },
    {
      urls: "turn:global.relay.metered.ca:443?transport=tcp",
      username: "e7e6549af4af40509bfcb082",
      credential: "mFKR6FUZP6RISrFc",
    },
  ],
};

export function useWebRTC({ localStream, channel, localPeerId, participants, enabled }: UseWebRTCOptions) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateBuffer = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const channelRef = useRef(channel);
  const localStreamRef = useRef(localStream);
  const localPeerIdRef = useRef(localPeerId);

  channelRef.current = channel;
  localStreamRef.current = localStream;
  localPeerIdRef.current = localPeerId;

  const updateStreams = useCallback((peerId: string, stream: MediaStream | null) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      if (stream) {
        next.set(peerId, stream);
      } else {
        next.delete(peerId);
      }
      return next;
    });
  }, []);

  const flushICEBuffer = useCallback(async (pc: RTCPeerConnection, remotePeerId: string) => {
    const buf = iceCandidateBuffer.current.get(remotePeerId);
    if (buf && buf.length > 0) {
      console.log(`[WebRTC] Flushing ${buf.length} buffered ICE candidates for ${remotePeerId.slice(0, 8)}`);
      for (const c of buf) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      iceCandidateBuffer.current.delete(remotePeerId);
    }
  }, []);

  const initiateOffer = useCallback((pc: RTCPeerConnection, remotePeerId: string) => {
    console.log(`[WebRTC] Creating offer for ${remotePeerId.slice(0, 8)}`);
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer).then(() => offer))
      .then((offer) => {
        console.log(`[WebRTC] Sending offer to ${remotePeerId.slice(0, 8)}`);
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { from: localPeerIdRef.current, to: remotePeerId, sdp: offer },
        });
      })
      .catch((err) => console.warn("[WebRTC] Offer error:", err));
  }, []);

  const createPC = useCallback((remotePeerId: string): RTCPeerConnection => {
    console.log(`[WebRTC] Creating peer connection for ${remotePeerId.slice(0, 8)}`);
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
      console.log(`[WebRTC] Added ${localStreamRef.current.getTracks().length} local tracks`);
    }

    // Handle remote tracks
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      if (remoteStream) {
        console.log(`[WebRTC] Received remote track (${e.track.kind}) from ${remotePeerId.slice(0, 8)}`);
        updateStreams(remotePeerId, remoteStream);
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc_ice",
          payload: { from: localPeerIdRef.current, to: remotePeerId, candidate: e.candidate.toJSON() },
        });
      }
    };

    // Handle renegotiation — only the initiating side (lower ID) sends offers to prevent glare
    pc.onnegotiationneeded = () => {
      if (pc.signalingState === "stable" && localPeerIdRef.current < remotePeerId) {
        initiateOffer(pc, remotePeerId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state (${remotePeerId.slice(0, 8)}): ${pc.connectionState}`);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePC(remotePeerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state (${remotePeerId.slice(0, 8)}): ${pc.iceConnectionState}`);
    };

    pcsRef.current.set(remotePeerId, pc);
    return pc;
  }, [updateStreams, initiateOffer]);

  const closePC = useCallback((remotePeerId: string) => {
    const pc = pcsRef.current.get(remotePeerId);
    if (pc) {
      console.log(`[WebRTC] Closing peer connection for ${remotePeerId.slice(0, 8)}`);
      pc.close();
      pcsRef.current.delete(remotePeerId);
      iceCandidateBuffer.current.delete(remotePeerId);
      updateStreams(remotePeerId, null);
    }
  }, [updateStreams]);

  // Register signaling listeners on channel
  useEffect(() => {
    if (!channel || !enabled) return;

    console.log(`[WebRTC] Registering signaling listeners (localPeerId: ${localPeerId.slice(0, 8)})`);

    const handleOffer = async ({ payload }: { payload: any }) => {
      const { from, to, sdp } = payload;
      if (to !== localPeerId) return;

      console.log(`[WebRTC] Received offer from ${from.slice(0, 8)}`);

      // Close existing PC if signaling state is incompatible (handle re-offers)
      let pc = pcsRef.current.get(from);
      if (pc && pc.signalingState !== "stable") {
        pc.close();
        pcsRef.current.delete(from);
        iceCandidateBuffer.current.delete(from);
        pc = undefined;
      }
      if (!pc) {
        pc = createPC(from);
      }

      // Ensure local tracks are on the PC before answering
      if (localStreamRef.current) {
        const senders = pc.getSenders();
        for (const track of localStreamRef.current.getTracks()) {
          if (!senders.some((s) => s.track?.id === track.id)) {
            pc.addTrack(track, localStreamRef.current);
          }
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushICEBuffer(pc, from);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log(`[WebRTC] Sending answer to ${from.slice(0, 8)}`);
      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc_answer",
        payload: { from: localPeerId, to: from, sdp: answer },
      });
    };

    const handleAnswer = async ({ payload }: { payload: any }) => {
      const { from, to, sdp } = payload;
      if (to !== localPeerId) return;

      console.log(`[WebRTC] Received answer from ${from.slice(0, 8)}`);

      const pc = pcsRef.current.get(from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushICEBuffer(pc, from);
      }
    };

    const handleICE = async ({ payload }: { payload: any }) => {
      const { from, to, candidate } = payload;
      if (to !== localPeerId) return;

      const pc = pcsRef.current.get(from);
      if (!pc) return;

      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Buffer until remoteDescription is set
        const buf = iceCandidateBuffer.current.get(from) || [];
        buf.push(candidate);
        iceCandidateBuffer.current.set(from, buf);
        console.log(`[WebRTC] Buffered ICE candidate from ${from.slice(0, 8)} (${buf.length} total)`);
      }
    };

    // Handle peer_ready: a peer announces its stream is available
    const handlePeerReady = ({ payload }: { payload: any }) => {
      const { from } = payload;
      if (from === localPeerId) return;

      console.log(`[WebRTC] Received peer_ready from ${from.slice(0, 8)}`);

      const existingPC = pcsRef.current.get(from);

      if (localPeerId < from) {
        // We are the initiating side (lower ID)
        if (!existingPC) {
          if (localStreamRef.current) {
            const pc = createPC(from);
            initiateOffer(pc, from);
          }
        } else if (existingPC.signalingState === "stable") {
          // Peer got their stream — renegotiate to exchange updated media
          initiateOffer(existingPC, from);
        }
      } else {
        // We are the responding side (higher ID)
        if (!existingPC) {
          // No connection yet and the other side should initiate — broadcast our own ready
          console.log(`[WebRTC] Sending peer_ready back (responding side)`);
          channelRef.current?.send({
            type: "broadcast",
            event: "peer_ready",
            payload: { from: localPeerId },
          });
        }
      }
    };

    channel.on("broadcast", { event: "webrtc_offer" }, handleOffer);
    channel.on("broadcast", { event: "webrtc_answer" }, handleAnswer);
    channel.on("broadcast", { event: "webrtc_ice" }, handleICE);
    channel.on("broadcast", { event: "peer_ready" }, handlePeerReady);

    // Broadcast readiness now that listeners are registered — ensures peers
    // that sent offers before we were listening will re-initiate
    if (localStreamRef.current) {
      console.log(`[WebRTC] Broadcasting peer_ready (listeners registered)`);
      channel.send({
        type: "broadcast",
        event: "peer_ready",
        payload: { from: localPeerId },
      });
    }

    return () => {
      // Supabase JS v2 doesn't have .off(); cleanup happens on channel.unsubscribe()
    };
  }, [channel, enabled, localPeerId, createPC, initiateOffer, flushICEBuffer]);

  // On participant changes, initiate connections to new peers
  useEffect(() => {
    if (!enabled || !channel) return;

    const remotePeerIds = new Set(
      participants.filter((p) => p.id !== localPeerId).map((p) => p.id)
    );

    // Close connections to peers that left
    for (const peerId of pcsRef.current.keys()) {
      if (!remotePeerIds.has(peerId)) {
        closePC(peerId);
      }
    }

    // Initiate connection to new peers (only if our ID is smaller — avoids duplicate offers)
    for (const remotePeerId of remotePeerIds) {
      if (pcsRef.current.has(remotePeerId)) continue;
      if (localPeerId < remotePeerId && localStreamRef.current) {
        const pc = createPC(remotePeerId);
        initiateOffer(pc, remotePeerId);
      }
    }
  }, [participants, enabled, channel, localPeerId, localStream, createPC, closePC, initiateOffer]);

  // When local stream changes, replace tracks on all existing connections and broadcast readiness
  useEffect(() => {
    if (!localStream) return;

    console.log(`[WebRTC] Local stream changed, replacing tracks on ${pcsRef.current.size} connections`);

    for (const pc of pcsRef.current.values()) {
      const senders = pc.getSenders();
      for (const track of localStream.getTracks()) {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      }
    }

    // Announce stream readiness to trigger connections from peers that missed us
    if (channel) {
      console.log(`[WebRTC] Broadcasting peer_ready (stream changed)`);
      channel.send({
        type: "broadcast",
        event: "peer_ready",
        payload: { from: localPeerId },
      });
    }
  }, [localStream, localPeerId, channel]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      console.log("[WebRTC] Cleanup: closing all peer connections");
      for (const pc of pcsRef.current.values()) {
        pc.close();
      }
      pcsRef.current.clear();
      iceCandidateBuffer.current.clear();
    };
  }, []);

  return { remoteStreams };
}
