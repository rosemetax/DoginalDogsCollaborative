import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Folder, FileText, Plus, ChevronRight, ChevronDown, Trash2, Search, X, Menu,
  Edit3, Paperclip, Image as ImageIcon, Table2, History, Columns2, Rows2,
  LayoutGrid, Check, Download, File as FileIcon, Book, LogOut, Users, Eye,
  Pencil, ShieldCheck, RefreshCw, Loader2,
  Bold, Italic, Underline, Highlighter, List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight, Link2, Calendar, Type, Palette,
  Heading1, Heading2, Heading3, Tag, Home, PlusSquare, Eye as EyeIcon,
  Strikethrough, Grid3x3, PanelLeft, PanelTop, Baseline,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
//  DOGINAL DOGS NOTEBOOK — multi-user, Supabase-backed
//  Sign in with X handle + passcode · OneNote-style edit/view access
//  Palette + type from the official brand kit (retro pastel, pixel)
// ══════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://bydmrhgfboqnbhcxjziw.supabase.co";
const SUPABASE_KEY = "sb_publishable_hQHcBt5VeB-BQPhhaCA6cA_0j1sQfg7";

const GARY_HEAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABQCAYAAABRX4iyAAACIklEQVR4nO2cIU8DQRBGu6T/gKQkKBwhSFwdCBKqkcUgQWJBgQWJrKESDQ5cHZJgUSQ04TccunuTdL65veYC77m77O5tXqZzk7m7pqqqehFSSqGJVVWl0AWDePfp2dda8+38H5AlgCwBZAn0PYOsJHl7dhS6YPTGEMW7z3xfVsInsgSQJYAsgWQVpfnvN5qfLu6fa+eia0WJ7sGaR2QJIEsAWQLIEnAVpV7ypHg62nPNGx8PF46nj7PwHvK1LKJJn8gSQJYAsgSQJWBW8LVBzk5BntB3twauTbx/zpeOKbnW5Olt6Ri6Dg1BlgCyBJAl4KrgrWRnJX1vEs7JE65107k7HxVba5Lqjwh5blgYZAkgS8BVlJoTCz4e6wJ5J4KitCHIEkCWALIEiraVPS3daMvYWnvj4GrpvO+X62J7ILIEkCWALAFkCYQreHOxrKp/uBnXxhwOt4tdryT5zYIKviHIEkCWQKs5y6ILecwqZumUFgZZAsgSQJZAa21l670Dz3sGbRP9jI/IEkCWALIEkCVQtK2cY737YL3BvD/cKXbNk8vpwnHJb7KJLAFkCSBLYOWf/Vp57HX2sXBcMoeVhMgSQJYAsgSQJdBqUeolT/p5wu/1upH0iSwBZAkgSwBZAq3+CUZJBpvrtXPWjSDHamPTVl4ByBJAlgCyBDpRwXuYf/3UzkU/2YtCZAkgSwBZAv2/9ilcmxBZAsgSQJYAsgR+AeVGo+P+RDSKAAAAAElFTkSuQmCC";

const BRAND = {
  cream: "#f8e49e", creamSoft: "#fdf6d8", paper: "#fffef7", fur: "#8d6a49",
  furSoft: "#a3845c", muzzle: "#e9be83", dark: "#624a33", ink: "#2a2118",
  pink: "#ffd0eb", rose: "#ffb1dd", purple: "#debcff", blue: "#64ffff",
  aqua: "#4ffcd1", green: "#8dffa4", yellow: "#ffe154", red: "#ff7d82",
};
const STRIPE = [BRAND.red, BRAND.yellow, BRAND.green, BRAND.aqua, BRAND.blue, BRAND.purple, BRAND.rose, BRAND.pink];

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const fmt = (t) => new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// Avatar: shows uploaded picture, else colored initial. `px` = pixel size.
function Avatar({ name, color, avatar, px = 32, ring }) {
  const s = { width: px, height: px };
  if (avatar) return <img src={avatar} alt={name} className={`rounded-full object-cover shrink-0 ${ring ? "ring-2 ring-white" : ""}`} style={s} />;
  return (
    <span className={`grid place-items-center rounded-full text-white font-bold shrink-0 ${ring ? "ring-2 ring-white" : ""}`}
      style={{ ...s, background: color || "#8d6a49", fontSize: Math.max(9, Math.round(px * 0.42)) }}>
      {(name || "?")[0]?.toUpperCase()}
    </span>
  );
}

// ── Supabase RPC helper ─────────────────────────────────────────
async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(args || {}),
  });
  const text = await res.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = (body && (body.message || body.hint || body.details)) || (typeof body === "string" ? body : "Request failed");
    throw new Error(msg);
  }
  return body;
}

// session persistence (identity only — passcode is never stored)
const SESSION_KEY = "ddn:session:v1";
async function saveSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} }
async function loadSession() { try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
async function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch {} }

function IconBtn({ onClick, title, children, danger, active, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} title={title} disabled={disabled}
      className={`grid place-items-center h-7 w-7 rounded-md transition ${disabled ? "opacity-30 cursor-not-allowed" : active ? "bg-[#8d6a49] text-white" : danger ? "text-rose-500 hover:bg-rose-50" : "text-[#8d6a49]/60 hover:text-[#624a33] hover:bg-[#f8e49e]/60"}`}>
      {children}
    </button>
  );
}

function InlineEdit({ value, onSave, className, autoFocus, placeholder, style, disabled }) {
  const [v, setV] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setV(value); }, [value]);
  useEffect(() => { if (autoFocus && ref.current) { ref.current.focus(); ref.current.select(); } }, [autoFocus]);
  if (disabled) return <span className={className} style={style}>{value || placeholder}</span>;
  return (
    <input ref={ref} value={v} placeholder={placeholder} style={style}
      onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v.trim() || value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } if (e.key === "Escape") { setV(value); e.target.blur(); } }}
      className={className} />
  );
}

// ── Login screen ────────────────────────────────────────────────
function Login({ onLogin }) {
  const [handle, setHandle] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const go = async () => {
    setErr(""); setNote(""); setBusy(true);
    try {
      const rows = await rpc("ddn_login", { p_handle: handle, p_pass: pass });
      const u = Array.isArray(rows) ? rows[0] : rows;
      if (!u) throw new Error("Login failed");
      if (u.created) setNote("Account created — welcome to the pack!");
      onLogin({ id: u.id, handle: u.display, color: u.color, avatar: u.avatar });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="h-screen grid place-items-center px-4" style={{ background: BRAND.cream, fontFamily: "'Nunito', system-ui" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka:wght@500;600;700&family=Press+Start+2P&display=swap" rel="stylesheet" />
      <div className="w-full max-w-sm">
        <div className="flex h-1.5 rounded-t-2xl overflow-hidden">{STRIPE.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}</div>
        <div className="bg-white rounded-b-2xl shadow-xl p-7 border-2 border-t-0 border-[#8d6a49]/20">
          <div className="flex flex-col items-center text-center mb-6">
            <img src={GARY_HEAD} alt="Gary" className="h-16 w-16 mb-3" style={{ imageRendering: "pixelated" }} />
            <div className="text-[#624a33]" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, lineHeight: 1.5 }}>DOGINAL DOGS</div>
            <div className="text-[#8d6a49]/80 text-sm mt-1.5" style={{ fontFamily: "'Fredoka', sans-serif" }}>Collaborative notebook</div>
          </div>

          <label className="block text-xs font-bold text-[#8d6a49] mb-1">Your X handle</label>
          <div className="flex items-center rounded-xl border-2 border-[#8d6a49]/25 focus-within:border-[#8d6a49] mb-3 overflow-hidden">
            <span className="pl-3 pr-1 text-[#8d6a49] font-bold">@</span>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="rosemetax" onKeyDown={(e) => e.key === "Enter" && go()}
              className="flex-1 py-2.5 pr-3 outline-none text-[#2a2118]" autoCapitalize="none" autoCorrect="off" />
          </div>

          <label className="block text-xs font-bold text-[#8d6a49] mb-1">Passcode</label>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="at least 4 characters" onKeyDown={(e) => e.key === "Enter" && go()}
            className="w-full py-2.5 px-3 rounded-xl border-2 border-[#8d6a49]/25 focus:border-[#8d6a49] outline-none mb-1 text-[#2a2118]" />
          <p className="text-[11px] text-[#8d6a49]/70 mb-4">First time? Pick any passcode — it creates your account. It's how we know it's really you next time.</p>

          {err && <div className="mb-3 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</div>}
          {note && <div className="mb-3 text-sm text-[#2a7d4a] bg-[#8dffa4]/25 rounded-lg px-3 py-2">{note}</div>}

          <button onClick={go} disabled={busy || !handle || pass.length < 4}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-105 transition"
            style={{ background: BRAND.fur }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Enter the notebook
          </button>
        </div>
        <p className="text-center text-[11px] text-[#8d6a49]/70 mt-3">Your handle is your identity — every edit is signed with it.</p>
      </div>
    </div>
  );
}

// ── Tag definitions (OneNote-style) ─────────────────────────────
const TAGS = {
  todo: { label: "To-do", color: "#8d6a49", prefix: "☐ " },
  done: { label: "Done", color: "#2a7d4a", prefix: "☑ " },
  important: { label: "Important", color: "#ff7d82", prefix: "★ " },
  question: { label: "Question", color: "#debcff", prefix: "❓ " },
  idea: { label: "Idea", color: "#ffe154", prefix: "💡 " },
};

const FONTS = ["Nunito", "Fredoka", "Georgia", "Courier New", "Arial", "Comic Sans MS"];
const SIZES = [
  { label: "Small", v: "2" }, { label: "Normal", v: "3" },
  { label: "Large", v: "5" }, { label: "Huge", v: "6" },
];
const TEXT_COLORS = ["#2a2118", "#8d6a49", "#ff7d82", "#2a7d4a", "#5b3a8a", "#1f6f8b", "#c98a00"];
const HILITES = ["#ffe154", "#8dffa4", "#64ffff", "#ffb1dd", "#debcff", "#ffd0eb"];

// ── Grid picker: choose rows × cols by hovering boxes ────────────
function GridPicker({ onPick, onClose, max = 8 }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const cells = [];
  for (let r = 1; r <= max; r++) for (let c = 1; c <= max; c++) cells.push({ r, c });
  return (
    <div className="absolute z-50 mt-1 p-3 bg-white rounded-xl shadow-xl border-2 border-[#8d6a49]/25" onMouseLeave={() => setHover({ r: 0, c: 0 })}>
      <div className="text-xs font-bold text-[#624a33] mb-2 text-center">
        {hover.r > 0 ? `${hover.r} × ${hover.c} table` : "Drag to size your table"}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${max}, 1fr)` }}>
        {cells.map(({ r, c }) => {
          const on = r <= hover.r && c <= hover.c;
          return (
            <button key={`${r}-${c}`}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => { onPick(hover.r || r, hover.c || c); onClose(); }}
              className="w-5 h-5 rounded-sm border transition"
              style={{ background: on ? "#8d6a49" : "#fdf6d8", borderColor: on ? "#624a33" : "#8d6a49aa" }} />
          );
        })}
      </div>
      <div className="flex justify-end mt-2">
        <button onClick={onClose} className="text-xs text-[#8d6a49] hover:text-[#624a33]">Cancel</button>
      </div>
    </div>
  );
}

// small dropdown wrapper
function Dropdown({ open, onClose, children, className }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={`absolute z-50 mt-1 bg-white rounded-xl shadow-xl border-2 border-[#8d6a49]/25 py-1.5 ${className || ""}`}>{children}</div>
    </>
  );
}

function RibBtn({ onClick, title, active, children, disabled, label }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={disabled ? undefined : onClick} title={title} disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[38px] h-12 px-1.5 rounded-lg text-[10px] font-semibold transition ${disabled ? "opacity-30" : active ? "bg-[#8d6a49] text-white" : "text-[#624a33] hover:bg-[#f8e49e]/70"}`}>
      {children}
      {label && <span className="leading-none">{label}</span>}
    </button>
  );
}
function Sep() { return <div className="w-px self-stretch bg-[#8d6a49]/15 mx-1 my-1" />; }

// ── The ribbon (Home / Insert / View / History tabs) ────────────
function Ribbon({ tab, setTab, exec, canEdit, onInsertTable, onInsertPhoto, onInsertFile, onInsertLink, onInsertDate, onTag, viewProps, onHistory }) {
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [hiOpen, setHiOpen] = useState(false);
  const [headOpen, setHeadOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "insert", label: "Insert", icon: PlusSquare },
    { id: "view", label: "View", icon: EyeIcon },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="border-b-2 border-[#8d6a49]/20 bg-[#fffef7] shrink-0">
      {/* tab strip */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-lg text-sm font-bold transition ${tab === t.id ? "bg-[#f8e49e]/60 text-[#624a33]" : "text-[#8d6a49]/70 hover:text-[#624a33] hover:bg-[#f8e49e]/30"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* tab body */}
      <div className="flex items-stretch gap-0.5 px-2 py-1.5 bg-[#f8e49e]/25 overflow-x-auto min-h-[60px]">
        {tab === "home" && (
          <>
            {/* font */}
            <div className="relative">
              <RibBtn title="Font" onClick={() => setFontOpen((v) => !v)} disabled={!canEdit} label="Font"><Type className="w-4 h-4" /></RibBtn>
              <Dropdown open={fontOpen} onClose={() => setFontOpen(false)} className="w-40">
                {FONTS.map((f) => <button key={f} onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("fontName", f); setFontOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#f8e49e]/50 text-[#624a33]" style={{ fontFamily: f }}>{f}</button>)}
              </Dropdown>
            </div>
            <div className="relative">
              <RibBtn title="Size" onClick={() => setSizeOpen((v) => !v)} disabled={!canEdit} label="Size"><Baseline className="w-4 h-4" /></RibBtn>
              <Dropdown open={sizeOpen} onClose={() => setSizeOpen(false)} className="w-28">
                {SIZES.map((s) => <button key={s.v} onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("fontSize", s.v); setSizeOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#f8e49e]/50 text-[#624a33]">{s.label}</button>)}
              </Dropdown>
            </div>
            <Sep />
            <RibBtn title="Bold" onClick={() => exec("bold")} disabled={!canEdit}><Bold className="w-4 h-4" /></RibBtn>
            <RibBtn title="Italic" onClick={() => exec("italic")} disabled={!canEdit}><Italic className="w-4 h-4" /></RibBtn>
            <RibBtn title="Underline" onClick={() => exec("underline")} disabled={!canEdit}><Underline className="w-4 h-4" /></RibBtn>
            <RibBtn title="Strikethrough" onClick={() => exec("strikeThrough")} disabled={!canEdit}><Strikethrough className="w-4 h-4" /></RibBtn>
            <div className="relative">
              <RibBtn title="Text color" onClick={() => setColorOpen((v) => !v)} disabled={!canEdit}><Palette className="w-4 h-4" /></RibBtn>
              <Dropdown open={colorOpen} onClose={() => setColorOpen(false)} className="p-2">
                <div className="grid grid-cols-4 gap-1.5">{TEXT_COLORS.map((c) => <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("foreColor", c); setColorOpen(false); }} className="w-7 h-7 rounded-md border border-[#8d6a49]/30" style={{ background: c }} />)}</div>
              </Dropdown>
            </div>
            <div className="relative">
              <RibBtn title="Highlight" onClick={() => setHiOpen((v) => !v)} disabled={!canEdit}><Highlighter className="w-4 h-4" /></RibBtn>
              <Dropdown open={hiOpen} onClose={() => setHiOpen(false)} className="p-2">
                <div className="grid grid-cols-3 gap-1.5">{HILITES.map((c) => <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("hiliteColor", c); setHiOpen(false); }} className="w-7 h-7 rounded-md border border-[#8d6a49]/30" style={{ background: c }} />)}</div>
              </Dropdown>
            </div>
            <Sep />
            {/* styles */}
            <div className="relative">
              <RibBtn title="Heading styles" onClick={() => setHeadOpen((v) => !v)} disabled={!canEdit} label="Styles"><Heading1 className="w-4 h-4" /></RibBtn>
              <Dropdown open={headOpen} onClose={() => setHeadOpen(false)} className="w-40">
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("formatBlock", "H1"); setHeadOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f8e49e]/50 text-[#624a33] font-bold text-lg">Heading 1</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("formatBlock", "H2"); setHeadOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f8e49e]/50 text-[#624a33] font-bold text-base">Heading 2</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("formatBlock", "H3"); setHeadOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f8e49e]/50 text-[#624a33] font-bold text-sm">Heading 3</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("formatBlock", "P"); setHeadOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f8e49e]/50 text-[#624a33] text-sm">Normal text</button>
              </Dropdown>
            </div>
            <Sep />
            {/* lists */}
            <RibBtn title="Bullet list" onClick={() => exec("insertUnorderedList")} disabled={!canEdit}><List className="w-4 h-4" /></RibBtn>
            <RibBtn title="Numbered list" onClick={() => exec("insertOrderedList")} disabled={!canEdit}><ListOrdered className="w-4 h-4" /></RibBtn>
            <RibBtn title="Checkbox" onClick={() => onTag("todo")} disabled={!canEdit}><CheckSquare className="w-4 h-4" /></RibBtn>
            <Sep />
            {/* align */}
            <RibBtn title="Align left" onClick={() => exec("justifyLeft")} disabled={!canEdit}><AlignLeft className="w-4 h-4" /></RibBtn>
            <RibBtn title="Center" onClick={() => exec("justifyCenter")} disabled={!canEdit}><AlignCenter className="w-4 h-4" /></RibBtn>
            <RibBtn title="Align right" onClick={() => exec("justifyRight")} disabled={!canEdit}><AlignRight className="w-4 h-4" /></RibBtn>
            <Sep />
            {/* tags */}
            <div className="relative">
              <RibBtn title="Tags" onClick={() => setTagOpen((v) => !v)} disabled={!canEdit} label="Tags"><Tag className="w-4 h-4" /></RibBtn>
              <Dropdown open={tagOpen} onClose={() => setTagOpen(false)} className="w-44">
                {Object.entries(TAGS).map(([k, t]) => <button key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => { onTag(k); setTagOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#f8e49e]/50 text-[#624a33]"><span>{t.prefix}</span>{t.label}</button>)}
              </Dropdown>
            </div>
          </>
        )}

        {tab === "insert" && (
          <>
            <div className="relative">
              <RibBtn title="Insert table" onClick={() => setGridOpen((v) => !v)} disabled={!canEdit} label="Table"><Grid3x3 className="w-4 h-4" /></RibBtn>
              {gridOpen && <GridPicker onPick={(r, c) => onInsertTable(r, c)} onClose={() => setGridOpen(false)} />}
            </div>
            <RibBtn title="Picture" onClick={onInsertPhoto} disabled={!canEdit} label="Picture"><ImageIcon className="w-4 h-4" /></RibBtn>
            <RibBtn title="Attach file" onClick={onInsertFile} disabled={!canEdit} label="File"><Paperclip className="w-4 h-4" /></RibBtn>
            <RibBtn title="Insert link" onClick={onInsertLink} disabled={!canEdit} label="Link"><Link2 className="w-4 h-4" /></RibBtn>
            <RibBtn title="Date & time" onClick={onInsertDate} disabled={!canEdit} label="Date"><Calendar className="w-4 h-4" /></RibBtn>
          </>
        )}

        {tab === "view" && (
          <>
            <RibBtn title="Standard width" active={viewProps.view === "standard"} onClick={() => viewProps.setView("standard")} label="Standard"><Rows2 className="w-4 h-4" /></RibBtn>
            <RibBtn title="Wide" active={viewProps.view === "wide"} onClick={() => viewProps.setView("wide")} label="Wide"><Columns2 className="w-4 h-4" /></RibBtn>
            <RibBtn title="Compact" active={viewProps.view === "compact"} onClick={() => viewProps.setView("compact")} label="Compact"><LayoutGrid className="w-4 h-4" /></RibBtn>
            <Sep />
            <RibBtn title="No rule lines" active={viewProps.rule === "none"} onClick={() => viewProps.setRule("none")} label="Plain"><X className="w-4 h-4" /></RibBtn>
            <RibBtn title="Ruled lines" active={viewProps.rule === "ruled"} onClick={() => viewProps.setRule("ruled")} label="Ruled"><Rows2 className="w-4 h-4" /></RibBtn>
            <RibBtn title="Grid lines" active={viewProps.rule === "grid"} onClick={() => viewProps.setRule("grid")} label="Grid"><Grid3x3 className="w-4 h-4" /></RibBtn>
            <Sep />
            {viewProps.pageColors.map((c) => (
              <button key={c} onClick={() => viewProps.setPageColor(c)} title="Page color"
                className={`w-7 h-7 rounded-md border-2 self-center mx-0.5 ${viewProps.pageColor === c ? "border-[#624a33]" : "border-[#8d6a49]/30"}`} style={{ background: c }} />
            ))}
            <Sep />
            <RibBtn title="Vertical tabs (sidebar)" active={viewProps.tabsLayout === "vertical"} onClick={() => viewProps.setTabsLayout("vertical")} label="V-Tabs"><PanelLeft className="w-4 h-4" /></RibBtn>
            <RibBtn title="Horizontal tabs (top)" active={viewProps.tabsLayout === "horizontal"} onClick={() => viewProps.setTabsLayout("horizontal")} label="H-Tabs"><PanelTop className="w-4 h-4" /></RibBtn>
          </>
        )}

        {tab === "history" && (
          <>
            <RibBtn title="Show edit history & author changes" onClick={onHistory} label="History"><History className="w-4 h-4" /></RibBtn>
            <div className="self-center text-xs text-[#8d6a49]/70 px-3">Every edit is signed with the author's X handle. Open history to see recent changes.</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Excel-style table ───────────────────────────────────────────
function DataTable({ table, onChange, onDelete, readOnly }) {
  const setCell = (r, c, val) => onChange({ ...table, rows: table.rows.map((row, i) => i === r ? row.map((cell, j) => j === c ? val : cell) : row) });
  const setHeader = (c, val) => onChange({ ...table, headers: table.headers.map((h, j) => j === c ? val : h) });
  const addRow = () => onChange({ ...table, rows: [...table.rows, table.headers.map(() => "")] });
  const addCol = () => onChange({ ...table, headers: [...table.headers, "Column"], rows: table.rows.map((r) => [...r, ""]) });
  const delRow = (r) => onChange({ ...table, rows: table.rows.filter((_, i) => i !== r) });
  const exportCsv = () => {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [table.headers.map(esc).join(","), ...table.rows.map((r) => r.map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${table.name || "table"}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="my-4 rounded-xl border border-[#8d6a49]/25 overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f8e49e]/50 border-b border-[#8d6a49]/20">
        <Table2 className="w-4 h-4 text-[#624a33]" />
        {readOnly ? <span className="text-sm font-bold text-[#624a33]">{table.name}</span> :
          <InlineEdit value={table.name} onSave={(v) => onChange({ ...table, name: v })} className="text-sm font-bold text-[#624a33] bg-transparent outline-none border-b border-transparent focus:border-[#8d6a49]" />}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={exportCsv} title="Export CSV" className="text-xs flex items-center gap-1 px-2 py-1 rounded-md text-[#624a33] hover:bg-[#f8e49e]"><Download className="w-3 h-3" />CSV</button>
          {!readOnly && <button onClick={onDelete} className="text-rose-500 hover:bg-rose-50 rounded-md p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr>
            {table.headers.map((h, c) => (
              <th key={c} className="border border-[#8d6a49]/15 bg-[#fdf6d8] px-0">
                <input value={h} disabled={readOnly} onChange={(e) => setHeader(c, e.target.value)} className="w-full px-2 py-1.5 font-bold text-[#624a33] bg-transparent outline-none text-left min-w-24" />
              </th>
            ))}
            {!readOnly && <th className="bg-[#fdf6d8] border border-[#8d6a49]/15 w-8"><button onClick={addCol} className="text-[#8d6a49] w-full h-full grid place-items-center hover:text-[#624a33]"><Plus className="w-4 h-4" /></button></th>}
          </tr></thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className="group/row">
                {row.map((cell, c) => (
                  <td key={c} className="border border-[#8d6a49]/15 p-0"><input value={cell} disabled={readOnly} onChange={(e) => setCell(r, c, e.target.value)} className="w-full px-2 py-1.5 bg-transparent outline-none text-[#2a2118] focus:bg-[#f8e49e]/30 min-w-24" /></td>
                ))}
                {!readOnly && <td className="border border-[#8d6a49]/15 w-8 text-center"><button onClick={() => delRow(r)} className="opacity-0 group-hover/row:opacity-100 text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && <button onClick={addRow} className="w-full text-left px-3 py-1.5 text-xs text-[#8d6a49] hover:bg-[#f8e49e]/30 flex items-center gap-1"><Plus className="w-3 h-3" /> Add row</button>}
    </div>
  );
}

// ── Manage access panel (owner only) ────────────────────────────
function AccessPanel({ notebook, onClose, onSet, onRemove }) {
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("edit");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const grant = async () => {
    setErr(""); setBusy(true);
    try { await onSet(handle, role); setHandle(""); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-[#fffef7] border-l-2 border-[#8d6a49]/25 z-50 flex flex-col shadow-2xl">
        <div className="flex items-center gap-2 px-4 h-16 border-b-2 border-[#8d6a49]/20 shrink-0">
          <Users className="w-5 h-5 text-[#624a33]" />
          <span className="font-bold text-[#624a33]" style={{ fontFamily: "'Fredoka', sans-serif" }}>Manage access</span>
          <button onClick={onClose} className="ml-auto grid place-items-center h-8 w-8 rounded-lg hover:bg-[#f8e49e]/60"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-[#8d6a49]/15">
          <div className="text-xs font-bold text-[#8d6a49] mb-2">Invite someone by X handle</div>
          <div className="flex items-center rounded-xl border-2 border-[#8d6a49]/25 focus-within:border-[#8d6a49] overflow-hidden mb-2">
            <span className="pl-3 pr-1 text-[#8d6a49] font-bold">@</span>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" className="flex-1 py-2 pr-2 outline-none" autoCapitalize="none" />
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setRole("edit")} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 border-2 ${role === "edit" ? "bg-[#8dffa4]/40 border-[#8dffa4] text-[#2a7d4a]" : "border-[#8d6a49]/20 text-[#8d6a49]"}`}><Pencil className="w-3.5 h-3.5" /> Can edit</button>
            <button onClick={() => setRole("view")} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 border-2 ${role === "view" ? "bg-[#debcff]/40 border-[#debcff] text-[#5b3a8a]" : "border-[#8d6a49]/20 text-[#8d6a49]"}`}><Eye className="w-3.5 h-3.5" /> Can view</button>
          </div>
          {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-2">{err}</div>}
          <button onClick={grant} disabled={busy || !handle} className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: BRAND.fur }}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Grant access</button>
          <p className="text-[11px] text-[#8d6a49]/70 mt-2">They must sign in once before you can add them.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-bold text-[#8d6a49] mb-2">People with access</div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8e49e]/40 mb-2">
            <Avatar name={notebook.ownerHandle} color={BRAND.fur} avatar={notebook.ownerAvatar} px={32} />
            <div className="flex-1 min-w-0"><div className="text-sm font-bold text-[#624a33] truncate">@{notebook.ownerHandle}</div><div className="text-[11px] text-[#8d6a49]">Owner</div></div>
            <ShieldCheck className="w-4 h-4 text-[#8d6a49]" />
          </div>
          {notebook.members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[#8d6a49]/15 mb-2">
              <Avatar name={m.handle} color={m.color} avatar={m.avatar} px={32} />
              <div className="flex-1 min-w-0"><div className="text-sm font-bold text-[#624a33] truncate">@{m.handle}</div>
                <div className="text-[11px] flex items-center gap-1" style={{ color: m.role === "edit" ? "#2a7d4a" : "#5b3a8a" }}>{m.role === "edit" ? <><Pencil className="w-3 h-3" /> Can edit</> : <><Eye className="w-3 h-3" /> Can view</>}</div>
              </div>
              <select value={m.role} onChange={(e) => onSet(m.handle, e.target.value)} className="text-xs border border-[#8d6a49]/25 rounded-lg px-1.5 py-1 bg-white text-[#624a33]">
                <option value="edit">Edit</option><option value="view">View</option>
              </select>
              <button onClick={() => onRemove(m.user_id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {notebook.members.length === 0 && <div className="text-sm text-[#8d6a49]/60 text-center py-6">No one else yet. Invite the pack above.</div>}
        </div>
      </div>
    </>
  );
}

// ── Rich text editor (contentEditable) ──────────────────────────
// Sets innerHTML ONLY when the page changes, so typing never resets the cursor.
function RichEditor({ pageId, initialHtml, onChange, onFocus, onBlur, editorRef, className, style, rule }) {
  const localRef = useRef(null);
  const ref = editorRef || localRef;
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (initialHtml || "")) {
      ref.current.innerHTML = initialHtml || "";
    }
    // eslint-disable-next-line
  }, [pageId]);
  const onClickCapture = (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (a && (e.metaKey || e.ctrlKey)) { e.preventDefault(); window.open(a.href, "_blank", "noopener"); }
  };
  const ruleStyle = rule === "ruled"
    ? { backgroundImage: "repeating-linear-gradient(#0000 0 27px, #8d6a4922 27px 28px)", backgroundAttachment: "local" }
    : rule === "grid"
    ? { backgroundImage: "repeating-linear-gradient(#0000 0 27px,#8d6a4918 27px 28px),repeating-linear-gradient(90deg,#0000 0 27px,#8d6a4918 27px 28px)", backgroundAttachment: "local" }
    : {};
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onClick={onClickCapture}
      title="Tip: Ctrl/Cmd-click a link to open it"
      onFocus={onFocus}
      onBlur={onBlur}
      data-placeholder="Start writing… use the ribbon above to format, add tables, photos, links and tags."
      className={`ddn-editor ${className || ""}`}
      style={{ ...style, ...ruleStyle }}
    />
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [data, setData] = useState(null); // { notebooks:[], people:[] }
  const [loading, setLoading] = useState(false);
  const [activeNb, setActiveNb] = useState(null);
  const [sel, setSel] = useState({ section: null, page: null, subpage: null });
  const [openSections, setOpenSections] = useState({});
  const [openPages, setOpenPages] = useState({});
  const [renaming, setRenaming] = useState(null);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState("standard");
  const [ribTab, setRibTab] = useState("home");
  const [rule, setRule] = useState("none");           // none | ruled | grid
  const [pageColor, setPageColor] = useState("#fffef7");
  const [tabsLayout, setTabsLayout] = useState("vertical"); // vertical | horizontal
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNbMenu, setShowNbMenu] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [toast, setToast] = useState("");
  const fileInput = useRef(null);
  const avatarInput = useRef(null);
  const typedRef = useRef(false);
  const dragRef = useRef(null);
  const [dragOver, setDragOver] = useState(null); // id currently hovered as drop target
  const [rightPanel, setRightPanel] = useState(null);   // null | 'search' | 'pages' | 'tags'
  const [rightSearch, setRightSearch] = useState("");
  const [searchAll, setSearchAll] = useState(false);
  const [highlight, setHighlight] = useState("");        // term to highlight in the open page
  const contentTimer = useRef(null);
  const latestHtml = useRef(null);
  const editorRef = useRef(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  // boot: restore session
  useEffect(() => { (async () => { const s = await loadSession(); if (s?.id) setUser(s); setBooting(false); })(); }, []);

  const reload = useCallback(async (keepSel) => {
    if (!user) return;
    setLoading(true);
    try {
      const d = await rpc("ddn_load", { p_user: user.id });
      setData(d);
      setActiveNb((prev) => {
        const stillThere = d.notebooks.find((n) => n.id === prev);
        return stillThere ? prev : (d.notebooks[0]?.id || null);
      });
      if (!keepSel) {
        const nb = d.notebooks.find((n) => n.id === activeNb) || d.notebooks[0];
        if (nb?.sections?.length) setOpenSections((o) => ({ ...o, [nb.sections[0].id]: true }));
      }
    } catch (e) { flash(e.message); } finally { setLoading(false); }
  }, [user, activeNb]);

  useEffect(() => { if (user) reload(); }, [user]); // eslint-disable-line

  // auto-refresh every 12s so the pack sees each other's changes
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => { if (!renaming && !contentTimer.current) reload(true); }, 12000);
    return () => clearInterval(t);
  }, [user, renaming, reload]);

  if (booting) return <div className="h-screen grid place-items-center" style={{ background: BRAND.cream }}><Loader2 className="w-6 h-6 animate-spin text-[#624a33]" /></div>;
  if (!user) return <Login onLogin={async (u) => { await saveSession(u); setUser(u); }} />;

  const notebook = data?.notebooks.find((n) => n.id === activeNb) || null;
  const canEdit = notebook && (notebook.role === "owner" || notebook.role === "edit");
  const isOwner = notebook && notebook.role === "owner";
  const personOf = (id) => data?.people.find((p) => p.id === id) || { name: "?", color: "#999" };

  // ── action wrapper: optimistic-ish; reload after ───────────────
  const act = async (fn, args, { silentReload } = {}) => {
    try { await rpc(fn, { p_user: user.id, ...args }); await reload(true); }
    catch (e) { flash(e.message); }
  };

  const activeSection = notebook?.sections.find((s) => s.id === sel.section);
  const activePage = activeSection?.pages.find((p) => p.id === sel.page);
  const activeSubpage = activePage?.subpages.find((sp) => sp.id === sel.subpage);
  const target = activeSubpage || activePage;

  // ── writes ─────────────────────────────────────────────────────
  const addSection = () => act("ddn_add_section", { p_nb: notebook.id, p_title: "New Section" });
  const addPage = async (sectionId) => {
    try { const id = await rpc("ddn_add_page", { p_user: user.id, p_section: sectionId, p_parent: null, p_title: "Untitled Page" });
      await reload(true); setOpenSections((s) => ({ ...s, [sectionId]: true })); setSel({ section: sectionId, page: id, subpage: null }); setRenaming({ type: "page", id }); }
    catch (e) { flash(e.message); }
  };
  const addSubpage = async (sectionId, pageId) => {
    try { const id = await rpc("ddn_add_page", { p_user: user.id, p_section: sectionId, p_parent: pageId, p_title: "Untitled Subpage" });
      await reload(true); setOpenPages((s) => ({ ...s, [pageId]: true })); setSel({ section: sectionId, page: pageId, subpage: id }); setRenaming({ type: "subpage", id }); }
    catch (e) { flash(e.message); }
  };
  const renameSection = (id, title) => { setRenaming(null); act("ddn_rename_section", { p_id: id, p_title: title }); };
  const renamePage = (id, title) => { setRenaming(null); act("ddn_rename_page", { p_id: id, p_title: title }); };
  const delSection = (id) => act("ddn_delete_section", { p_id: id });
  const delPage = (id) => { if (sel.page === id || sel.subpage === id) setSel({ section: null, page: null, subpage: null }); act("ddn_delete_page", { p_id: id }); };

  // ── drag & drop reordering ─────────────────────────────────────
  // drag holds { type:'section'|'page'|'subpage', id, section, parent }
  const reorderSections = (draggedId, beforeId) => {
    const ids = notebook.sections.map((s) => s.id).filter((x) => x !== draggedId);
    const idx = beforeId ? ids.indexOf(beforeId) : ids.length;
    ids.splice(idx < 0 ? ids.length : idx, 0, draggedId);
    // optimistic
    setData((d) => { const c = structuredClone(d); const nb = c.notebooks.find((n) => n.id === activeNb); nb.sections.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); return c; });
    rpc("ddn_reorder_sections", { p_user: user.id, p_nb: notebook.id, p_ids: ids }).then(() => reload(true)).catch((e) => flash(e.message));
  };
  const reorderPages = (sectionId, parentId, draggedId, beforeId) => {
    const section = notebook.sections.find((s) => s.id === sectionId);
    const list = parentId ? (section.pages.find((p) => p.id === parentId)?.subpages || []) : section.pages;
    const ids = list.map((p) => p.id).filter((x) => x !== draggedId);
    const idx = beforeId ? ids.indexOf(beforeId) : ids.length;
    ids.splice(idx < 0 ? ids.length : idx, 0, draggedId);
    rpc("ddn_reorder_pages", { p_user: user.id, p_section: sectionId, p_parent: parentId, p_ids: ids }).then(() => reload(true)).catch((e) => flash(e.message));
  };
  const movePageToSection = (pageId, toSectionId) => {
    rpc("ddn_move_page_to_section", { p_user: user.id, p_page: pageId, p_to_section: toSectionId, p_pos: 9999 }).then(() => reload(true)).catch((e) => flash(e.message));
  };

  const onDropOnSection = (targetSectionId, e) => {
    e.preventDefault(); e.stopPropagation();
    const d = dragRef.current; if (!d) return;
    if (d.type === "section") { reorderSections(d.id, targetSectionId); }
    else if (d.type === "page") { if (d.section !== targetSectionId) movePageToSection(d.id, targetSectionId); }
    setDragOver(null); dragRef.current = null;
  };
  const onDropOnPage = (sectionId, targetPageId, e) => {
    e.preventDefault(); e.stopPropagation();
    const d = dragRef.current; if (!d) return;
    if (d.type === "page" && d.section === sectionId) reorderPages(sectionId, null, d.id, targetPageId);
    else if (d.type === "page" && d.section !== sectionId) movePageToSection(d.id, sectionId);
    else if (d.type === "subpage") reorderPages(sectionId, d.parent, d.id, targetPageId);
    setDragOver(null); dragRef.current = null;
  };
  const onDropOnSubpage = (sectionId, parentId, targetSubId, e) => {
    e.preventDefault(); e.stopPropagation();
    const d = dragRef.current; if (!d) return;
    if (d.type === "subpage" && d.parent === parentId) reorderPages(sectionId, parentId, d.id, targetSubId);
    setDragOver(null); dragRef.current = null;
  };

  // content: debounce writes; only log history on first change per focus.
  // For rich text we do NOT re-render the editor from state (would kill the
  // cursor) — the contentEditable DOM is the source of truth while editing,
  // and we keep the in-memory copy in sync silently for saves/search.
  const setContentLocal = (val) => {
    latestHtml.current = val;
    // keep in-memory value current WITHOUT triggering an editor re-render
    if (data) {
      const nb = data.notebooks.find((n) => n.id === activeNb);
      const s = nb?.sections.find((s) => s.id === sel.section);
      const p = s?.pages.find((p) => p.id === sel.page);
      const node = sel.subpage ? p?.subpages.find((x) => x.id === sel.subpage) : p;
      if (node) node.content = val;
    }
    const first = !typedRef.current; typedRef.current = true;
    const pageId = target.id;
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(async () => {
      contentTimer.current = null;
      try { await rpc("ddn_set_content", { p_user: user.id, p_id: pageId, p_content: val, p_log: first }); } catch (e) { flash(e.message); }
    }, 700);
  };
  // flush pending content immediately (on page switch / unmount)
  const flushContent = async () => {
    if (contentTimer.current) { clearTimeout(contentTimer.current); contentTimer.current = null;
      try { await rpc("ddn_set_content", { p_user: user.id, p_id: target.id, p_content: latestHtml.current ?? target.content, p_log: false }); } catch {} }
  };

  const onFiles = async (files) => {
    for (const f of files) {
      const isImg = f.type.startsWith("image/");
      const tooBig = f.size > 700 * 1024;
      let dataUrl = null;
      if (!tooBig) dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      try { await rpc("ddn_add_attachment", { p_user: user.id, p_page: target.id, p_kind: isImg ? "image" : "file", p_name: f.name, p_size: f.size, p_mime: f.type, p_data: dataUrl, p_tbl: null }); }
      catch (e) { flash(e.message); }
    }
    reload(true);
  };
  const addTable = (rows = 2, cols = 3) => {
    const headers = Array.from({ length: cols }, (_, i) => i === 0 ? "Dog #" : i === 1 ? "Name" : `Column ${i + 1}`);
    const body = Array.from({ length: Math.max(1, rows) }, () => headers.map(() => ""));
    return act("ddn_add_attachment", { p_page: target.id, p_kind: "table", p_name: "Excel Dogs", p_size: null, p_mime: null, p_data: null, p_tbl: { name: "Excel Dogs", headers, rows: body } });
  };
  const updateTable = (attId, tbl) => {
    setData((d) => { const c = structuredClone(d); for (const n of c.notebooks) for (const s of n.sections) for (const p of s.pages) { const all = [p, ...p.subpages]; for (const nd of all) { const a = nd.attachments?.find((a) => a.id === attId); if (a) a.table = tbl; } } return c; });
    clearTimeout(contentTimer.current); contentTimer.current = setTimeout(async () => { contentTimer.current = null; try { await rpc("ddn_update_table", { p_user: user.id, p_att: attId, p_tbl: tbl }); } catch (e) { flash(e.message); } }, 600);
  };
  const removeAtt = (attId) => act("ddn_delete_attachment", { p_att: attId });

  // notebooks
  const addNotebook = async () => { try { const id = await rpc("ddn_add_notebook", { p_user: user.id, p_title: "New Notebook" }); await reload(); setActiveNb(id); setSel({ section: null, page: null, subpage: null }); setShowNbMenu(false); setRenaming({ type: "notebook" }); } catch (e) { flash(e.message); } };
  const renameNotebook = (title) => { setRenaming(null); act("ddn_rename_notebook", { p_id: notebook.id, p_title: title }); };
  const deleteNotebook = (id) => { if (!confirm("Delete this whole notebook?")) return; act("ddn_delete_notebook", { p_id: id }); setShowNbMenu(false); };

  // access
  const setMember = async (handle, role) => { await rpc("ddn_set_member", { p_user: user.id, p_nb: notebook.id, p_handle: handle, p_role: role }); await reload(true); };
  const removeMember = async (targetId) => { await rpc("ddn_remove_member", { p_user: user.id, p_nb: notebook.id, p_target: targetId }); await reload(true); };

  // ── rich-text editor helpers ───────────────────────────────────
  const exec = (cmd, val) => {
    if (!canEdit) return;
    editorRef.current?.focus();
    try { document.execCommand("styleWithCSS", false, true); } catch {}
    document.execCommand(cmd, false, val);
    if (editorRef.current) setContentLocal(editorRef.current.innerHTML);
  };
  const insertHtmlAtCursor = (html) => {
    if (!canEdit) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) setContentLocal(editorRef.current.innerHTML);
  };
  const insertTag = (key) => {
    const t = TAGS[key];
    // wrap the current selection (or a placeholder) in a recognizable tagged span
    const sel = window.getSelection();
    const selected = sel && sel.toString() ? sel.toString() : "";
    const inner = selected || t.label;
    insertHtmlAtCursor(`<span class="ddn-tag" data-tag="${key}" style="background:${t.color}22;border-left:3px solid ${t.color};padding:1px 6px;border-radius:4px"><span style="color:${t.color};font-weight:700">${t.prefix}</span>${inner}</span>&nbsp;`);
  };
  const insertLink = () => {
    const url = prompt("Link URL (https://…)"); if (!url) return;
    const text = prompt("Link text", url) || url;
    insertHtmlAtCursor(`<a href="${url}" target="_blank" rel="noopener" style="color:#1f6f8b;text-decoration:underline">${text}</a>&nbsp;`);
  };
  const insertDate = () => insertHtmlAtCursor(new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + "&nbsp;");

  // ── helpers for the right panel ────────────────────────────────
  const htmlToText = (html) => { const d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent || ""; };

  // wrap matches of `term` in <mark> without touching tags/attributes
  const highlightHtml = (html, term) => {
    if (!term || !html) return html;
    const container = document.createElement("div");
    container.innerHTML = html;
    const rx = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    const walk = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          if (rx.test(child.nodeValue)) {
            const span = document.createElement("span");
            span.innerHTML = child.nodeValue.replace(rx, '<mark class="ddn-hl">$1</mark>');
            child.replaceWith(span);
          }
        } else if (child.nodeType === 1 && child.tagName !== "MARK") {
          walk(child);
        }
      }
    };
    walk(container);
    return container.innerHTML;
  };

  // walk all pages/subpages in one or all notebooks
  const walkPages = (allNotebooks) => {
    const out = [];
    const nbs = allNotebooks ? data.notebooks : [notebook].filter(Boolean);
    for (const nb of nbs) for (const s of nb.sections) for (const p of s.pages) {
      out.push({ nb, section: s, page: p, parent: null, node: p });
      for (const sp of p.subpages) out.push({ nb, section: s, page: p, parent: p, node: sp });
    }
    return out;
  };

  // search results across scope
  const searchResults = (term, allNotebooks) => {
    const t = term.trim().toLowerCase(); if (!t) return [];
    return walkPages(allNotebooks).map((e) => {
      const title = e.node.title || "";
      const text = htmlToText(e.node.content);
      const inTitle = title.toLowerCase().includes(t);
      const idx = text.toLowerCase().indexOf(t);
      if (!inTitle && idx < 0) return null;
      let snippet = "";
      if (idx >= 0) { const start = Math.max(0, idx - 30); snippet = (start > 0 ? "…" : "") + text.slice(start, idx + t.length + 40) + "…"; }
      return { ...e, title, snippet, inTitle };
    }).filter(Boolean);
  };

  // collect tagged items across the notebook
  const collectTags = (allNotebooks) => {
    const items = [];
    for (const e of walkPages(allNotebooks)) {
      const d = document.createElement("div"); d.innerHTML = e.node.content || "";
      d.querySelectorAll(".ddn-tag").forEach((el) => {
        const key = el.getAttribute("data-tag") || "other";
        items.push({ key, text: el.textContent || "", nb: e.nb, section: e.section, page: e.page, node: e.node });
      });
    }
    return items;
  };

  // build a summary page grouping every tagged line by tag
  const generateTagSummary = async () => {
    const items = collectTags(false);
    if (items.length === 0) { flash("No tagged items found in this notebook yet."); return; }
    const byTag = {};
    for (const it of items) { (byTag[it.key] ||= []).push(it); }
    let html = `<h1>Tag Summary</h1><p style="color:#8d6a49">Generated ${new Date().toLocaleString()}</p>`;
    for (const key of Object.keys(TAGS)) {
      if (!byTag[key]) continue;
      const t = TAGS[key];
      html += `<h2><span style="color:${t.color}">${t.prefix}</span>${t.label} <span style="color:#8d6a4988">(${byTag[key].length})</span></h2><ul>`;
      for (const it of byTag[key]) html += `<li>${it.text} <span style="color:#8d6a4988;font-size:0.85em">— ${it.page.title}</span></li>`;
      html += `</ul>`;
    }
    // create the page in a "Summaries" section (make it if needed)
    try {
      let summarySection = notebook.sections.find((s) => s.title.toLowerCase() === "summaries");
      let sectionId = summarySection?.id;
      if (!sectionId) sectionId = await rpc("ddn_add_section", { p_user: user.id, p_nb: notebook.id, p_title: "Summaries" });
      const pageId = await rpc("ddn_add_page", { p_user: user.id, p_section: sectionId, p_parent: null, p_title: `Tag Summary — ${new Date().toLocaleDateString()}` });
      await rpc("ddn_set_content", { p_user: user.id, p_id: pageId, p_content: html, p_log: true });
      await reload(true);
      setOpenSections((o) => ({ ...o, [sectionId]: true }));
      setSel({ section: sectionId, page: pageId, subpage: null });
      flash("Summary page created");
    } catch (e) { flash(e.message); }
  };

  const q = query.trim().toLowerCase();
  const matches = (t = "", c = "") => !q || t.toLowerCase().includes(q) || c.toLowerCase().includes(q);
  const pad = view === "wide" ? "px-4 sm:px-8" : view === "compact" ? "px-6 sm:px-16 lg:px-32" : "px-6 sm:px-10";
  const maxW = view === "wide" ? "max-w-none" : view === "compact" ? "max-w-3xl" : "max-w-none";
  const bodyText = view === "compact" ? "text-sm leading-6" : "text-[15px] leading-7";

  const logout = async () => { await clearSession(); setUser(null); setData(null); };

  // ── avatar upload ──────────────────────────────────────────────
  const saveAvatar = async (dataUrl) => {
    try {
      await rpc("ddn_set_avatar", { p_user: user.id, p_avatar: dataUrl });
      const nu = { ...user, avatar: dataUrl }; setUser(nu); await saveSession(nu);
      await reload(true);
      flash(dataUrl ? "Photo updated" : "Photo removed");
    } catch (e) { flash(e.message); }
  };
  const onAvatarFile = async (file) => {
    if (!file.type.startsWith("image/")) { flash("Please pick an image file"); return; }
    // downscale to a small square so it stays well under DB limits
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const out = canvas.toDataURL("image/jpeg", 0.82);
      saveAvatar(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); flash("Couldn't read that image"); };
    img.src = url;
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: BRAND.creamSoft, color: BRAND.ink, fontFamily: "'Nunito', ui-sans-serif, system-ui" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka:wght@500;600;700&family=Press+Start+2P&display=swap" rel="stylesheet" />

      {toast && <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] bg-[#2a2118] text-white text-sm px-4 py-2 rounded-full shadow-lg">{toast}</div>}

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 h-16 shrink-0 border-b-2 border-[#8d6a49]/25 bg-[#fffef7] relative z-20">
        <button onClick={() => setSidebarOpen((v) => !v)} className="md:hidden grid place-items-center h-9 w-9 rounded-lg hover:bg-[#f8e49e]/60"><Menu className="w-5 h-5" /></button>

        <div className="relative">
          {renaming?.type === "notebook" && notebook ? (
            <div className="flex items-center gap-2.5 py-1 pl-1">
              <img src={GARY_HEAD} alt="Gary" className="h-10 w-10" style={{ imageRendering: "pixelated" }} />
              <InlineEdit autoFocus value={notebook.title} onSave={renameNotebook} className="text-[12px] outline-none border-b-2 border-[#8d6a49] bg-transparent text-[#624a33]" style={{ fontFamily: "'Press Start 2P', monospace" }} />
            </div>
          ) : (
            <button onClick={() => setShowNbMenu((v) => !v)} onDoubleClick={() => { if (notebook && canEdit) setRenaming({ type: "notebook" }); }} className="flex items-center gap-2.5 pr-2 rounded-xl hover:bg-[#f8e49e]/60 py-1 pl-1 transition">
              <img src={GARY_HEAD} alt="Gary" className="h-10 w-10" style={{ imageRendering: "pixelated" }} />
              <div className="leading-tight text-left">
                <div className="text-[12px] text-[#624a33] flex items-center gap-1.5" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: 1.3 }}>{notebook ? notebook.title : "DOGINAL DOGS"} <ChevronDown className="w-4 h-4 opacity-50" /></div>
                <div className="text-[11px] text-[#8d6a49]/70 mt-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>Collaborative notebook · woof</div>
              </div>
            </button>
          )}
          {showNbMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNbMenu(false)} />
              <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-[#8d6a49]/20 z-20 py-1.5">
                <div className="px-3 py-1 text-[11px] font-extrabold tracking-widest text-[#8d6a49]/60">YOUR NOTEBOOKS</div>
                {data?.notebooks.map((n) => (
                  <div key={n.id} className={`group flex items-center gap-2 px-3 py-2 hover:bg-[#f8e49e]/50 cursor-pointer ${n.id === activeNb ? "bg-[#f8e49e]/60" : ""}`} onClick={() => { setActiveNb(n.id); setSel({ section: null, page: null, subpage: null }); setShowNbMenu(false); }}>
                    <Book className="w-4 h-4 text-[#8d6a49]" />
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-[#624a33] truncate">{n.title}</div><div className="text-[10px] text-[#8d6a49]/70 flex items-center gap-1">{n.role === "owner" ? <><ShieldCheck className="w-3 h-3" />Owner</> : n.role === "edit" ? <><Pencil className="w-3 h-3" />Can edit</> : <><Eye className="w-3 h-3" />View only</>}</div></div>
                    {n.id === activeNb && <Check className="w-4 h-4 text-[#8d6a49]" />}
                    {(n.role === "owner" || n.role === "edit") && <button onClick={(e) => { e.stopPropagation(); setActiveNb(n.id); setShowNbMenu(false); setRenaming({ type: "notebook" }); }} title="Rename notebook" className="opacity-0 group-hover:opacity-100 text-[#8d6a49] hover:text-[#624a33]"><Edit3 className="w-3.5 h-3.5" /></button>}
                    {n.role === "owner" && <button onClick={(e) => { e.stopPropagation(); deleteNotebook(n.id); }} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
                <button onClick={addNotebook} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#8d6a49] hover:bg-[#f8e49e]/50 border-t border-[#8d6a49]/15 mt-1"><Plus className="w-4 h-4" /> New notebook</button>
              </div>
            </>
          )}
        </div>

        {/* view toggle */}
        <div className="hidden md:flex items-center gap-0.5 ml-1 bg-[#f8e49e]/50 rounded-lg p-0.5">
          <IconBtn title="Standard" active={view === "standard"} onClick={() => setView("standard")}><Rows2 className="w-4 h-4" /></IconBtn>
          <IconBtn title="Wide" active={view === "wide"} onClick={() => setView("wide")}><Columns2 className="w-4 h-4" /></IconBtn>
          <IconBtn title="Compact" active={view === "compact"} onClick={() => setView("compact")}><LayoutGrid className="w-4 h-4" /></IconBtn>
        </div>

        <IconBtn title="Refresh" onClick={() => reload(true)}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</IconBtn>

        {/* right-panel toggles */}
        <div className="hidden md:flex items-center gap-0.5 bg-[#f8e49e]/40 rounded-lg p-0.5">
          <IconBtn title="Search pages" active={rightPanel === "search"} onClick={() => setRightPanel(rightPanel === "search" ? null : "search")}><Search className="w-4 h-4" /></IconBtn>
          <IconBtn title="All pages (deep dive)" active={rightPanel === "pages"} onClick={() => setRightPanel(rightPanel === "pages" ? null : "pages")}><Book className="w-4 h-4" /></IconBtn>
          <IconBtn title="Tags & summaries" active={rightPanel === "tags"} onClick={() => setRightPanel(rightPanel === "tags" ? null : "tags")}><Tag className="w-4 h-4" /></IconBtn>
        </div>

        {/* search */}
        <div className="ml-auto relative w-32 sm:w-56">
          <Search className="w-4 h-4 text-[#8d6a49]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-8 h-9 rounded-full bg-[#f8e49e]/50 focus:bg-white border-2 border-transparent focus:border-[#8d6a49]/40 outline-none text-sm" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d6a49]/60"><X className="w-4 h-4" /></button>}
        </div>

        {isOwner && <button onClick={() => setShowAccess(true)} title="Manage access" className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full bg-[#f8e49e]/50 hover:bg-[#f8e49e] text-[#624a33] text-sm font-bold"><Users className="w-4 h-4" /> Share</button>}

        {/* me — click for profile / avatar upload */}
        <div className="relative pl-1">
          <button onClick={() => setShowProfile((v) => !v)} className="flex items-center gap-1.5 rounded-full hover:bg-[#f8e49e]/50 py-1 pr-2 pl-1" title="Your profile">
            <Avatar name={user.handle} color={user.color} avatar={user.avatar} px={32} />
            <div className="hidden sm:block leading-tight text-left"><div className="text-sm font-bold text-[#624a33]">@{user.handle}</div></div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8d6a49]/50" />
          </button>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border-2 border-[#8d6a49]/20 z-50 p-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar name={user.handle} color={user.color} avatar={user.avatar} px={72} />
                  <div className="mt-2 font-bold text-[#624a33]">@{user.handle}</div>
                </div>
                <button onClick={() => avatarInput.current?.click()} className="mt-4 w-full py-2 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:brightness-105" style={{ background: BRAND.fur }}>
                  <ImageIcon className="w-4 h-4" /> {user.avatar ? "Change photo" : "Upload photo"}
                </button>
                {user.avatar && <button onClick={saveAvatar.bind(null, null)} className="mt-2 w-full py-2 rounded-xl text-sm font-semibold text-[#8d6a49] hover:bg-[#f8e49e]/40">Remove photo</button>}
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onAvatarFile(e.target.files[0]); e.target.value = ""; }} />
                <button onClick={logout} className="mt-2 w-full py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Sign out</button>
                <p className="text-[11px] text-[#8d6a49]/60 mt-3 text-center">Your photo shows on every page you edit and in the members list.</p>
              </div>
            </>
          )}
        </div>
      </header>

      {/* pastel stripe */}
      <div className="flex h-1 shrink-0">{STRIPE.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}</div>

      {/* horizontal tabs layout: sections across the top */}
      {tabsLayout === "horizontal" && notebook && (
        <div className="shrink-0 border-b-2 border-[#8d6a49]/20 bg-[#fffef7]">
          <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
            {notebook.sections.map((s) => {
              const active = sel.section === s.id;
              return (
                <button key={s.id} onClick={() => { const fp = s.pages[0]; setSel({ section: s.id, page: fp?.id || null, subpage: null }); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${active ? "bg-[#f8e49e] text-[#624a33]" : "text-[#8d6a49]/70 hover:bg-[#f8e49e]/40"}`}>
                  <Folder className="w-3.5 h-3.5" /> {s.title}
                </button>
              );
            })}
            {canEdit && <button onClick={addSection} className="grid place-items-center h-8 w-8 rounded-lg text-white shrink-0" style={{ background: BRAND.fur }}><Plus className="w-4 h-4" /></button>}
          </div>
          {activeSection && (
            <div className="flex items-center gap-1 px-3 pb-1.5 overflow-x-auto border-t border-[#8d6a49]/10">
              {activeSection.pages.map((p) => {
                const active = sel.page === p.id && !sel.subpage;
                return (
                  <button key={p.id} onClick={() => setSel({ section: activeSection.id, page: p.id, subpage: null })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] whitespace-nowrap ${active ? "bg-[#f8e49e]/70 font-bold text-[#624a33]" : "text-[#2a2118]/70 hover:bg-[#f8e49e]/40"}`}>
                    <FileText className="w-3 h-3" /> {p.title}
                  </button>
                );
              })}
              {canEdit && <button onClick={() => addPage(activeSection.id)} className="grid place-items-center h-6 w-6 rounded-md text-[#8d6a49] hover:bg-[#f8e49e]/50 shrink-0"><Plus className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Sidebar (hidden in horizontal-tabs layout) */}
        <aside className={`${sidebarOpen && tabsLayout === "vertical" ? "w-72" : "w-0"} transition-[width] duration-200 shrink-0 border-r-2 border-[#8d6a49]/20 bg-[#fffef7] overflow-hidden`}>
          <div className="h-full w-72 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <span className="text-[11px] font-extrabold tracking-widest text-[#8d6a49]/60">SECTIONS</span>
              {canEdit && <button onClick={addSection} className="flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1.5 rounded-lg hover:brightness-110" style={{ background: BRAND.fur }}><Plus className="w-3.5 h-3.5" /> Section</button>}
            </div>
            {notebook && !canEdit && <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-[#debcff]/30 text-[#5b3a8a] text-xs font-semibold flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> View-only access</div>}
            <div className="flex-1 overflow-y-auto px-2 pb-8 space-y-0.5">
              {!notebook && <div className="px-3 py-10 text-center text-sm text-[#8d6a49]/70">No notebook selected.</div>}
              {notebook?.sections.length === 0 && <div className="px-3 py-10 text-center text-sm text-[#8d6a49]/70">No sections yet.{canEdit && <><br />Create one to start.</>}</div>}
              {notebook?.sections.map((section) => {
                const open = openSections[section.id];
                const visiblePages = section.pages.filter((p) => matches(p.title, p.content) || p.subpages.some((sp) => matches(sp.title, sp.content)));
                if (q && !matches(section.title) && visiblePages.length === 0) return null;
                return (
                  <div key={section.id}>
                    <div
                      draggable={canEdit && renaming?.id !== section.id}
                      onDragStart={(e) => { if (!canEdit) return; dragRef.current = { type: "section", id: section.id }; e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={(e) => { if (canEdit && dragRef.current) { e.preventDefault(); setDragOver("sec:" + section.id); } }}
                      onDragLeave={() => setDragOver((o) => o === "sec:" + section.id ? null : o)}
                      onDrop={(e) => onDropOnSection(section.id, e)}
                      className={`group flex items-center gap-1 rounded-lg pr-1 ${dragOver === "sec:" + section.id ? "ring-2 ring-[#8d6a49] bg-[#f8e49e]/40" : "hover:bg-[#f8e49e]/50"}`}>
                      {canEdit && <span className="cursor-grab active:cursor-grabbing text-[#8d6a49]/40 hover:text-[#8d6a49] shrink-0 pl-0.5" title="Drag to reorder">⠿</span>}
                      <button onClick={() => setOpenSections((s) => ({ ...s, [section.id]: !open }))} className="grid place-items-center h-7 w-6 text-[#8d6a49]/60 shrink-0">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                      <Folder className="w-4 h-4 shrink-0" style={{ color: BRAND.fur }} />
                      {renaming?.type === "section" && renaming.id === section.id ? (
                        <InlineEdit autoFocus value={section.title} onSave={(v) => renameSection(section.id, v)} className="flex-1 text-sm font-bold bg-transparent outline-none border-b border-[#8d6a49] py-1" />
                      ) : (
                        <button onClick={() => setOpenSections((s) => ({ ...s, [section.id]: true }))} onDoubleClick={() => canEdit && setRenaming({ type: "section", id: section.id })} className="flex-1 text-left text-sm font-bold py-1.5 truncate text-[#624a33]">{section.title}</button>
                      )}
                      {canEdit && <div className="opacity-0 group-hover:opacity-100 flex items-center">
                        <IconBtn title="Add page" onClick={() => addPage(section.id)}><Plus className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Rename" onClick={() => setRenaming({ type: "section", id: section.id })}><Edit3 className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn danger title="Delete" onClick={() => { if (confirm(`Delete section "${section.title}"?`)) delSection(section.id); }}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                      </div>}
                    </div>
                    {open && (
                      <div className="ml-5 border-l-2 border-[#8d6a49]/15 pl-1 space-y-0.5 mt-0.5">
                        {section.pages.length === 0 && canEdit && <button onClick={() => addPage(section.id)} className="flex items-center gap-1.5 text-xs text-[#8d6a49]/70 hover:text-[#624a33] px-2 py-1.5"><Plus className="w-3.5 h-3.5" /> Add a page</button>}
                        {section.pages.map((page) => {
                          if (q && !(matches(page.title, page.content) || page.subpages.some((sp) => matches(sp.title, sp.content)))) return null;
                          const isActive = sel.page === page.id && !sel.subpage;
                          const pOpen = openPages[page.id];
                          return (
                            <div key={page.id}>
                              <div
                                draggable={canEdit && renaming?.id !== page.id}
                                onDragStart={(e) => { if (!canEdit) return; e.stopPropagation(); dragRef.current = { type: "page", id: page.id, section: section.id }; e.dataTransfer.effectAllowed = "move"; }}
                                onDragOver={(e) => { if (canEdit && dragRef.current) { e.preventDefault(); e.stopPropagation(); setDragOver("pg:" + page.id); } }}
                                onDragLeave={() => setDragOver((o) => o === "pg:" + page.id ? null : o)}
                                onDrop={(e) => onDropOnPage(section.id, page.id, e)}
                                className={`group flex items-center gap-1 rounded-lg pr-1 ${dragOver === "pg:" + page.id ? "ring-2 ring-[#8d6a49] bg-[#f8e49e]/40" : isActive ? "bg-[#f8e49e]/70" : "hover:bg-[#f8e49e]/50"}`}>
                                {canEdit && <span className="cursor-grab active:cursor-grabbing text-[#8d6a49]/40 hover:text-[#8d6a49] shrink-0 text-xs" title="Drag to reorder">⠿</span>}
                                <button onClick={() => setOpenPages((s) => ({ ...s, [page.id]: !pOpen }))} className="grid place-items-center h-7 w-5 text-[#8d6a49]/40 shrink-0">{page.subpages.length > 0 ? (pOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : <span className="w-3.5" />}</button>
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#624a33]" : "text-[#8d6a49]/60"}`} />
                                {renaming?.type === "page" && renaming.id === page.id ? (
                                  <InlineEdit autoFocus value={page.title} onSave={(v) => renamePage(page.id, v)} className="flex-1 text-sm bg-transparent outline-none border-b border-[#8d6a49] py-1" />
                                ) : (
                                  <button onClick={() => { setSel({ section: section.id, page: page.id, subpage: null }); typedRef.current = false; }} onDoubleClick={() => canEdit && setRenaming({ type: "page", id: page.id })} className={`flex-1 text-left text-sm py-1.5 truncate ${isActive ? "font-bold text-[#624a33]" : "text-[#2a2118]"}`}>{page.title}</button>
                                )}
                                {canEdit && <div className="opacity-0 group-hover:opacity-100 flex items-center">
                                  <IconBtn title="Add subpage" onClick={() => addSubpage(section.id, page.id)}><Plus className="w-3.5 h-3.5" /></IconBtn>
                                  <IconBtn danger title="Delete" onClick={() => { if (confirm(`Delete page "${page.title}"?`)) delPage(page.id); }}><Trash2 className="w-3 h-3" /></IconBtn>
                                </div>}
                              </div>
                              {pOpen && page.subpages.length > 0 && (
                                <div className="ml-6 border-l-2 border-[#8d6a49]/15 pl-1 space-y-0.5">
                                  {page.subpages.map((sp) => {
                                    if (q && !matches(sp.title, sp.content)) return null;
                                    const spA = sel.subpage === sp.id;
                                    return (
                                      <div key={sp.id}
                                        draggable={canEdit && renaming?.id !== sp.id}
                                        onDragStart={(e) => { if (!canEdit) return; e.stopPropagation(); dragRef.current = { type: "subpage", id: sp.id, section: section.id, parent: page.id }; e.dataTransfer.effectAllowed = "move"; }}
                                        onDragOver={(e) => { if (canEdit && dragRef.current?.type === "subpage" && dragRef.current.parent === page.id) { e.preventDefault(); e.stopPropagation(); setDragOver("sp:" + sp.id); } }}
                                        onDragLeave={() => setDragOver((o) => o === "sp:" + sp.id ? null : o)}
                                        onDrop={(e) => onDropOnSubpage(section.id, page.id, sp.id, e)}
                                        className={`group flex items-center gap-1 rounded-lg pr-1 ${dragOver === "sp:" + sp.id ? "ring-2 ring-[#8d6a49] bg-[#f8e49e]/40" : spA ? "bg-[#e9be83]/60" : "hover:bg-[#f8e49e]/50"}`}>
                                        <span className="w-4 shrink-0" /><div className="w-1.5 h-1.5 rounded-full bg-[#8d6a49] shrink-0" />
                                        {renaming?.type === "subpage" && renaming.id === sp.id ? (
                                          <InlineEdit autoFocus value={sp.title} onSave={(v) => renamePage(sp.id, v)} className="flex-1 text-[13px] bg-transparent outline-none border-b border-[#8d6a49] py-1 ml-1" />
                                        ) : (
                                          <button onClick={() => { setSel({ section: section.id, page: page.id, subpage: sp.id }); typedRef.current = false; }} onDoubleClick={() => canEdit && setRenaming({ type: "subpage", id: sp.id })} className={`flex-1 text-left text-[13px] py-1.5 ml-1 truncate ${spA ? "font-bold text-[#624a33]" : "text-[#2a2118]/80"}`}>{sp.title}</button>
                                        )}
                                        {canEdit && <div className="opacity-0 group-hover:opacity-100 flex items-center"><IconBtn danger title="Delete" onClick={() => { if (confirm(`Delete subpage "${sp.title}"?`)) delPage(sp.id); }}><Trash2 className="w-3 h-3" /></IconBtn></div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 min-w-0 flex flex-col" style={{ background: pageColor }} onDragOver={(e) => canEdit && e.preventDefault()} onDrop={(e) => { if (canEdit && target && e.dataTransfer.files.length) { e.preventDefault(); onFiles([...e.dataTransfer.files]); } }}>
          {target && (
            <Ribbon
              tab={ribTab} setTab={setRibTab} exec={exec} canEdit={canEdit}
              onInsertTable={(r, c) => addTable(r, c)}
              onInsertPhoto={() => fileInput.current?.click()}
              onInsertFile={() => fileInput.current?.click()}
              onInsertLink={insertLink}
              onInsertDate={insertDate}
              onTag={insertTag}
              onHistory={() => setShowHistory(true)}
              viewProps={{ view, setView, rule, setRule, pageColor, setPageColor, pageColors: ["#fffef7", "#fdf6d8", "#f8e49e", "#ffd0eb", "#debcff", "#8dffa4", "#64ffff"], tabsLayout, setTabsLayout }}
            />
          )}
          {target ? (
            <div className="flex-1 overflow-y-auto">
              <div className={`${maxW} mx-auto ${pad} py-6`}>
                <div className="flex items-center gap-1.5 text-xs text-[#8d6a49]/70 flex-wrap mb-2">
                  <span className="font-bold text-[#624a33]">{notebook.title}</span><ChevronRight className="w-3 h-3" />
                  <span>{activeSection.title}</span><ChevronRight className="w-3 h-3" />
                  <span className={sel.subpage ? "" : "font-bold text-[#624a33]"}>{activePage.title}</span>
                  {sel.subpage && <><ChevronRight className="w-3 h-3" /><span className="font-bold text-[#624a33]">{activeSubpage.title}</span></>}
                  {!canEdit && <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#debcff]/40 text-[#5b3a8a] font-bold"><Eye className="w-3 h-3" /> View only</span>}
                </div>
                <InlineEdit key={target.id} value={target.title} placeholder="Untitled" disabled={!canEdit} onSave={(v) => renamePage(target.id, v)} className="w-full text-3xl sm:text-4xl font-bold bg-transparent outline-none placeholder:text-[#8d6a49]/30 text-[#624a33]" style={{ fontFamily: "'Fredoka', sans-serif" }} />
                <div className="flex items-center gap-2 mt-2 text-xs text-[#8d6a49]/80">
                  {target.updatedBy ? (
                    <><Avatar name={personOf(target.updatedBy).name} color={personOf(target.updatedBy).color} avatar={personOf(target.updatedBy).avatar} px={20} />
                    <span>Last edited by <b className="text-[#624a33]">@{personOf(target.updatedBy).name}</b> · {fmt(target.updated)}</span></>
                  ) : <span>Last edited {fmt(target.updated)}</span>}
                  <button onClick={() => setShowHistory(true)} className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#f8e49e]/60 text-[#624a33] font-semibold"><History className="w-3.5 h-3.5" /> History</button>
                </div>
                <hr className="my-4 border-[#8d6a49]/15" />
                <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { onFiles([...e.target.files]); e.target.value = ""; }} />
                {highlight && htmlToText(target.content).toLowerCase().includes(highlight.toLowerCase()) ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs bg-[#ffe154]/40 rounded-lg px-3 py-1.5">
                      <span className="font-bold text-[#624a33]">Highlighting "{highlight}"</span>
                      <button onClick={() => setHighlight("")} className="ml-auto font-semibold text-[#8d6a49] hover:text-[#624a33] underline">Clear & edit</button>
                    </div>
                    <div className={`w-full text-[#2a2118] min-h-[40vh] ddn-editor ${bodyText}`} onClick={() => canEdit && setHighlight("")} dangerouslySetInnerHTML={{ __html: highlightHtml(target.content, highlight) || '<span style="color:#8d6a4966">Empty page.</span>' }} />
                  </div>
                ) : canEdit ? (
                  <RichEditor
                    pageId={target.id}
                    initialHtml={target.content}
                    editorRef={editorRef}
                    onChange={setContentLocal}
                    onFocus={() => { typedRef.current = false; }}
                    onBlur={flushContent}
                    rule={rule}
                    className={`w-full outline-none text-[#2a2118] min-h-[60vh] pb-24 ${bodyText}`}
                    style={{ fontFamily: "'Nunito', system-ui" }}
                  />
                ) : (
                  <div className={`w-full text-[#2a2118] min-h-[10vh] ddn-editor ${bodyText}`} dangerouslySetInnerHTML={{ __html: target.content || '<span style="color:#8d6a4966">Empty page.</span>' }} />
                )}
                {target.attachments?.length > 0 && (
                  <div className="mt-6">   {/* attachment gap fix: was a big blank gap; now tight */}
                    {target.attachments.map((a) => {
                      if (a.kind === "table") return <DataTable key={a.id} table={a.table} onChange={(t) => updateTable(a.id, t)} onDelete={() => removeAtt(a.id)} readOnly={!canEdit} />;
                      if (a.kind === "image") return (
                        <div key={a.id} className="my-4 group relative inline-block rounded-xl overflow-hidden border-2 border-[#8d6a49]/25 max-w-full">
                          {a.data ? <img src={a.data} alt={a.name} className="max-w-full max-h-96 block" /> : <div className="p-6 bg-[#f8e49e]/40 text-[#624a33] text-sm">{a.name} (too large to preview)</div>}
                          {canEdit && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"><button onClick={() => removeAtt(a.id)} className="grid place-items-center h-7 w-7 rounded-full bg-white/90 text-rose-500 shadow"><X className="w-4 h-4" /></button></div>}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-1.5 text-white text-xs flex items-center gap-1.5"><Avatar name={personOf(a.by).name} color={personOf(a.by).color} avatar={personOf(a.by).avatar} px={16} ring />{a.name}</div>
                        </div>
                      );
                      return (
                        <div key={a.id} className="my-2 flex items-center gap-3 p-3 rounded-xl border border-[#8d6a49]/25 bg-[#fdf6d8]/60 group">
                          <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#8d6a49] text-white"><FileIcon className="w-5 h-5" /></div>
                          <div className="flex-1 min-w-0"><div className="text-sm font-bold text-[#624a33] truncate">{a.name}</div><div className="text-xs text-[#8d6a49]/70">{a.size ? (a.size / 1024).toFixed(0) + " KB · " : ""}added by @{personOf(a.by).name}</div></div>
                          {a.data && <a href={a.data} download={a.name} className="text-[#624a33] hover:text-[#8d6a49] p-1.5"><Download className="w-4 h-4" /></a>}
                          {canEdit && <button onClick={() => removeAtt(a.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1.5"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center p-10 text-center">
              <div className="max-w-sm">
                <img src={GARY_HEAD} alt="Gary" className="h-20 w-20 mx-auto mb-4" style={{ imageRendering: "pixelated" }} />
                <h2 className="text-xl font-bold mb-1 text-[#624a33]" style={{ fontFamily: "'Fredoka', sans-serif" }}>{notebook ? "Pick a page to begin" : "Create your first notebook"}</h2>
                <p className="text-sm text-[#8d6a49]/80 mb-5">{notebook ? "Select a page from the sidebar, or start a fresh section." : "Open the notebook menu (top-left) to make one."}</p>
                {notebook && canEdit && <button onClick={addSection} className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-xl hover:brightness-110" style={{ background: BRAND.fur }}><Plus className="w-4 h-4" /> New Section</button>}
                {!notebook && <button onClick={addNotebook} className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-xl hover:brightness-110" style={{ background: BRAND.fur }}><Plus className="w-4 h-4" /> New Notebook</button>}
              </div>
            </div>
          )}
        </main>

        {/* ── Right panel: Search / Pages / Tags ─────────────── */}
        {rightPanel && (
          <aside className="w-80 shrink-0 border-l-2 border-[#8d6a49]/20 bg-[#fffef7] flex flex-col">
            <div className="flex items-center gap-1 px-3 h-12 border-b-2 border-[#8d6a49]/15 shrink-0">
              <button onClick={() => setRightPanel("search")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${rightPanel === "search" ? "bg-[#f8e49e]/70 text-[#624a33]" : "text-[#8d6a49]/70"}`}><Search className="w-3.5 h-3.5" /> Search</button>
              <button onClick={() => setRightPanel("pages")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${rightPanel === "pages" ? "bg-[#f8e49e]/70 text-[#624a33]" : "text-[#8d6a49]/70"}`}><Book className="w-3.5 h-3.5" /> Pages</button>
              <button onClick={() => setRightPanel("tags")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${rightPanel === "tags" ? "bg-[#f8e49e]/70 text-[#624a33]" : "text-[#8d6a49]/70"}`}><Tag className="w-3.5 h-3.5" /> Tags</button>
              <button onClick={() => setRightPanel(null)} className="ml-auto grid place-items-center h-7 w-7 rounded-lg hover:bg-[#f8e49e]/60 text-[#8d6a49]"><X className="w-4 h-4" /></button>
            </div>

            {/* SEARCH */}
            {rightPanel === "search" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-[#8d6a49]/10">
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 text-[#8d6a49]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input autoFocus value={rightSearch} onChange={(e) => setRightSearch(e.target.value)} placeholder="Search words in pages…" className="w-full pl-8 pr-3 h-9 rounded-lg bg-[#f8e49e]/40 focus:bg-white border-2 border-transparent focus:border-[#8d6a49]/40 outline-none text-sm" />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button onClick={() => setSearchAll(false)} className={`flex-1 py-1.5 rounded-lg font-bold ${!searchAll ? "bg-[#8d6a49] text-white" : "bg-[#f8e49e]/40 text-[#8d6a49]"}`}>This notebook</button>
                    <button onClick={() => setSearchAll(true)} className={`flex-1 py-1.5 rounded-lg font-bold ${searchAll ? "bg-[#8d6a49] text-white" : "bg-[#f8e49e]/40 text-[#8d6a49]"}`}>All notebooks</button>
                  </div>
                </div>
                <div className="p-2">
                  {rightSearch.trim() === "" && <div className="text-sm text-[#8d6a49]/60 text-center py-8">Type to search across {searchAll ? "all notebooks" : "this notebook"}.</div>}
                  {rightSearch.trim() !== "" && searchResults(rightSearch, searchAll).length === 0 && <div className="text-sm text-[#8d6a49]/60 text-center py-8">No matches for "{rightSearch}".</div>}
                  {searchResults(rightSearch, searchAll).map((r) => (
                    <button key={r.node.id} onClick={() => { if (searchAll && r.nb.id !== activeNb) setActiveNb(r.nb.id); setSel({ section: r.section.id, page: r.page.id, subpage: r.parent ? r.node.id : null }); setHighlight(rightSearch); setOpenSections((o) => ({ ...o, [r.section.id]: true })); if (r.parent) setOpenPages((o) => ({ ...o, [r.page.id]: true })); }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-[#f8e49e]/40 mb-1">
                      <div className="text-sm font-bold text-[#624a33] truncate">{r.title || "Untitled"}</div>
                      <div className="text-[11px] text-[#8d6a49]/70 truncate">{searchAll ? r.nb.title + " · " : ""}{r.section.title}{r.parent ? " · " + r.page.title : ""}</div>
                      {r.snippet && <div className="text-xs text-[#2a2118]/70 mt-0.5 line-clamp-2">{r.snippet}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PAGES (deep-dive outline) */}
            {rightPanel === "pages" && notebook && (
              <div className="flex-1 overflow-y-auto p-2">
                <div className="text-[11px] font-extrabold tracking-widest text-[#8d6a49]/60 px-2 py-1">ALL PAGES ({walkPages(false).length})</div>
                {notebook.sections.map((s) => (
                  <div key={s.id} className="mb-2">
                    <div className="text-xs font-bold text-[#8d6a49] px-2 py-1 flex items-center gap-1"><Folder className="w-3 h-3" />{s.title}</div>
                    {s.pages.map((p) => (
                      <div key={p.id}>
                        <button onClick={() => { setSel({ section: s.id, page: p.id, subpage: null }); setHighlight(""); }} className={`w-full text-left text-sm px-2 py-1 rounded-md truncate flex items-center gap-1.5 ${sel.page === p.id && !sel.subpage ? "bg-[#f8e49e]/70 font-bold text-[#624a33]" : "text-[#2a2118] hover:bg-[#f8e49e]/40"}`}><FileText className="w-3 h-3 shrink-0 text-[#8d6a49]/60" />{p.title}</button>
                        {p.subpages.map((sp) => (
                          <button key={sp.id} onClick={() => { setSel({ section: s.id, page: p.id, subpage: sp.id }); setHighlight(""); }} className={`w-full text-left text-[13px] pl-7 pr-2 py-1 rounded-md truncate ${sel.subpage === sp.id ? "bg-[#e9be83]/60 font-bold text-[#624a33]" : "text-[#2a2118]/70 hover:bg-[#f8e49e]/40"}`}>• {sp.title}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* TAGS */}
            {rightPanel === "tags" && notebook && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-[#8d6a49]/10">
                  <button onClick={generateTagSummary} className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:brightness-105" style={{ background: BRAND.fur }}><Plus className="w-4 h-4" /> Generate summary page</button>
                  <p className="text-[11px] text-[#8d6a49]/70 mt-2 text-center">Creates a page grouping every tagged line by tag.</p>
                </div>
                <div className="p-2">
                  {collectTags(false).length === 0 && <div className="text-sm text-[#8d6a49]/60 text-center py-8">No tags yet. Select text and use <b>Home → Tags</b> to tag it.</div>}
                  {Object.entries(TAGS).map(([key, t]) => {
                    const items = collectTags(false).filter((i) => i.key === key);
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="mb-3">
                        <div className="text-xs font-bold px-2 py-1 flex items-center gap-1.5" style={{ color: t.color }}>{t.prefix}{t.label} <span className="text-[#8d6a4988]">({items.length})</span></div>
                        {items.map((it, i) => (
                          <button key={i} onClick={() => { const isSub = it.node.id !== it.page.id; setSel({ section: it.section.id, page: it.page.id, subpage: isSub ? it.node.id : null }); setOpenSections((o) => ({ ...o, [it.section.id]: true })); if (isSub) setOpenPages((o) => ({ ...o, [it.page.id]: true })); }} className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-[#f8e49e]/40 flex items-start gap-1.5">
                            <span className="w-1 self-stretch rounded" style={{ background: t.color }} />
                            <span className="min-w-0"><span className="block truncate text-[#2a2118]">{it.text}</span><span className="block text-[11px] text-[#8d6a49]/70 truncate">{it.page.title}</span></span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* History drawer */}
        {showHistory && target && (
          <>
            <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setShowHistory(false)} />
            <div className="fixed right-0 top-0 h-full w-80 bg-[#fffef7] border-l-2 border-[#8d6a49]/25 z-40 flex flex-col shadow-2xl">
              <div className="flex items-center gap-2 px-4 h-16 border-b-2 border-[#8d6a49]/20 shrink-0">
                <History className="w-5 h-5 text-[#624a33]" /><span className="font-bold text-[#624a33]" style={{ fontFamily: "'Fredoka', sans-serif" }}>Edit history</span>
                <button onClick={() => setShowHistory(false)} className="ml-auto grid place-items-center h-8 w-8 rounded-lg hover:bg-[#f8e49e]/60"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-xs text-[#8d6a49]/70 mb-3 px-1 truncate">{target.title}</div>
                {(!target.history || target.history.length === 0) && <div className="text-sm text-[#8d6a49]/60 text-center py-10">No edits recorded yet.</div>}
                <ol className="space-y-2">
                  {(target.history || []).map((h) => (
                    <li key={h.id} className="flex gap-3 p-2.5 rounded-xl bg-white border border-[#8d6a49]/15">
                      <Avatar name={personOf(h.by).name} color={personOf(h.by).color} avatar={personOf(h.by).avatar} px={28} />
                      <div className="min-w-0"><div className="text-sm text-[#2a2118]"><b className="text-[#624a33]">@{personOf(h.by).name}</b> {h.action}</div><div className="text-[11px] text-[#8d6a49]/70">{fmt(h.at)}</div></div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}

        {showAccess && notebook && isOwner && <AccessPanel notebook={notebook} onClose={() => setShowAccess(false)} onSet={setMember} onRemove={removeMember} />}
      </div>
    </div>
  );
}
