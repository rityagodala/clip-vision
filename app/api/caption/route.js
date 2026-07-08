import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    const imageResp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!imageResp.ok) {
      return NextResponse.json(
        { error: `Cannot fetch image — HTTP ${imageResp.status}` },
        { status: 400 }
      );
    }
    const imageBlob = await imageResp.blob();

    const result = await hf.imageToText({
      model: "Salesforce/blip-image-captioning-base",
      inputs: imageBlob,
    });

    return NextResponse.json({ caption: result.generated_text ?? "" });
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error("[caption]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
