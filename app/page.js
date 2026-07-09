"use client";
import { useState } from "react";

const DEMOS = [
  { label: "Dog", url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80", labels: "golden retriever, labrador, poodle, husky, cat, rabbit" },
  { label: "Mountain", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", labels: "mountain, ocean, desert, forest, city, tundra" },
  { label: "City", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", labels: "city street, countryside road, beach, forest trail, airport" },
  { label: "Food", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", labels: "salad, pizza, sushi, burger, pasta, steak" },
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [labels, setLabels] = useState("dog, cat, mountain, car, person, building");
  const [results, setResults] = useState(null);
  const [caption, setCaption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDemo, setActiveDemo] = useState(null);
  const [imgBad, setImgBad] = useState(false);

  const reset = () => { setResults(null); setCaption(null); setError(null); setImgBad(false); };

  const selectDemo = (d) => { setUrl(d.url); setLabels(d.labels); setActiveDemo(d.url); reset(); };

  const run = async () => {
    if (!url || !labels.trim()) return;
    setLoading(true); reset();
    const labelArr = labels.split(",").map(l => l.trim()).filter(Boolean).slice(0, 10);
    try {
      const [cr, capr] = await Promise.allSettled([
        fetch("/api/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: url, labels: labelArr }) }).then(r => r.json()),
        fetch("/api/caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: url }) }).then(r => r.json()),
      ]);
      if (cr.status === "fulfilled") {
        if (cr.value.error) throw new Error(cr.value.error);
        setResults(cr.value);
      } else throw cr.reason;
      if (capr.status === "fulfilled" && !capr.value.error) setCaption(capr.value.caption);
    } catch (e) {
      const msg = String(e?.message ?? e);
      setError(msg.toLowerCase().includes("loading") || msg.includes("503") ? "Model warming up on HuggingFace — try again in ~30s." : msg);
    } finally { setLoading(false); }
  };

  const sorted = results ? [...results].sort((a, b) => b.score - a.score) : null;

  return (
    <main className="min-h-screen bg-[#07070e] text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-xl bg-[#07070e]/80 px-5 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">CV</div>
            <span className="font-semibold tracking-tight">ClipVision</span>
          </div>
          <a href="https://github.com/rityagodala/clip-vision" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white transition-colors">GitHub →</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live inference · openai/clip-vit-base-patch32
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 gradient-text leading-tight pb-1">Zero-shot image understanding</h1>
        <p className="text-slate-400 max-w-md mx-auto">Paste any image URL and type candidate labels. CLIP scores each label without fine-tuning.</p>
      </section>

      {/* App */}
      <section className="max-w-2xl mx-auto px-5 pb-20 space-y-4">
        {/* Demo chips */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Quick demos</p>
          <div className="flex flex-wrap gap-2">
            {DEMOS.map(d => (
              <button key={d.url} onClick={() => selectDemo(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${activeDemo === d.url ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]"}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input card */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 block">Image URL</label>
            <input type="url" value={url} onChange={e => { setUrl(e.target.value); setActiveDemo(null); reset(); }}
              placeholder="https://..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
          </div>

          {url && !imgBad && (
            <div className="rounded-xl overflow-hidden bg-white/5 max-h-64">
              <img src={url} alt="Preview" className="w-full max-h-64 object-cover" onError={() => setImgBad(true)} />
            </div>
          )}
          {imgBad && <p className="text-xs text-red-400">⚠ Could not load image preview</p>}

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 block">
              Candidate labels <span className="normal-case text-indigo-400 ml-1">comma-separated, up to 10</span>
            </label>
            <input type="text" value={labels} onChange={e => setLabels(e.target.value)}
              placeholder="cat, dog, car, mountain..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
          </div>

          <button onClick={run} disabled={loading || !url || !labels.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all glow flex items-center justify-center gap-2">
            {loading ? <><Spinner /> Running CLIP inference…</> : "Run CLIP →"}
          </button>

          {error && (
            <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed">⚠ {error}</div>
          )}
        </div>

        {/* Results */}
        {sorted && (
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Top prediction</p>
                <p className="text-2xl font-bold text-white capitalize">{sorted[0].label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black font-mono gradient-text">{(sorted[0].score * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-slate-500">confidence</p>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="space-y-3">
              {sorted.map((r, i) => (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm capitalize ${i === 0 ? "text-white font-medium" : "text-slate-400"}`}>{r.label}</span>
                    <span className={`text-xs font-mono ${i === 0 ? "text-indigo-300" : "text-slate-500"}`}>{(r.score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full score-bar ${i === 0 ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-white/[0.12]"}`}
                      style={{ width: `${(r.score * 100).toFixed(2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {caption && (
              <>
                <div className="h-px bg-white/5" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">BLIP caption</p>
                  <p className="text-sm text-slate-200 italic">"{caption}"</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="pt-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">How it works</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { n: "01", title: "Image embedding", body: "CLIP's ViT-B/32 encodes your image to a 512-dim vector in a joint embedding space." },
              { n: "02", title: "Text embeddings", body: "Each label is encoded by CLIP's text transformer into the same 512-dim space." },
              { n: "03", title: "Cosine similarity", body: "Dot-product similarities are softmax-normalized into probabilities across all labels." },
            ].map(s => (
              <div key={s.n} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-indigo-400 font-mono text-xs mb-1.5">{s.n}</div>
                <div className="text-sm font-semibold mb-1">{s.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pt-2">
          Built by <a href="https://github.com/rityagodala" className="text-slate-400 hover:text-white transition-colors">Ritya Godala</a>
          {" · "}inspired by{" "}
          <a href="https://github.com/Lightning-AI/torchmetrics/pull/3428" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">torchmetrics PR #3428</a>
        </p>
      </section>
    </main>
  );
}
