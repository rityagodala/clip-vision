import "./globals.css";

export const metadata = {
  title: "ClipVision — Zero-shot Image Classification",
  description:
    "Type any labels. CLIP computes similarity between your image and every label — no training required. Built with openai/clip-vit-base-patch32 via HuggingFace Inference API.",
  openGraph: {
    title: "ClipVision — Zero-shot Image Classification",
    description:
      "Live CLIP inference demo. Paste an image URL, type candidate labels, see real probabilities.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <body>{children}</body>
    </html>
  );
}
