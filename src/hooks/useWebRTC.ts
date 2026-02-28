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
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTC({ localStream, channel, localPeerId, participants, enabled }: UseWebRTCOptions) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
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

  const initiateOffer = useCallback((pc: RTCPeerConnection, remotePeerId: string) => {
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer).then(() => offer))
      .then((offer) => {
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { from: localPeerIdRef.current, to: remotePeerId, sdp: offer },
        });
      })
      .catch((err) => console.warn("[WebRTC] Offer error:", err));
  }, []);

  const createPC = useCallback((remotePeerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      if (remoteStream) {
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

    // Handle renegotiation (fires when tracks are added after connection)
    pc.onnegotiationneeded = () => {
      if (pc.signalingState === "stable") {
        initiateOffer(pc, remotePeerId);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePC(remotePeerId);
      }
    };

    pcsRef.current.set(remotePeerId, pc);
    return pc;
  }, [updateStreams, initiateOffer]);

  const closePC = useCallback((remotePeerId: string) => {
    const pc = pcsRef.current.get(remotePeerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(remotePeerId);
      updateStreams(remotePeerId, null);
    }
  }, [updateStreams]);

  // Register signaling listeners on channel
  useEffect(() => {
    if (!channel || !enabled) return;

    const handleOffer = async ({ payload }: { payload: any }) => {
      const { from, to, sdp } = payload;
      if (to !== localPeerId) return;

      // Close existing PC if signaling state is incompatible (handle re-offers)
      let pc = pcsRef.current.get(from);
      if (pc && pc.signalingState !== "stable") {
        pc.close();
        pcsRef.current.delete(from);
        pc = undefined;
      }
      if (!pc) {
        pc = createPC(from);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc_answer",
        payload: { from: localPeerId, to: from, sdp: answer },
      });
    };

    const handleAnswer = async ({ payload }: { payload: any }) => {
      const { from, to, sdp } = payload;
      if (to !== localPeerId) return;

      const pc = pcsRef.current.get(from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleICE = async ({ payload }: { payload: any }) => {
      const { from, to, candidate } = payload;
      if (to !== localPeerId) return;

      const pc = pcsRef.current.get(from);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // Handle peer_ready: a late-joiner announces its stream is available
    const handlePeerReady = ({ payload }: { payload: any }) => {
      const { from } = payload;
      if (from === localPeerId) return;

      // If we should initiate (our ID is smaller) and don't have a connection, start one
      if (localPeerId < from && !pcsRef.current.has(from)) {
        const pc = createPC(from);
        initiateOffer(pc, from);
      }
      // If the other side should initiate but already has a connection, trigger renegotiation
      if (localPeerId > from) {
        const pc = pcsRef.current.get(from);
        if (pc && pc.signalingState === "stable" && localStreamRef.current) {
          // Already connected — the onnegotiationneeded handler takes care of it
        } else if (!pc) {
          // No connection yet and the other side should initiate — broadcast our own ready
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

    return () => {
      // Supabase JS v2 doesn't have .off(); cleanup happens on channel.unsubscribe()
    };
  }, [channel, enabled, localPeerId, createPC, initiateOffer]);

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
      if (localPeerId < remotePeerId) {
        const pc = createPC(remotePeerId);
        initiateOffer(pc, remotePeerId);
      }
    }
  }, [participants, enabled, channel, localPeerId, createPC, closePC, initiateOffer]);

  // When local stream changes, replace tracks on all existing connections and broadcast readiness
  useEffect(() => {
    if (!localStream) return;

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
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "peer_ready",
        payload: { from: localPeerId },
      });
    }
  }, [localStream, localPeerId]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      for (const pc of pcsRef.current.values()) {
        pc.close();
      }
      pcsRef.current.clear();
    };
  }, []);

  return { remoteStreams };
}
