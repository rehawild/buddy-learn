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

  channelRef.current = channel;
  localStreamRef.current = localStream;

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
          payload: { from: localPeerId, to: remotePeerId, candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePC(remotePeerId);
      }
    };

    pcsRef.current.set(remotePeerId, pc);
    return pc;
  }, [localPeerId, updateStreams]);

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

      let pc = pcsRef.current.get(from);
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
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    channel.on("broadcast", { event: "webrtc_offer" }, handleOffer);
    channel.on("broadcast", { event: "webrtc_answer" }, handleAnswer);
    channel.on("broadcast", { event: "webrtc_ice" }, handleICE);

    return () => {
      channel.off("broadcast", { event: "webrtc_offer" }, handleOffer);
      channel.off("broadcast", { event: "webrtc_answer" }, handleAnswer);
      channel.off("broadcast", { event: "webrtc_ice" }, handleICE);
    };
  }, [channel, enabled, localPeerId, createPC]);

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
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            channelRef.current?.send({
              type: "broadcast",
              event: "webrtc_offer",
              payload: { from: localPeerId, to: remotePeerId, sdp: offer },
            });
          });
      }
    }
  }, [participants, enabled, channel, localPeerId, createPC, closePC]);

  // When local stream changes, replace tracks on all existing connections
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
  }, [localStream]);

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
