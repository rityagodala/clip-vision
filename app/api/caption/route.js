import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const maxDuration = 10;

export async function POST(req) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ caption: "" }, { status: 200 });
    }

    const hf = new HfInference(process.env.HF_TOKEN ?? "");

    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const imageBuffer = bytes.buffer;

    const result = await hf.imageToText(
      {
        model: "Salesforce/blip-image-captioning-base",
        inputs: imageBuffer,
      },
      { signal: controller.signal }
    );

    return NextResponse.json({ caption: result.generated_text ?? "" });
  } catch (err) {
    const msg = err?.name === "AbortError"
      ? "Caption model warming up."
      : (err?.message ?? String(err));
    console.error("[caption]", msg);
    return NextResponse.json({ caption: "", error: msg }, { status: 200 });
  } finally {
    clearTimeout(tid);
  }
}
