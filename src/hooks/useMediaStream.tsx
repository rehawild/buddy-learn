import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

interface MediaStreamState {
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  error: string | null;
  isInIframe: boolean;
  retry: () => void;
}

const MediaStreamContext = createContext<MediaStreamState | null>(null);

export function MediaStreamProvider({ children }: { children: React.ReactNode }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInIframeRef = useRef(false);

  const acquire = useCallback(() => {
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        streamRef.current = s;
        setStream(s);
      })
      .catch((err) => {
        const inIframe = window.self !== window.top;
        isInIframeRef.current = inIframe;
        if (inIframe) {
          setError("Camera/mic blocked by iframe sandbox. Open in a new tab to use your camera.");
        } else {
          setError(err.message || "Camera/mic access denied");
        }
      });
  }, []);

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

  const value: MediaStreamState = {
    stream,
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
    error,
    isInIframe: isInIframeRef.current,
    retry,
  };

  return (
    <MediaStreamContext.Provider value={value}>
      {children}
    </MediaStreamContext.Provider>
  );
}

export function useMediaStream(): MediaStreamState {
  const ctx = useContext(MediaStreamContext);
  if (!ctx) {
    throw new Error("useMediaStream must be used within a MediaStreamProvider");
  }
  return ctx;
}
