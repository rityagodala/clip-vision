# ClipVision

**Live demo → [clip-vision-cyan.vercel.app](https://clip-vision-cyan.vercel.app)**

Zero-shot image classification powered by [CLIP](https://openai.com/research/clip). Paste any image URL, type candidate labels — no training required.

## What it does

- **CLIP inference** — `openai/clip-vit-base-patch32` scores each label against the image using cosine similarity in a joint embedding space
- **BLIP captioning** — `Salesforce/blip-image-captioning-base` generates a natural-language description alongside
- **Zero-shot** — works on any labels you type; no fine-tuning needed

## Stack

- Next.js 14 App Router + API routes
- `@huggingface/inference` SDK
- Tailwind CSS (dark glassmorphism)
- Deployed on Vercel

## Run locally

```bash
git clone https://github.com/rityagodala/clip-vision
cd clip-vision
npm install
# optional: add HF_TOKEN to .env.local for higher rate limits
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Related

Inspired by my [torchmetrics PR #3428](https://github.com/Lightning-AI/torchmetrics/pull/3428) — fixing CLIPScore for transformers ≥ 5.0.
