import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const maxDuration = 10;

export async function POST(req) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    const imageResp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!imageResp.ok) {
      return NextResponse.json(
        { error: `Cannot fetch image — HTTP ${imageResp.status}` },
        { status: 400 }
      );
    }
    const imageBlob = await imageResp.blob();

    const result = await hf.imageToText(
      {
        model: "Salesforce/blip-image-captioning-base",
        inputs: imageBlob,
      },
      { signal: controller.signal }
    );

    return NextResponse.json({ caption: result.generated_text ?? "" });
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Caption model warming up — skipping caption."
        : (err?.message ?? String(err));
    console.error("[caption]", msg);
    // Caption is non-critical; return empty so classify still shows
    return NextResponse.json({ caption: "", error: msg }, { status: 200 });
  } finally {
    clearTimeout(tid);
  }
}
