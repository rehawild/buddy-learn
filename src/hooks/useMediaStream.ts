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
  const [isInIframe, setIsInIframe] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const acquire = useCallback(() => {
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: options.video, audio: options.audio })
      .then((s) => {
        streamRef.current = s;
        setStream(s);
      })
      .catch((err) => {
        const inIframe = window.self !== window.top;
        setIsInIframe(inIframe);
        if (inIframe) {
          setError("Camera/mic blocked by iframe sandbox. Open in a new tab to use your camera.");
        } else {
          setError(err.message || "Camera/mic access denied");
        }
      });
  }, [options.video, options.audio]);

  useEffect(() => {
    acquire();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const retry = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    acquire();
  }, [acquire]);

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

  return { stream, videoEnabled, audioEnabled, toggleVideo, toggleAudio, error, isInIframe, retry };
}
