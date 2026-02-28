import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsedSlide {
  slideNumber: number;
  imageBlob: Blob;
  textContent?: string;
}

export async function parsePDF(file: File): Promise<ParsedSlide[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const slides: ParsedSlide[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png", 0.92)
    );

    slides.push({ slideNumber: i, imageBlob: blob, textContent: text });
  }

  return slides;
}

const GOTENBERG_URL = import.meta.env.VITE_GOTENBERG_URL || "";

async function convertPptxToPdf(file: File): Promise<File> {
  if (!GOTENBERG_URL) {
    throw new Error("PPTX conversion service not configured");
  }
  const form = new FormData();
  form.append("files", file, file.name);
  const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("PPTX conversion failed");
  const blob = await res.blob();
  return new File([blob], file.name.replace(/\.pptx?$/i, ".pdf"), { type: "application/pdf" });
}

export async function parsePPTX(file: File): Promise<ParsedSlide[]> {
  // 1. Extract text content from PPTX XML (for AI question generation)
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });
  const textBySlide: string[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("string");
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
    textBySlide.push(matches ? matches.map(m => m.replace(/<\/?a:t>/g, "")).join(" ") : "");
  }

  // 2. Convert PPTX → PDF via Gotenberg, then render with parsePDF
  const pdfFile = await convertPptxToPdf(file);
  const slides = await parsePDF(pdfFile);

  // 3. Merge extracted text (richer than pdf.js text extraction for PPTX content)
  for (let i = 0; i < slides.length; i++) {
    if (i < textBySlide.length && textBySlide[i]) {
      slides[i].textContent = textBySlide[i];
    }
  }

  return slides;
}

export async function parsePresentation(file: File): Promise<ParsedSlide[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return parsePDF(file);
  if (ext === "pptx" || ext === "ppt") return parsePPTX(file);
  throw new Error(`Unsupported format: .${ext}`);
}

export async function uploadSlides(
  presentationId: string,
  userId: string,
  slides: ParsedSlide[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const path = `${userId}/${presentationId}/slide-${slide.slideNumber}.png`;

    await supabase.storage.from("slide-images").upload(path, slide.imageBlob, {
      contentType: "image/png",
      upsert: true,
    });

    const { data: { publicUrl } } = supabase.storage.from("slide-images").getPublicUrl(path);

    await supabase.from("presentation_slides").insert({
      presentation_id: presentationId,
      slide_number: slide.slideNumber,
      image_path: publicUrl,
      content_text: slide.textContent || null,
    });

    onProgress?.(i + 1, slides.length);
  }

  await supabase
    .from("presentations")
    .update({ slide_count: slides.length })
    .eq("id", presentationId);
}
