import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RoomState {
  lessonIdx: number;
  sectionIdx: number;
  activeQuestionIdx: number | null; // index into section.questions
  buddyEnabled: boolean;
  difficulty: "easy" | "medium" | "hard";
  feedbackPhase: "idle" | "question" | "feedback";
}

export interface RoomParticipant {
  id: string;
  name: string;
  role: "presenter" | "viewer";
  joinedAt: string;
  handRaised?: boolean;
}

const DEFAULT_STATE: RoomState = {
  lessonIdx: 0,
  sectionIdx: 0,
  activeQuestionIdx: null,
  buddyEnabled: true,
  difficulty: "easy",
  feedbackPhase: "idle",
};

export function useRealtimeRoom(roomCode: string | null, role: "presenter" | "viewer", userName: string = "You") {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localPeerIdRef = useRef(crypto.randomUUID());
  const [isConnected, setIsConnected] = useState(false);
  const [remoteState, setRemoteState] = useState<RoomState>(DEFAULT_STATE);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const presenceMetaRef = useRef<Record<string, unknown>>({});

  // Connect to channel
  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: userName } },
    });

    // Listen for state broadcasts (viewers)
    channel.on("broadcast", { event: "state_sync" }, ({ payload }) => {
      setRemoteState(payload as RoomState);
    });

    // Presence
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const pList: RoomParticipant[] = [];
      Object.entries(state).forEach(([_key, presences]) => {
        (presences as any[]).forEach((p) => {
          pList.push({
            id: p.id || _key,
            name: p.name || _key,
            role: p.role || "viewer",
            joinedAt: p.joinedAt || new Date().toISOString(),
            handRaised: p.handRaised ?? false,
          });
        });
      });
      setParticipants(pList);
    });

    const initialMeta = {
      id: localPeerIdRef.current,
      name: userName,
      role,
      joinedAt: new Date().toISOString(),
      handRaised: false,
    };
    presenceMetaRef.current = initialMeta;

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        await channel.track(initialMeta);
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [roomCode, role, userName]);

  // Broadcast state (presenter only)
  const broadcast = useCallback(
    (state: RoomState) => {
      if (role !== "presenter" || !channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "state_sync",
        payload: state,
      });
    },
    [role],
  );

  // Update presence metadata (e.g. for hand raise)
  const updatePresence = useCallback(
    (updates: Record<string, unknown>) => {
      if (!channelRef.current) return;
      presenceMetaRef.current = { ...presenceMetaRef.current, ...updates };
      channelRef.current.track(presenceMetaRef.current);
    },
    [],
  );

  return {
    isConnected,
    remoteState,
    participants,
    broadcast,
    participantCount: participants.length,
    channel: channelRef.current,
    localPeerId: localPeerIdRef.current,
    updatePresence,
  };
}
