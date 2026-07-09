import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

// Vercel Hobby caps functions at 10s. We abort at 8s so we can
// always return a proper JSON error before the connection is killed.
export const maxDuration = 10;

export async function POST(req) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  try {
    const { imageUrl, labels } = await req.json();

    if (!imageUrl || !Array.isArray(labels) || labels.length === 0) {
      return NextResponse.json(
        { error: "imageUrl and labels[] are required" },
        { status: 400 }
      );
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    // Fetch the image server-side (5s budget)
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

    const results = await hf.zeroShotImageClassification(
      {
        model: "openai/clip-vit-base-patch32",
        inputs: { image: imageBlob },
        parameters: { candidate_labels: labels },
      },
      { signal: controller.signal }
    );

    return NextResponse.json(results);
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Model is warming up on HuggingFace — please try again in ~30 seconds."
        : (err?.message ?? String(err));
    console.error("[classify]", msg);
    return NextResponse.json(
      { error: msg },
      { status: err?.name === "AbortError" ? 503 : 500 }
    );
  } finally {
    clearTimeout(tid);
  }
}
