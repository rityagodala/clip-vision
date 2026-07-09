import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const maxDuration = 10;

export async function POST(req) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  try {
    const { imageBase64, mimeType, labels } = await req.json();

    if (!imageBase64 || !Array.isArray(labels) || labels.length === 0) {
      return NextResponse.json(
        { error: "imageBase64 and labels[] are required" },
        { status: 400 }
      );
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    // Decode base64 → ArrayBuffer (no server-side URL fetch needed)
    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const imageBuffer = bytes.buffer;

    const results = await hf.zeroShotImageClassification(
      {
        model: "openai/clip-vit-base-patch32",
        inputs: { image: imageBuffer },
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
