import { useState, useEffect, useCallback, useRef } from "react";

interface UseMediaStreamOptions {
  video?: boolean;
  audio?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = { video: true, audio: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(options.video ?? true);
  const [audioEnabled, setAudioEnabled] = useState(options.audio ?? true);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: options.video, audio: options.audio })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        setStream(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Camera/mic access denied");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleVideo = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks();
    if (tracks) {
      const next = !videoEnabled;
      tracks.forEach((t) => (t.enabled = next));
      setVideoEnabled(next);
    }
  }, [videoEnabled]);

  const toggleAudio = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks();
    if (tracks) {
      const next = !audioEnabled;
      tracks.forEach((t) => (t.enabled = next));
      setAudioEnabled(next);
    }
  }, [audioEnabled]);

  return { stream, videoEnabled, audioEnabled, toggleVideo, toggleAudio, error };
}
