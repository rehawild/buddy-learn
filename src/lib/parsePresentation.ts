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

export async function parsePPTX(file: File): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const slides: ParsedSlide[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async("string");
    const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g);
    const text = textMatches
      ? textMatches.map((m) => m.replace(/<\/?a:t>/g, "")).join(" ")
      : "";

    // Try to extract embedded images from the slide's relationships
    const slideNum = i + 1;
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    let slideImage: Blob | null = null;

    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async("string");
      const imageRels = relsXml.match(/Target="\.\.\/media\/[^"]+"/g);
      if (imageRels && imageRels.length > 0) {
        const firstImage = imageRels[0].match(/Target="\.\.\/(.+?)"/)?.[1];
        if (firstImage && zip.files[`ppt/${firstImage}`]) {
          const imgData = await zip.files[`ppt/${firstImage}`].async("blob");
          // Use this image as slide background if it's large enough
          if (imgData.size > 10000) {
            slideImage = imgData;
          }
        }
      }
    }

    // Generate canvas-based slide image
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d")!;

    if (slideImage) {
      // Draw embedded image
      const img = await createImageBitmap(slideImage);
      ctx.drawImage(img, 0, 0, 1920, 1080);
    } else {
      // Render text-based slide
      ctx.fillStyle = "#1e2028";
      ctx.fillRect(0, 0, 1920, 1080);

      // Title area
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 48px sans-serif";
      const lines = wrapText(ctx, text, 1720, 48);
      let y = 200;
      for (const line of lines.slice(0, 15)) {
        ctx.fillText(line, 100, y);
        y += 64;
      }

      // Slide number
      ctx.fillStyle = "#6b7280";
      ctx.font = "28px sans-serif";
      ctx.fillText(`Slide ${slideNum}`, 48, 1040);
    }

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );

    slides.push({ slideNumber: slideNum, imageBlob: blob, textContent: text });
  }

  return slides;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
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
