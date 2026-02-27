import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UploadedSlide {
  id: string;
  slideNumber: number;
  imagePath: string;
  contentText: string | null;
}

export function useSessionSlides(roomCode: string | null) {
  const [slides, setSlides] = useState<UploadedSlide[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [presentationTitle, setPresentationTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setLoading(false);
      return;
    }

    const fetchSlides = async () => {
      // Find session by room_code
      const { data: session } = await supabase
        .from("sessions")
        .select("presentation_id")
        .eq("room_code", roomCode)
        .maybeSingle();

      if (!session?.presentation_id) {
        setLoading(false);
        return;
      }

      // Fetch presentation title
      const { data: presentation } = await supabase
        .from("presentations")
        .select("title")
        .eq("id", session.presentation_id)
        .maybeSingle();

      setPresentationTitle(presentation?.title ?? null);

      // Fetch slides
      const { data: slideRows } = await supabase
        .from("presentation_slides")
        .select("*")
        .eq("presentation_id", session.presentation_id)
        .order("slide_number", { ascending: true });

      if (slideRows && slideRows.length > 0) {
        setSlides(
          slideRows.map((s) => ({
            id: s.id,
            slideNumber: s.slide_number,
            imagePath: s.image_path || "",
            contentText: s.content_text,
          }))
        );
      }

      setLoading(false);
    };

    fetchSlides();
  }, [roomCode]);

  return { slides, loading, presentationTitle };
}
