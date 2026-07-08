import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

// Allow up to 60s on Vercel Pro; Hobby plan defaults to 10s.
// Add HF_TOKEN to Vercel env vars for best results (avoids guest rate limits).
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { imageUrl, labels } = await req.json();

    if (!imageUrl || !Array.isArray(labels) || labels.length === 0) {
      return NextResponse.json(
        { error: "imageUrl and labels[] are required" },
        { status: 400 }
      );
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    // Fetch the image server-side so we avoid client CORS restrictions
    // and so any CDN/auth-gated URL still works.
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

    const results = await hf.zeroShotImageClassification({
      model: "openai/clip-vit-base-patch32",
      inputs: { image: imageBlob },
      parameters: { candidate_labels: labels },
    });

    // results is an array of { label, score } objects
    return NextResponse.json(results);
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error("[classify]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
