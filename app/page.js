"use client";
import { useState, useEffect, useRef } from "react";

const DEMOS = [
  { label: "Dog",      url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80", labels: "golden retriever, labrador, poodle, husky, cat, rabbit" },
  { label: "Mountain", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", labels: "mountain, ocean, desert, forest, city, tundra" },
  { label: "City",     url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", labels: "city street, countryside road, beach, forest trail, airport" },
  { label: "Food",     url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", labels: "salad, pizza, sushi, burger, pasta, steak" },
];

const TICKER_ITEMS = [
  "ZERO-SHOT", "·", "CLIP VISION", "·", "VIT-B/32", "·",
  "IMAGE UNDERSTANDING", "·", "NO FINE-TUNING", "·",
  "COSINE SIMILARITY", "·", "OPENAI", "·", "HUGGINGFACE", "·",
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* Wraps each section for scroll-triggered reveal */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("is-visible"); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home() {
  const [url, setUrl]         = useState("");
  const [labels, setLabels]   = useState("dog, cat, mountain, car, person, building");
  const [results, setResults] = useState(null);
  const [caption, setCaption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeDemo, setActiveDemo] = useState(null);
  const [imgBad, setImgBad]   = useState(false);

  const reset = () => { setResults(null); setCaption(null); setError(null); setImgBad(false); };
  const selectDemo = (d) => { setUrl(d.url); setLabels(d.labels); setActiveDemo(d.url); reset(); };

  const run = async () => {
    if (!url || !labels.trim()) return;
    setLoading(true); reset();
    const labelArr = labels.split(",").map(l => l.trim()).filter(Boolean).slice(0, 10);
    try {
      const [cr, capr] = await Promise.allSettled([
        fetch("/api/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: url, labels: labelArr }) }).then(r => r.json()),
        fetch("/api/caption",  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: url }) }).then(r => r.json()),
      ]);
      if (cr.status === "fulfilled") {
        if (cr.value.error) throw new Error(cr.value.error);
        setResults(cr.value);
      } else throw cr.reason;
      if (capr.status === "fulfilled" && !capr.value.error) setCaption(capr.value.caption);
    } catch (e) {
      const msg = String(e?.message ?? e);
      setError(msg.toLowerCase().includes("loading") || msg.includes("503")
        ? "Model warming up on HuggingFace — try again in ~30s." : msg);
    } finally { setLoading(false); }
  };

  const sorted = results ? [...results].sort((a, b) => b.score - a.score) : null;

  return (
    <main className="min-h-screen bg-[#ece8de] text-[#1a1a1a]">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b border-[#1a1a1a]/10 bg-[#ece8de]/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] flex items-center justify-center text-[11px] font-black text-[#ece8de]">
              CV
            </div>
            <span className="font-black text-sm uppercase tracking-[0.12em]">ClipVision</span>
          </div>
          <a
            href="https://github.com/rityagodala/clip-vision"
            target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors uppercase tracking-[0.18em]"
          >
            GitHub →
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10">
        {/* Live badge */}
        <div className="flex items-center gap-2.5 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-700 animate-pulse" />
          <span className="text-[11px] text-[#1a1a1a]/40 uppercase tracking-[0.2em]">
            Live inference · openai/clip-vit-base-patch32
          </span>
        </div>

        {/* Animated title — each word slides up from below */}
        <h1 className="text-[clamp(3.5rem,10vw,7rem)] font-black uppercase leading-none tracking-tight mb-2">
          <span className="word-clip">
            <span className="word-reveal" style={{ animationDelay: "0ms" }}>Zero-shot</span>
          </span>
          {/* Zipline-style: inline image embedded inside the text */}
          <span className="word-clip flex items-center gap-4">
            <span className="word-reveal flex items-center gap-4" style={{ animationDelay: "140ms" }}>
              <span>image</span>
              <span
                className="inline-block rounded-xl overflow-hidden shrink-0 align-middle"
                style={{ width: "clamp(3rem,6vw,4.5rem)", height: "clamp(2.5rem,5vw,3.75rem)", animationDelay: "300ms" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=80"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </span>
            </span>
          </span>
          <span className="word-clip">
            <span className="word-reveal" style={{ animationDelay: "280ms" }}>understanding</span>
          </span>
        </h1>

        <p
          className="text-sm text-[#1a1a1a]/45 max-w-xs leading-relaxed mt-8"
          style={{ animation: "wordReveal 0.85s 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          Paste any image URL and type candidate labels. CLIP scores each label without fine-tuning.
        </p>
      </section>

      {/* ── Marquee ticker ───────────────────────────────── */}
      <div className="border-y border-[#1a1a1a]/10 py-3 overflow-hidden">
        <div className="marquee-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={i}
              className={`text-[11px] uppercase tracking-[0.18em] mx-5 shrink-0 ${
                item === "·" ? "text-[#1a1a1a]/20" : "text-[#1a1a1a]/35"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── App ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 divide-y divide-[#1a1a1a]/10">

        {/* Quick demos */}
        <Reveal className="py-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-5">Quick Demos</p>
          <div className="flex flex-wrap gap-2">
            {DEMOS.map(d => (
              <button
                key={d.url}
                onClick={() => selectDemo(d)}
                className={`px-4 py-1.5 text-sm font-semibold border transition-all duration-150 ${
                  activeDemo === d.url
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-[#ece8de]"
                    : "bg-transparent border-[#1a1a1a]/20 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Inputs */}
        <Reveal className="py-10 space-y-8">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-3">
              Image URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setActiveDemo(null); reset(); }}
              placeholder="https://..."
              className="w-full bg-transparent border border-[#1a1a1a]/15 px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25 focus:outline-none focus:border-[#1a1a1a]/50 transition-colors"
            />
          </div>

          {url && !imgBad && (
            <div className="overflow-hidden border border-[#1a1a1a]/10 max-h-72">
              <img src={url} alt="Preview" className="w-full max-h-72 object-cover" onError={() => setImgBad(true)} />
            </div>
          )}
          {imgBad && (
            <p className="text-xs text-red-700 uppercase tracking-widest">⚠ Could not load image preview</p>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-3">
              Candidate Labels{" "}
              <span className="normal-case text-[#1a1a1a]/30 tracking-normal">comma-separated, up to 10</span>
            </label>
            <input
              type="text"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder="cat, dog, car, mountain..."
              className="w-full bg-transparent border border-[#1a1a1a]/15 px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25 focus:outline-none focus:border-[#1a1a1a]/50 transition-colors"
            />
          </div>

          <button
            onClick={run}
            disabled={loading || !url || !labels.trim()}
            className="w-full py-4 font-black text-sm bg-[#1a1a1a] text-[#ece8de] uppercase tracking-[0.22em] hover:bg-[#2a2a2a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
          >
            {loading ? <><Spinner />Running CLIP…</> : "Run CLIP →"}
          </button>

          {error && (
            <div className="border border-red-300/60 bg-red-50/60 px-4 py-3 text-red-800 text-xs leading-relaxed">
              ⚠ {error}
            </div>
          )}
        </Reveal>

        {/* Results */}
        {sorted && (
          <Reveal className="py-10 space-y-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-2">Top Prediction</p>
                <p className="text-4xl font-black uppercase tracking-tight capitalize leading-none">{sorted[0].label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-5xl font-black font-mono leading-none">{(sorted[0].score * 100).toFixed(0)}%</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mt-1">confidence</p>
              </div>
            </div>

            <div className="space-y-5">
              {sorted.map((r, i) => (
                <div key={r.label} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-sm capitalize ${i === 0 ? "font-bold" : "font-normal text-[#1a1a1a]/45"}`}>
                      {r.label}
                    </span>
                    <span className={`text-xs font-mono tabular-nums ${i === 0 ? "" : "text-[#1a1a1a]/35"}`}>
                      {(r.score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-px bg-[#1a1a1a]/8 overflow-hidden relative">
                    <div
                      className={`absolute inset-y-0 left-0 score-bar ${i === 0 ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/20"}`}
                      style={{ width: `${(r.score * 100).toFixed(2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {caption && (
              <div className="border-t border-[#1a1a1a]/10 pt-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-3">BLIP Caption</p>
                <p className="text-sm text-[#1a1a1a]/55 italic leading-relaxed">"{caption}"</p>
              </div>
            )}
          </Reveal>
        )}

        {/* How it works */}
        <Reveal className="py-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mb-8">How It Works</p>
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1a1a1a]/10 border border-[#1a1a1a]/10">
            {[
              { n: "01", title: "Image Embedding",  body: "CLIP's ViT-B/32 encodes your image to a 512-dim vector in a joint embedding space." },
              { n: "02", title: "Text Embeddings",  body: "Each label is encoded by CLIP's text transformer into the same 512-dim space." },
              { n: "03", title: "Cosine Similarity", body: "Dot-product similarities are softmax-normalized into probabilities across all labels." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 80} className="p-6">
                <div className="font-mono text-xs text-[#1a1a1a]/25 tracking-[0.15em] mb-4">{s.n}</div>
                <div className="text-sm font-black uppercase tracking-tight mb-2">{s.title}</div>
                <div className="text-xs text-[#1a1a1a]/45 leading-relaxed">{s.body}</div>
              </Reveal>
            ))}
          </div>
        </Reveal>

      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a1a]/10 px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#1a1a1a]/30 uppercase tracking-[0.12em]">
            Built by{" "}
            <a href="https://github.com/rityagodala" className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors">
              Ritya Godala
            </a>
          </p>
          <p className="text-[11px] text-[#1a1a1a]/30 uppercase tracking-[0.12em]">
            Inspired by{" "}
            <a
              href="https://github.com/Lightning-AI/torchmetrics/pull/3428"
              target="_blank" rel="noopener noreferrer"
              className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors"
            >
              torchmetrics PR #3428
            </a>
          </p>
        </div>
      </footer>

    </main>
  );
}
