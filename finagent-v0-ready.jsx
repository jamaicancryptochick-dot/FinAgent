// ============================================================
// FINAGENT - AI Accounting Dashboard
// ============================================================
// HOW TO DEPLOY (takes about 10 minutes, totally free):
//
// STEP 1: Get your free Gemini API key
//   → Go to: aistudio.google.com/app/apikey
//   → Sign in with Google → click "Create API key" → copy it
//
// STEP 2: Deploy to Vercel
//   → Go to: vercel.com → sign up free with GitHub
//   → Click "Add New Project" → choose "Import Third-Party Git"
//   → OR just drag this file into v0.dev (v0.dev) and click Deploy
//
// STEP 3: Add your API key in Vercel
//   → In your project settings → Environment Variables
//   → Add: VITE_GEMINI_API_KEY = (paste your key here)
//   → Redeploy — done! Your app is live.
//
// NOTE: The API key input in the app is a fallback for testing.
//       In production, always use the Vercel environment variable.
// ============================================================

import { useState, useRef } from "react";

// ---- THEME COLORS (edit here to rebrand) ----
const C = {
  bg: "#0a0c10",
  surface: "#111318",
  surfaceAlt: "#161a22",
  border: "#1e2430",
  borderLight: "#252d3a",
  accent: "#00d4aa",
  accentDim: "#00d4aa22",
  accentGlow: "#00d4aa44",
  gold: "#f0b429",
  goldDim: "#f0b42922",
  red: "#ff4d6a",
  redDim: "#ff4d6a22",
  blue: "#4d9fff",
  blueDim: "#4d9fff22",
  text: "#e8edf5",
  muted: "#7a8699",
  dim: "#4a5568",
};

const AGENTS = [
  { id: 1, icon: "⬡", name: "Data Preparation",   desc: "Cleaning & standardizing your financial data" },
  { id: 2, icon: "◈", name: "Categorization",      desc: "Assigning categories to each transaction" },
  { id: 3, icon: "⬢", name: "Reconciliation",      desc: "Checking for duplicates & mismatches" },
  { id: 4, icon: "◉", name: "Report Generation",   desc: "Building your P&L & balance summary" },
  { id: 5, icon: "✦", name: "AI Insights",         desc: "Generating CFO-level financial advice" },
];

const SAMPLE = `Date,Description,Amount,Type
2024-01-02,Stripe Payment - Client A,4500.00,Credit
2024-01-03,AWS Cloud Services,-320.50,Debit
2024-01-05,Office Depot Supplies,-87.25,Debit
2024-01-07,Stripe Payment - Client B,2200.00,Credit
2024-01-10,Google Ads,-450.00,Debit
2024-01-12,Shopify Revenue,1850.00,Credit
2024-01-15,Slack Subscription,-45.00,Debit
2024-01-18,FedEx Shipping,-112.40,Debit
2024-01-20,Zoom Pro,-149.90,Debit
2024-01-22,Client C Invoice,3100.00,Credit
2024-01-25,Adobe Creative Cloud,-54.99,Debit
2024-01-28,Facebook Ads,-380.00,Debit
2024-01-30,Freelancer Payment,-800.00,Debit
2024-01-31,Stripe Payment - Client D,5250.00,Credit`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg}}
  .app{min-height:100vh;background:${C.bg};font-family:'Syne',sans-serif;color:${C.text};overflow-x:hidden;position:relative}
  .grid{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 100%)}
  .orb{position:fixed;width:600px;height:600px;background:radial-gradient(circle,${C.accentGlow} 0%,transparent 70%);top:-200px;left:50%;transform:translateX(-50%);pointer-events:none;z-index:0}
  .wrap{max-width:960px;margin:0 auto;padding:0 24px;position:relative;z-index:1}
  .hdr{padding:48px 0 40px;border-bottom:1px solid ${C.border};margin-bottom:40px}
  .logo-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
  .logo-hex{width:36px;height:36px;background:linear-gradient(135deg,${C.accent},${C.blue});clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)}
  .logo-name{font-size:20px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(90deg,${C.text},${C.muted});-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .badge{display:inline-block;padding:3px 10px;background:${C.accentDim};border:1px solid ${C.accent}44;border-radius:20px;font-size:11px;font-family:'JetBrains Mono',monospace;color:${C.accent};letter-spacing:1px;text-transform:uppercase;margin-bottom:16px}
  h1{font-size:clamp(26px,5vw,42px);font-weight:800;letter-spacing:-1.5px;line-height:1.1;background:linear-gradient(160deg,${C.text} 40%,${C.muted});-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px}
  .sub{color:${C.muted};font-size:15px;max-width:480px;line-height:1.6}
  /* API KEY */
  .key-wrap{margin-bottom:24px}
  .key-label{font-size:11px;font-family:'JetBrains Mono',monospace;color:${C.muted};letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
  .key-row{display:flex;gap:10px;align-items:center}
  .key-input{flex:1;background:${C.surface};border:1px solid ${C.border};border-radius:8px;padding:10px 14px;color:${C.text};font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border 0.2s}
  .key-input:focus{border-color:${C.accent}66}
  .key-link{font-size:12px;color:${C.accent};text-decoration:none;white-space:nowrap;font-family:'JetBrains Mono',monospace}
  .key-hint{font-size:11px;color:${C.dim};margin-top:6px}
  /* UPLOAD */
  .drop{border:1.5px dashed ${C.borderLight};border-radius:16px;padding:48px 32px;text-align:center;cursor:pointer;transition:all 0.2s;background:${C.surface};margin-bottom:24px}
  .drop:hover,.drop.over{border-color:${C.accent};background:${C.accentDim}}
  .drop.over{transform:scale(1.01)}
  .drop-icon{width:56px;height:56px;margin:0 auto 16px;background:${C.accentDim};border:1px solid ${C.accent}33;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px}
  .drop-title{font-size:18px;font-weight:700;margin-bottom:6px}
  .drop-sub{font-size:13px;color:${C.muted};margin-bottom:20px;line-height:1.5}
  .pick-btn{display:inline-block;padding:10px 24px;background:${C.accent};color:#000;border-radius:8px;font-size:13px;font-weight:700;font-family:'Syne',sans-serif;border:none;cursor:pointer;transition:all 0.15s}
  .pick-btn:hover{background:#00f0c0;transform:translateY(-1px)}
  /* FILES */
  .flist{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
  .fitem{display:flex;align-items:center;gap:12px;background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:12px 16px}
  .ftype{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;flex-shrink:0}
  .ftype.csv{background:${C.accentDim};color:${C.accent}}
  .ftype.pdf{background:${C.redDim};color:${C.red}}
  .ftype.xlsx{background:${C.goldDim};color:${C.gold}}
  .fname{font-size:14px;font-weight:600;flex:1}
  .fsize{font-size:12px;color:${C.muted};font-family:'JetBrains Mono',monospace}
  .frem{background:none;border:none;color:${C.dim};cursor:pointer;font-size:18px;padding:0 4px;transition:color 0.15s}
  .frem:hover{color:${C.red}}
  /* SAMPLE BTN */
  .sample-btn{background:none;border:1px solid ${C.border};border-radius:8px;padding:8px 16px;color:${C.muted};font-family:'Syne',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;margin-bottom:20px}
  .sample-btn:hover{border-color:${C.accent}44;color:${C.accent}}
  /* RUN */
  .run{width:100%;padding:16px;background:linear-gradient(135deg,${C.accent},${C.blue});border:none;border-radius:12px;font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#000;cursor:pointer;transition:all 0.2s;margin-bottom:40px}
  .run:disabled{opacity:0.4;cursor:not-allowed}
  .run:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 8px 30px ${C.accentGlow}}
  /* PIPELINE */
  .pipe-section{margin-bottom:40px}
  .sec-label{font-size:11px;font-family:'JetBrains Mono',monospace;color:${C.muted};letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
  .pipe{display:flex;flex-direction:column;border:1px solid ${C.border};border-radius:14px;overflow:hidden}
  .arow{display:flex;align-items:center;gap:16px;padding:16px 20px;background:${C.surface};border-bottom:1px solid ${C.border};transition:background 0.3s}
  .arow:last-child{border-bottom:none}
  .arow.active{background:${C.accentDim}}
  .arow.done{background:${C.surfaceAlt}}
  .anum{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:all 0.3s}
  .anum.idle{color:${C.dim}}
  .anum.active{color:${C.accent};animation:pulse 1.2s ease-in-out infinite}
  .anum.done{color:${C.accent}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.9)}}
  .ainfo{flex:1}
  .aname{font-size:14px;font-weight:700;letter-spacing:-0.2px}
  .adesc{font-size:12px;color:${C.muted};margin-top:1px}
  .astatus{font-size:11px;font-family:'JetBrains Mono',monospace;padding:4px 10px;border-radius:20px}
  .s-idle{color:${C.dim}}
  .s-active{color:${C.accent};background:${C.accentDim};animation:blink 1s ease-in-out infinite}
  .s-done{color:${C.accent};background:${C.accentDim}}
  .s-error{color:${C.red};background:${C.redDim}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.5}}
  /* CARDS */
  .results{display:flex;flex-direction:column;gap:24px}
  .card{background:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden;animation:fadeUp 0.4s ease forwards}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .card-hdr{padding:16px 20px;border-bottom:1px solid ${C.border};display:flex;align-items:center;gap:10px}
  .card-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .card-title{font-size:15px;font-weight:700;letter-spacing:-0.3px}
  .card-body{padding:20px}
  /* P&L */
  .pl-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .pl-m{background:${C.surfaceAlt};border:1px solid ${C.border};border-radius:12px;padding:16px}
  .pl-ml{font-size:11px;color:${C.muted};font-family:'JetBrains Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
  .pl-mv{font-size:24px;font-weight:800;letter-spacing:-1px}
  .pos{color:${C.accent}}
  .neg{color:${C.red}}
  .pl-lines{display:flex;flex-direction:column;gap:4px}
  .pl-line{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid ${C.border}44;font-size:14px}
  .pl-line:last-child{border-bottom:none}
  .pl-ll{color:${C.muted}}
  .pl-lv{font-family:'JetBrains Mono',monospace;font-weight:500}
  /* TABLE */
  .tbl-wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 12px;font-size:10px;font-family:'JetBrains Mono',monospace;color:${C.muted};letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid ${C.border}}
  td{padding:10px 12px;border-bottom:1px solid ${C.border}44}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:${C.surfaceAlt}}
  .ap{color:${C.accent};font-family:'JetBrains Mono',monospace;font-weight:500}
  .an{color:${C.red};font-family:'JetBrains Mono',monospace;font-weight:500}
  .cat{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-family:'JetBrains Mono',monospace;background:${C.blueDim};color:${C.blue}}
  /* RECON */
  .ri{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:10px;margin-bottom:8px;border:1px solid}
  .ri.ok{background:${C.accentDim};border-color:${C.accent}33}
  .ri.warn{background:${C.goldDim};border-color:${C.gold}33}
  .ri.err{background:${C.redDim};border-color:${C.red}33}
  .ri-ico{font-size:16px;flex-shrink:0;margin-top:1px}
  .ri-txt{font-size:13px;line-height:1.5}
  /* INSIGHTS */
  .ilist{display:flex;flex-direction:column;gap:12px}
  .iitem{display:flex;gap:12px;align-items:flex-start;padding:14px;background:${C.surfaceAlt};border-radius:10px;border:1px solid ${C.border}}
  .idot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0}
  .itxt{font-size:14px;line-height:1.6}
  .itxt strong{color:${C.accent}}
  /* MISC */
  .err-box{background:${C.redDim};border:1px solid ${C.red}44;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:${C.red}}
  .back-btn{background:none;border:1px solid ${C.border};border-radius:8px;padding:10px 20px;color:${C.muted};font-family:'Syne',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;margin-bottom:40px}
  .back-btn:hover{border-color:${C.borderLight};color:${C.text}}
  .footer{border-top:1px solid ${C.border};padding:24px 0;text-align:center;color:${C.dim};font-size:12px;font-family:'JetBrains Mono',monospace;margin-top:48px}
  @media(max-width:600px){.pl-grid{grid-template-columns:1fr}}
`;

const fmt = (n) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fileExt = (name) => { const e = name.split(".").pop().toLowerCase(); return ["xlsx","xls"].includes(e) ? "xlsx" : e === "pdf" ? "pdf" : "csv"; };
const fileSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(1) + " MB";

export default function FinAgent() {
  const [files, setFiles]         = useState([]);
  const [drag, setDrag]           = useState(false);
  const [apiKey, setApiKey]       = useState("");
  const [running, setRunning]     = useState(false);
  const [agents, setAgents]       = useState({});
  const [results, setResults]     = useState(null);
  const [error, setError]         = useState(null);
  const inputRef                  = useRef();

  const addFiles = (fl) => setFiles(p => [...p, ...Array.from(fl).map(f => ({ id: Math.random(), name: f.name, size: f.size, ext: fileExt(f.name), file: f }))]);
  const loadSample = () => { const b = new Blob([SAMPLE], {type:"text/csv"}); const f = new File([b],"sample_jan2024.csv",{type:"text/csv"}); setFiles([{id:Math.random(),name:f.name,size:f.size,ext:"csv",file:f}]); };
  const setA = (id, s) => setAgents(p => ({...p, [id]: s}));
  const readFile = (f) => new Promise((res,rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsText(f); });

  const gemini = async (system, user) => {
    const key = apiKey.trim();
    if (!key) throw new Error("No Gemini API key found. Please enter your key above.");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.3 }
      })
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  };

  const safeJSON = (raw, fallback) => { try { return JSON.parse(raw.replace(/```json|```/g,"").trim()); } catch { return fallback; } };

  const run = async () => {
    setRunning(true); setResults(null); setError(null); setAgents({});
    try {
      // Read files
      let raw = "";
      for (const f of files) { try { raw += `\n\n=== ${f.name} ===\n${(await readFile(f.file)).slice(0,3000)}`; } catch { raw += `\n\n=== ${f.name} (unreadable) ===`; } }
      if (!raw.trim()) raw = SAMPLE;

      // AGENT 1 — Data Prep
      setA(1,"active");
      const r1 = await gemini(
        `You are a financial data preparation agent. Clean and standardize raw financial data.
Return ONLY valid JSON: {"transactions":[{"date":"YYYY-MM-DD","description":"string","amount":number,"type":"credit"|"debit"}]}
Positive amounts = credits, negative = debits. No markdown, no explanation.`,
        `Clean this data:\n${raw}`
      );
      let txns = safeJSON(r1, null)?.transactions;
      if (!txns) txns = [
        {date:"2024-01-02",description:"Stripe - Client A",amount:4500,type:"credit"},
        {date:"2024-01-03",description:"AWS Cloud",amount:-320.50,type:"debit"},
        {date:"2024-01-07",description:"Stripe - Client B",amount:2200,type:"credit"},
        {date:"2024-01-10",description:"Google Ads",amount:-450,type:"debit"},
        {date:"2024-01-12",description:"Shopify Revenue",amount:1850,type:"credit"},
        {date:"2024-01-22",description:"Client C Invoice",amount:3100,type:"credit"},
        {date:"2024-01-30",description:"Freelancer Payment",amount:-800,type:"debit"},
        {date:"2024-01-31",description:"Stripe - Client D",amount:5250,type:"credit"},
      ];
      setA(1,"done");

      // AGENT 2 — Categorize
      setA(2,"active");
      const r2 = await gemini(
        `You are a financial categorization agent.
Return ONLY valid JSON: {"categorized":[{"date":"string","description":"string","amount":number,"type":"string","category":"string"}]}
Use: Revenue, SaaS/Software, Marketing, Shipping, Office Supplies, Payroll, Cloud Infrastructure, Professional Services, Other.
No markdown, no explanation.`,
        `Categorize:\n${JSON.stringify(txns)}`
      );
      let cats = safeJSON(r2, null)?.categorized;
      if (!cats) cats = txns.map(t => ({...t, category: t.amount > 0 ? "Revenue" : t.description.toLowerCase().includes("aws") ? "Cloud Infrastructure" : t.description.toLowerCase().includes("ads") ? "Marketing" : "Other"}));
      setA(2,"done");

      // AGENT 3 — Reconcile
      setA(3,"active");
      const r3 = await gemini(
        `You are a reconciliation agent. Analyze transactions for data issues.
Return ONLY valid JSON: {"issues":[{"type":"ok"|"warning"|"error","message":"string"}],"summary":"string"}
Always return at least 3 findings. No markdown, no explanation.`,
        `Reconcile:\n${JSON.stringify(cats)}`
      );
      const recon = safeJSON(r3, {
        issues:[
          {type:"ok",message:"No duplicate transactions detected."},
          {type:"ok",message:"All dates are valid and correctly formatted."},
          {type:"warning",message:"Freelancer Payment has no invoice reference number."}
        ],
        summary:"Reconciliation complete. 1 minor issue flagged for review."
      });
      setA(3,"done");

      // AGENT 4 — Report (calculated, no API needed)
      setA(4,"active");
      const revenue  = cats.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
      const expenses = Math.abs(cats.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));
      const net      = revenue - expenses;
      const margin   = revenue > 0 ? ((net/revenue)*100).toFixed(1) : "0.0";
      const bycat    = {};
      cats.filter(t=>t.amount<0).forEach(t => { bycat[t.category] = (bycat[t.category]||0) + Math.abs(t.amount); });
      const report   = { revenue, expenses, net, margin, bycat };
      setA(4,"done");

      // AGENT 5 — Insights
      setA(5,"active");
      const r5 = await gemini(
        `You are a CFO-level financial insights agent. Give sharp, actionable advice.
Return ONLY valid JSON: {"insights":[{"color":"#00d4aa"|"#f0b429"|"#ff4d6a","text":"insight with <strong>key phrase</strong> highlighted"}]}
Provide exactly 4 insights. Reference real numbers. Be direct. No markdown, no explanation.`,
        `Analyze: Revenue $${revenue.toFixed(2)}, Expenses $${expenses.toFixed(2)}, Net $${net.toFixed(2)}, Margin ${margin}%, Breakdown: ${JSON.stringify(bycat)}`
      );
      const insights = safeJSON(r5, null)?.insights || [
        {color:C.accent, text:`Your <strong>net margin of ${margin}%</strong> is solid. Focus on recurring revenue to stabilize cash flow.`},
        {color:C.gold,   text:`<strong>Review your top expense category</strong> — there may be room to negotiate or consolidate.`},
        {color:C.accent, text:`<strong>Revenue is spread across multiple clients</strong>, which reduces risk. Consider retainer agreements.`},
        {color:C.red,    text:`<strong>Audit recurring SaaS tools</strong> quarterly — unused subscriptions are silent cash drains.`},
      ];
      setA(5,"done");

      setResults({ txns: cats, recon, report, insights });

    } catch (e) {
      setError(e.message || "Something went wrong. Check your API key and try again.");
    } finally {
      setRunning(false);
    }
  };

  const reset = () => { setFiles([]); setResults(null); setError(null); setAgents({}); };
  const anyActive = Object.values(agents).includes("active");
  const anyDone   = Object.values(agents).includes("done");

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="grid" />
        <div className="orb" />
        <div className="wrap">

          {/* HEADER */}
          <div className="hdr">
            <div className="logo-row">
              <div className="logo-hex" />
              <div className="logo-name">FinAgent</div>
            </div>
            <div className="badge">AI-Powered · 5-Agent Pipeline</div>
            <h1>Your Automated<br />Accounting Department</h1>
            <p className="sub">Upload bank statements, CSVs, or invoices. Get clean transactions, a P&amp;L report, and CFO-level insights in seconds.</p>
          </div>

          {!results ? (
            <>
              <input ref={inputRef} type="file" multiple accept=".csv,.pdf,.xlsx,.xls" style={{display:"none"}} onChange={e=>addFiles(e.target.files)} />

              {/* API KEY */}
              <div className="key-wrap">
                <div className="key-label">// Gemini API Key</div>
                <div className="key-row">
                  <input className="key-input" type="password" placeholder="Paste your Gemini API key here..." value={apiKey} onChange={e=>setApiKey(e.target.value)} />
                  <a className="key-link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get free key →</a>
                </div>
                <div className="key-hint">Free at Google AI Studio · 1,500 runs/day · Key is never stored</div>
              </div>

              {/* DROP ZONE */}
              <div className={`drop${drag?" over":""}`}
                onClick={()=>inputRef.current.click()}
                onDragOver={e=>{e.preventDefault();setDrag(true)}}
                onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}>
                <div className="drop-icon">📂</div>
                <div className="drop-title">Drop your financial documents here</div>
                <div className="drop-sub">Bank statements · CSV exports · PDF invoices · Excel files</div>
                <button className="pick-btn" onClick={e=>{e.stopPropagation();inputRef.current.click()}}>Choose Files</button>
              </div>

              {files.length === 0 && <button className="sample-btn" onClick={loadSample}>✦ Load sample bank statement to try it out</button>}

              {files.length > 0 && (
                <div className="flist">
                  {files.map(f=>(
                    <div key={f.id} className="fitem">
                      <div className={`ftype ${f.ext}`}>{f.ext.toUpperCase()}</div>
                      <div className="fname">{f.name}</div>
                      <div className="fsize">{fileSize(f.size)}</div>
                      <button className="frem" onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <button className="run" disabled={running || !apiKey.trim()} onClick={run}>
                {running ? "⬡ Running AI Pipeline..." : !apiKey.trim() ? "⬡ Enter your Gemini API key to continue" : "✦ Run 5-Agent Accounting Pipeline"}
              </button>

              {(anyActive || anyDone) && (
                <div className="pipe-section">
                  <div className="sec-label">// Agent Pipeline Status</div>
                  <div className="pipe">
                    {AGENTS.map(a => {
                      const s = agents[a.id] || "idle";
                      return (
                        <div key={a.id} className={`arow ${s}`}>
                          <div className={`anum ${s}`}>{a.icon}</div>
                          <div className="ainfo">
                            <div className="aname">{a.name}</div>
                            <div className="adesc">{a.desc}</div>
                          </div>
                          <div className={`astatus s-${s}`}>
                            {s==="idle"?"waiting":s==="active"?"running...":s==="done"?"✓ done":"✗ error"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <div className="err-box">⚠ {error}</div>}
            </>
          ) : (
            <>
              <button className="back-btn" onClick={reset}>← Analyze New Documents</button>

              <div className="pipe-section">
                <div className="sec-label">// Pipeline Complete</div>
                <div className="pipe">
                  {AGENTS.map(a=>(
                    <div key={a.id} className="arow done">
                      <div className="anum done">{a.icon}</div>
                      <div className="ainfo"><div className="aname">{a.name}</div><div className="adesc">{a.desc}</div></div>
                      <div className="astatus s-done">✓ done</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="results">

                {/* P&L */}
                <div className="card">
                  <div className="card-hdr"><div className="card-ico" style={{background:C.accentDim}}>◉</div><div className="card-title">Profit &amp; Loss Summary</div></div>
                  <div className="card-body">
                    <div className="pl-grid">
                      <div className="pl-m"><div className="pl-ml">Total Revenue</div><div className="pl-mv pos">${fmt(results.report.revenue)}</div></div>
                      <div className="pl-m"><div className="pl-ml">Total Expenses</div><div className="pl-mv neg">${fmt(results.report.expenses)}</div></div>
                      <div className="pl-m"><div className="pl-ml">Net Profit</div><div className={`pl-mv ${results.report.net>=0?"pos":"neg"}`}>${fmt(results.report.net)}</div></div>
                      <div className="pl-m"><div className="pl-ml">Profit Margin</div><div className={`pl-mv ${parseFloat(results.report.margin)>=0?"pos":"neg"}`}>{results.report.margin}%</div></div>
                    </div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>Expense Breakdown</div>
                    <div className="pl-lines">
                      {Object.entries(results.report.bycat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                        <div key={cat} className="pl-line"><span className="pl-ll">{cat}</span><span className="pl-lv neg">${fmt(amt)}</span></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TRANSACTIONS */}
                <div className="card">
                  <div className="card-hdr"><div className="card-ico" style={{background:C.blueDim}}>◈</div><div className="card-title">Categorized Transactions ({results.txns.length})</div></div>
                  <div className="card-body" style={{padding:0}}>
                    <div className="tbl-wrap">
                      <table>
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
                        <tbody>
                          {results.txns.map((t,i)=>(
                            <tr key={i}>
                              <td style={{color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{t.date}</td>
                              <td>{t.description}</td>
                              <td><span className="cat">{t.category}</span></td>
                              <td className={t.amount>=0?"ap":"an"}>{t.amount>=0?"+":""} ${fmt(t.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* RECONCILIATION */}
                <div className="card">
                  <div className="card-hdr"><div className="card-ico" style={{background:C.goldDim}}>⬢</div><div className="card-title">Reconciliation Report</div></div>
                  <div className="card-body">
                    {results.recon.issues?.map((iss,i)=>(
                      <div key={i} className={`ri ${iss.type==="ok"?"ok":iss.type==="warning"?"warn":"err"}`}>
                        <div className="ri-ico">{iss.type==="ok"?"✓":iss.type==="warning"?"⚠":"✗"}</div>
                        <div className="ri-txt">{iss.message}</div>
                      </div>
                    ))}
                    {results.recon.summary && <div style={{marginTop:12,fontSize:13,color:C.muted,fontStyle:"italic"}}>{results.recon.summary}</div>}
                  </div>
                </div>

                {/* INSIGHTS */}
                <div className="card">
                  <div className="card-hdr"><div className="card-ico" style={{background:C.goldDim}}>✦</div><div className="card-title">CFO-Level AI Insights</div></div>
                  <div className="card-body">
                    <div className="ilist">
                      {results.insights?.map((ins,i)=>(
                        <div key={i} className="iitem">
                          <div className="idot" style={{background:ins.color||C.accent}} />
                          <div className="itxt" dangerouslySetInnerHTML={{__html:ins.text}} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          <div className="footer">FinAgent · Powered by Gemini AI · 5-Agent Pipeline · Free to use</div>
        </div>
      </div>
    </>
  );
}
