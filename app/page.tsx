"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

/* ─── HERO PARTICLES (canvas, no library) ────────────────────────────── */
function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      radius: number; baseOpacity: number; color: string;
      phase: number; phaseSpeed: number;
    };

    const particles: Particle[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.4 + 0.4,
      baseOpacity: Math.random() * 0.25 + 0.08,
      color: Math.random() > 0.55 ? "orange" : "white",
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.008 + 0.003,
    }));

    let frame: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(t * p.phaseSpeed * 60 + p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color === "orange"
            ? `rgba(239,119,27,${opacity})`
            : `rgba(255,255,255,${opacity})`;
        ctx.fill();

        // subtle glow for larger orange particles
        if (p.color === "orange" && p.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
          grad.addColorStop(0, `rgba(239,119,27,${opacity * 0.3})`);
          grad.addColorStop(1, "rgba(239,119,27,0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 3 }}
    />
  );
}

/* ─── ANIMATED COUNTER ────────────────────────────────────────────────── */
function Counter({ value, className = "", style }: { value: string; className?: string; style?: React.CSSProperties }) {
  const suffix = value.endsWith("+") ? "+" : value.endsWith("%") ? "%" : "";
  const target = parseInt(value.replace(/\D/g, ""), 10);

  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setCount(Math.round(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <span ref={ref} className={className} style={style}>
      {count}{suffix}
    </span>
  );
}

/* ─── FADE IN WRAPPER (21st.dev pattern) ─────────────────────────────── */
function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const value = direction === "down" || direction === "right" ? -40 : 40;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, [axis]: value, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, [axis]: 0, filter: "blur(0px)" }
          : { opacity: 0, [axis]: value, filter: "blur(8px)" }
      }
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerFade({
  children,
  className = "",
  stagger = 0.1,
}: {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 30, filter: "blur(6px)" }
          }
          transition={{ duration: 0.6, delay: i * stagger, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── MAGNETIC BUTTON WRAPPER ────────────────────────────────────────── */
function MagneticBtn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 18 });
  const sy = useSpring(y, { stiffness: 280, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.28);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.28);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
}

/* ─── SHARED CARD HOVER (consistent across all sections) ─────────────── */
const CARD_HOVER = {
  y: -8,
  borderColor: "rgba(239,119,27,0.55)",
  boxShadow: "0 0 0 1px rgba(239,119,27,0.3), 0 16px 48px rgba(239,119,27,0.12)",
  transition: { type: "spring" as const, stiffness: 400, damping: 28, delay: 0 },
};

/* ─── REVEAL LINE under headings ─────────────────────────────────────── */
function RevealLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ transformOrigin: "left", height: "2px", background: "#EF771B", marginBottom: "2rem", width: "80px" }}
    />
  );
}

/* ─── SAVINGS CALCULATOR MODAL ───────────────────────────────────────── */
const CHANGE_FACTORS = { mała: { yr2: 0.55, yr3: 0.65 }, średnia: { yr2: 0.45, yr3: 0.55 }, duża: { yr2: 0.38, yr3: 0.45 } } as const;
type ChangeScope = keyof typeof CHANGE_FACTORS;

function calcYearData(budget: number, events: number, scope: ChangeScope, years: number) {
  const eventMult = 1 + (events - 1) * 0.15;
  const f = CHANGE_FACTORS[scope];
  const rows: { yr: number; trad: number; neati: number }[] = [];
  let tradTotal = 0;
  let neatiTotal = 0;

  for (let yr = 1; yr <= years; yr++) {
    const trad = budget * eventMult * yr;
    let saving = 0;
    if (yr === 1) saving = 0;
    else if (yr === 2) saving = f.yr2;
    else saving = f.yr3;
    const savedAmt = budget * saving * eventMult * (yr - 1);
    const neati = trad - savedAmt;
    rows.push({ yr, trad: Math.round(trad / 1000) * 1000, neati: Math.max(Math.round(neati / 1000) * 1000, budget) });
    tradTotal = rows[yr - 1].trad;
    neatiTotal = rows[yr - 1].neati;
  }

  tradTotal = rows[rows.length - 1].trad;
  neatiTotal = rows[rows.length - 1].neati;
  const totalSaved = tradTotal - neatiTotal;
  const yr2Saved = rows.length >= 2 ? rows[1].trad - rows[1].neati : 0;
  let roi = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].trad > rows[i].neati) { roi = i + 1; break; }
  }

  return { rows, tradTotal, neatiTotal, totalSaved, yr2Saved, roi };
}

function AnimatedBar({ value, max, color, delay }: { value: number; max: number; color: string; delay: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <motion.div
      style={{ background: color, height: "100%", width: `${pct}%`, originX: 0 }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
    />
  );
}

function Kalkulator({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState(150000);
  const [events, setEvents] = useState(3);
  const [scope, setScope] = useState<ChangeScope>("średnia");
  const [years, setYears] = useState(3);
  const [barKey, setBarKey] = useState(0);

  const data = calcYearData(budget, events, scope, years);

  const handleChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(Number(e.target.value));
    setBarKey(k => k + 1);
  };

  const maxBar = Math.max(...data.rows.map(r => r.trad));

  const fmt = (n: number) => n >= 1000000
    ? `${(n / 1000000).toFixed(1).replace(".", ",")} mln zł`
    : `${(n / 1000).toFixed(0)} 000 zł`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sliderStyle: React.CSSProperties = {
    WebkitAppearance: "none",
    appearance: "none",
    width: "100%",
    height: "4px",
    borderRadius: "2px",
    background: `linear-gradient(to right, #EF771B 0%, #EF771B ${
      scope === "mała" ? 0 : 0
    }%, #333 0%)`,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }} />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div>
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: "#EF771B" }}>KALKULATOR OSZCZĘDNOŚCI</div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Ile zaoszczędzisz z NEATI?</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 transition-colors hover:bg-white/10"
            style={{ color: "#999", fontSize: "1.5rem", lineHeight: 1 }}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT: sliders */}
          <div className="flex flex-col gap-7">

            {/* Budget */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-xs font-bold tracking-widest text-gray-400">BUDŻET PIERWSZEGO STOISKA</label>
                <span className="text-lg font-black" style={{ color: "#EF771B" }}>{fmt(budget)}</span>
              </div>
              <input type="range" min={30000} max={500000} step={5000} value={budget}
                onChange={handleChange(setBudget)}
                className="calc-slider" style={sliderStyle}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>30 000 zł</span><span>500 000 zł</span>
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-xs font-bold tracking-widest text-gray-400">EVENTY ROCZNIE</label>
                <span className="text-lg font-black" style={{ color: "#EF771B" }}>{events}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={events}
                onChange={handleChange(setEvents)}
                className="calc-slider" style={sliderStyle}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1</span><span>10</span>
              </div>
            </div>

            {/* Scope */}
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-400 mb-3">ZAKRES ZMIAN KONFIGURACJI</div>
              <div className="grid grid-cols-3 gap-2">
                {(["mała", "średnia", "duża"] as ChangeScope[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setScope(s); setBarKey(k => k + 1); }}
                    className="py-2 text-xs font-black tracking-widest transition-all"
                    style={scope === s
                      ? { background: "#EF771B", color: "#1A1A1A", border: "1px solid #EF771B" }
                      : { background: "transparent", color: "#999", border: "1px solid #333" }}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {scope === "mała" && "Układ identyczny każdego roku"}
                {scope === "średnia" && "Inne strefy / grafika co roku"}
                {scope === "duża" && "Całkowita zmiana koncepcji"}
              </div>
            </div>

            {/* Years */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-xs font-bold tracking-widest text-gray-400">LICZBA LAT</label>
                <span className="text-lg font-black" style={{ color: "#EF771B" }}>{years} {years === 1 ? "rok" : years < 5 ? "lata" : "lat"}</span>
              </div>
              <input type="range" min={1} max={5} step={1} value={years}
                onChange={handleChange(setYears)}
                className="calc-slider" style={sliderStyle}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1</span><span>5</span>
              </div>
            </div>
          </div>

          {/* RIGHT: chart + results */}
          <div className="flex flex-col gap-6">
            {/* Bar chart */}
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-400 mb-4">PORÓWNANIE KOSZTÓW ŁĄCZNIE (ZŁ)</div>
              <div className="flex flex-col gap-3">
                {data.rows.map((row, i) => (
                  <div key={`${barKey}-${row.yr}`} className="flex items-center gap-3">
                    <div className="text-xs font-bold text-gray-500 w-8 shrink-0">R{row.yr}</div>
                    <div className="flex-1 flex flex-col gap-1">
                      {/* Traditional */}
                      <div className="h-4 overflow-hidden" style={{ background: "#111" }}>
                        <AnimatedBar value={row.trad} max={maxBar} color="#3a3a3a" delay={i * 0.08} />
                      </div>
                      {/* NEATI */}
                      <div className="h-4 overflow-hidden" style={{ background: "#111" }}>
                        <AnimatedBar value={row.neati} max={maxBar} color="#EF771B" delay={i * 0.08 + 0.1} />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 w-24 shrink-0 text-right">
                      <div>{fmt(row.trad)}</div>
                      <div style={{ color: "#EF771B" }}>{fmt(row.neati)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 shrink-0" style={{ background: "#3a3a3a" }} />
                  <span className="text-xs text-gray-500">Tradycyjne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 shrink-0" style={{ background: "#EF771B" }} />
                  <span className="text-xs text-gray-500">NEATI</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "KOSZT TRADYCYJNY", value: fmt(data.tradTotal), accent: false },
                { label: "KOSZT Z NEATI", value: fmt(data.neatiTotal), accent: false },
                { label: "OSZCZĘDNOŚĆ ŁĄCZNIE", value: data.totalSaved > 0 ? fmt(data.totalSaved) : "—", accent: true },
                { label: "OSZCZĘDNOŚĆ W ROKU 2", value: data.yr2Saved > 0 ? fmt(data.yr2Saved) : "—", accent: false },
              ].map(item => (
                <div key={item.label} className="p-4" style={{ background: "#161616", border: "1px solid #2a2a2a" }}>
                  <div className="text-xs font-bold tracking-widest text-gray-500 mb-1">{item.label}</div>
                  <div className="text-base font-black" style={{ color: item.accent ? "#EF771B" : "white" }}>{item.value}</div>
                </div>
              ))}
            </div>

            {data.roi > 0 && (
              <div className="p-4 text-center" style={{ background: "rgba(239,119,27,0.08)", border: "1px solid rgba(239,119,27,0.3)" }}>
                <div className="text-xs font-bold tracking-widest text-gray-400 mb-1">ZWROT INWESTYCJI OD</div>
                <div className="text-2xl font-black" style={{ color: "#EF771B" }}>Roku {data.roi}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid #2a2a2a", paddingTop: "1.5rem" }}>
          <p className="text-xs text-gray-600 text-center sm:text-left">
            Symulacja szacunkowa. Skontaktuj się po bezpłatną wycenę.
          </p>
          <a
            href="#kontakt"
            onClick={onClose}
            className="px-6 py-3 text-xs font-black tracking-widest transition-all hover:scale-105 shrink-0"
            style={{ background: "#EF771B", color: "#1A1A1A" }}
          >
            BEZPŁATNA WYCENA →
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── NAV ─────────────────────────────────────────────────────────────── */
function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "SYSTEM", href: "#system" },
    { label: "KLIENCI", href: "#klienci" },
    { label: "MULTIMEDIA", href: "#multimedia" },
    { label: "ZASIĘG", href: "#zasieg" },
    { label: "EKOLOGIA", href: "#ekologia" },
    { label: "BIURA", href: "#biura" },
    { label: "KONTAKT", href: "#kontakt" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center">
            <Image src="/logo-neati.svg" alt="NEATI" height={32} width={120} priority />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs font-bold tracking-widest text-gray-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#kontakt"
              className="ml-4 px-5 py-2 bg-[#EF771B] text-[#1A1A1A] text-xs font-black tracking-widest hover:bg-[#d4621a] transition-colors"
            >
              DARMOWA WYCENA
            </a>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span
              className="block w-6 h-0.5 bg-white transition-all"
              style={{ transform: open ? "rotate(45deg) translateY(8px)" : undefined }}
            />
            <span className="block w-6 h-0.5 bg-white transition-all" style={{ opacity: open ? 0 : 1 }} />
            <span
              className="block w-6 h-0.5 bg-white transition-all"
              style={{ transform: open ? "rotate(-45deg) translateY(-8px)" : undefined }}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#1A1A1A] border-t border-[#333] px-4 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-bold tracking-widest text-gray-300 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#kontakt"
            onClick={() => setOpen(false)}
            className="inline-block px-5 py-3 bg-[#EF771B] text-[#1A1A1A] text-xs font-black tracking-widest text-center"
          >
            DARMOWA WYCENA
          </a>
        </div>
      )}
    </header>
  );
}

/* ─── GLITCH WORD ("ENDLESS") ────────────────────────────────────────── */
function GlitchWord() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Fire first glitch shortly after "ENDLESS" becomes visible at 2.35s
    const init = setTimeout(() => {
      setActive(true);
      setTimeout(() => setActive(false), 300);
    }, 2500);

    // Recurring every 4 seconds from mount
    const loop = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 300);
    }, 4000);

    return () => { clearTimeout(init); clearInterval(loop); };
  }, []);

  return (
    <span
      className="relative inline-block"
      style={{ color: "#EF771B", textShadow: "0 4px 60px rgba(239,119,27,0.4)" }}
    >
      ENDLESS
      {active && (
        <>
          <span className="glitch-layer glitch-layer-red" aria-hidden>ENDLESS</span>
          <span className="glitch-layer glitch-layer-cyan" aria-hidden>ENDLESS</span>
        </>
      )}
    </span>
  );
}

/* ─── SPOTLIGHTS (grand reveal) ──────────────────────────────────────── */
const SPOTLIGHT_DATA = [
  { left: "18%", top: "5%",  w: 200, h: 340, delay: 0.3  },
  { left: "63%", top: "2%",  w: 170, h: 300, delay: 0.48 },
  { left: "41%", top: "0%",  w: 240, h: 400, delay: 0.62 },
  { left: "83%", top: "8%",  w: 140, h: 260, delay: 0.74 },
];

function Spotlights() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
      {SPOTLIGHT_DATA.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.5, 0] }}
          transition={{
            duration: 1.85,
            delay: s.delay,
            times: [0, 0.14, 0.68, 1],
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.w,
            height: s.h,
            transform: "translateX(-50%)",
            background:
              "radial-gradient(ellipse at top, rgba(255,255,255,0.95) 0%, rgba(255,245,220,0.5) 25%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(18px)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── HERO ────────────────────────────────────────────────────────────── */
function Hero() {
  const [calcOpen, setCalcOpen] = useState(false);
  // Pre-generate per-letter rotations once (client-side only)
  const rotations = useRef(
    "ONE BOOTH.".split("").map(() => (Math.random() - 0.5) * 30)
  ).current;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Real background photo – starts black, reveals at 0.8s over 1.2s */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src="/hero-booth.png"
          alt="Stoisko targowe NEATI"
          className="hero-kenburns"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeIn" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />

        {/* Spotlights – appear 0.3s, fade 1.5s+, gone before text */}
        <Spotlights />

        {/* LED glow – fade in with photo at 0.8s, then CSS pulse takes over */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.8, ease: "easeIn" }}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <div className="glow-5 absolute" style={{ left: "55%", top: "25%", width: "30%", height: "40%", background: "#EF771B", borderRadius: "50%", filter: "blur(60px)" }} />
          <div className="glow-7 absolute" style={{ left: "5%",  top: "35%", width: "15%", height: "25%", background: "#EF771B", borderRadius: "50%", filter: "blur(60px)" }} />
          <div className="glow-6 absolute" style={{ right: "2%", top: "30%", width: "10%", height: "30%", background: "#EF771B", borderRadius: "50%", filter: "blur(60px)" }} />
        </motion.div>

        {/* Multi-layer dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,26,26,0.35) 0%, rgba(26,26,26,0.2) 50%, rgba(26,26,26,0.55) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(26,26,26,0.3) 100%)" }} />
        <HeroParticles />
      </div>

      {/* Orange gradient accent */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom left, rgba(239,119,27,0.15) 0%, transparent 70%)" }}
      />

      {/* ── ALL TEXT STARTS AT 1.8s+ (after grand reveal) ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
        {/* Badge – delay 1.8s */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
          className="mb-8 inline-flex items-center gap-2 border border-[#EF771B]/40 px-4 py-1.5 text-xs font-bold tracking-widest text-[#EF771B]"
          style={{ backdropFilter: "blur(8px)", background: "rgba(239,119,27,0.08)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF771B] animate-pulse" />
          SKALOWALNA ARCHITEKTURA MULTIMEDIALNA • EUROPA &amp; USA
        </motion.div>

        {/* H1 */}
        <h1 className="text-6xl sm:text-8xl lg:text-[110px] font-black tracking-tighter leading-none mb-8">

          {/* "ONE BOOTH." – litery wpadają z góry, start 1.85s */}
          <span className="block">
            {"ONE BOOTH.".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: -70, opacity: 0, rotate: rotations[i], filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.55,
                  delay: 1.85 + i * 0.04,
                  type: "spring",
                  stiffness: 170,
                  damping: 18,
                }}
                style={{ display: "inline-block", color: "white", textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>

          {/* "ENDLESS" – glitch, delay 2.1s */}
          <motion.span
            className="block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 2.1 }}
          >
            <GlitchWord />
          </motion.span>

          {/* "SHOW." – wjeżdża z prawej, delay 2.3s */}
          <span className="block overflow-hidden">
            <motion.span
              initial={{ x: "110%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 85, damping: 13, delay: 2.3 }}
              style={{ display: "inline-block", color: "white", textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}
            >
              SHOW.
            </motion.span>
          </span>
        </h1>

        {/* Podtytuł – delay 2.9s */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.9, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Skalowalna architektura targowa premium z wielkopowierzchniowymi ekranami multimedialnymi. Raz zainwestuj —
          używaj przez lata. Twoje stoisko to{" "}
          <span style={{ color: "#EF771B" }} className="font-bold">aktywo</span>,
          nie jednorazowy koszt.
        </motion.p>

        {/* CTA – stagger 3.1s / 3.3s */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 3.1 }}
          >
            <MagneticBtn>
              <a
                href="#filozofia"
                className="px-8 py-4 text-sm font-black tracking-widest"
                style={{ background: "#EF771B", color: "#1A1A1A", display: "inline-block" }}
              >
                ROZPOCZNIJ BUDOWĘ ZASOBÓW
              </a>
            </MagneticBtn>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 3.3 }}
          >
            <MagneticBtn>
              <button
                onClick={() => setCalcOpen(true)}
                className="px-8 py-4 text-sm font-black tracking-widest cursor-pointer"
                style={{ border: "2px solid rgba(255,255,255,0.6)", color: "white", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.05)", display: "inline-block" }}
              >
                ILE ZAOSZCZĘDZĘ?
              </button>
            </MagneticBtn>
          </motion.div>
        </div>

        {/* Stats – delay 3.5s */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3.5 }}
          className="mt-20 flex flex-wrap justify-center gap-10 sm:gap-20 text-center"
        >
          {[
            { val: "500+", label: "Realizacji" },
            { val: "12", label: "Lat doświadczenia" },
            { val: "2", label: "Kontynenty" },
            { val: "98%", label: "Zadowolonych klientów" },
          ].map((s) => (
            <div key={s.label}>
              <Counter
                value={s.val}
                className="text-4xl sm:text-5xl font-black block"
                style={{ color: "#EF771B", textShadow: "0 0 30px rgba(239,119,27,0.4)" } as React.CSSProperties}
              />
              <div className="text-xs text-gray-400 tracking-widest mt-1 uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs tracking-widest text-gray-500">SCROLL</span>
        <motion.div
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 origin-top"
          style={{ background: "linear-gradient(to bottom, #EF771B, transparent)" }}
        />
      </motion.div>

      {/* Savings Calculator Modal */}
      <AnimatePresence>
        {calcOpen && <Kalkulator onClose={() => setCalcOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}

/* ─── FILOZOFIA ───────────────────────────────────────────────────────── */
function Filozofia() {
  const rows = [
    { label: "Po targach", traditional: "Wyrzucasz → 100% straty", neati: "Magazynujesz → 0% straty" },
    { label: "2. Event", traditional: "Nowe stoisko → pełny koszt", neati: "Ta sama baza → -70% kosztu" },
    { label: "3. Event", traditional: "Znów pełny koszt", neati: "Rekonfiguracja → -80% kosztu" },
    { label: "Skalowalność", traditional: "Brak – projekt jednorazowy", neati: "Nieograniczona → doprodukowanie elementów" },
  ];

  return (
    <section id="filozofia" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>FILOZOFIA NEATI</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            Twoje stoisko to{" "}
            <span style={{ color: "#EF771B" }}>Aktywo</span>,<br />
            nie koszt.
          </h2>
          <RevealLine delay={0.1} />
          <p className="text-gray-400 text-lg max-w-2xl mb-16">
            Tradycyjna zabudowa projektowana jest jako rozwiązanie jednorazowe, które po targach ląduje w utylizacji. My tworzymy architekturę wielokrotnego użytku, która staje się Twoim zasobem i pracuje dla Ciebie latami.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold tracking-widest text-gray-500 border-b border-[#333]" style={{ minWidth: "140px" }} />
                  <th className="py-4 px-6 text-center border-b border-[#333]">
                    <div className="text-gray-500 text-xs font-bold tracking-widest mb-1">TRADYCYJNE</div>
                    <div className="text-white font-black text-base">Zabudowa jednorazowa</div>
                  </th>
                  <th className="py-4 px-6 text-center border-b border-[#EF771B]/40" style={{ background: "rgba(239,119,27,0.05)" }}>
                    <div className="text-xs font-bold tracking-widest mb-1" style={{ color: "#EF771B" }}>NEATI</div>
                    <div className="text-white font-black text-base">Architektura wielokrotnego użytku</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? "#1f1f1f" : "#1A1A1A" }}>
                    <td className="py-4 px-6 text-xs font-black tracking-widest text-gray-400 border-b border-[#2a2a2a]">{row.label}</td>
                    <td className="py-4 px-6 text-center border-b border-[#2a2a2a]">
                      <span className="text-gray-500 flex items-center justify-center gap-2">
                        <span style={{ color: "#ef4444" }}>✕</span>{row.traditional}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center border-b border-[#2a2a2a]" style={{ background: "rgba(239,119,27,0.05)" }}>
                      <span className="text-white font-bold flex items-center justify-center gap-2">
                        <span style={{ color: "#EF771B" }}>✓</span>{row.neati}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <motion.div
            className="mt-12 p-8 border"
            style={{ borderColor: "rgba(239,119,27,0.3)", background: "rgba(239,119,27,0.05)" }}
            whileHover={CARD_HOVER}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="text-6xl font-black" style={{ color: "#EF771B" }}>3×</div>
              <div>
                <div className="text-xl font-black text-white">Mniej kosztów przy 3 eventach rocznie</div>
                <div className="text-gray-400 text-sm mt-1">
                  Klienci NEATI odzyskują inwestycję po pierwszym roku użytkowania.
                  Każdy kolejny event to czyste oszczędności.
                </div>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── PROJECT DATA ────────────────────────────────────────────────────── */
const PROJECTS = [
  {
    city: "Berlin",
    event: "Messe Berlin · Automatica",
    size: "120 m²",
    description: "Dwupiętrowe stoisko z pełnym oświetleniem LED, systemem audiowizualnym i strefą VIP dla klientów premium.",
    images: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1400&q=85",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=85",
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1400&q=85",
    ],
  },
  {
    city: "Las Vegas",
    event: "CES · Las Vegas Convention Center",
    size: "250 m²",
    description: "Trzy strefy produktowe, interaktywne ekrany 4K i konfigurowalne ściany LED. Największa realizacja NEATI w USA.",
    images: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
    ],
  },
  {
    city: "Mediolan",
    event: "Salone del Mobile",
    size: "80 m²",
    description: "Minimalistyczny design z organicznym oświetleniem, strefą prezentacji produktów i detalami w złocie.",
    images: [
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1400&q=85",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1400&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
    ],
  },
  {
    city: "Amsterdam",
    event: "ISE · RAI Amsterdam",
    size: "160 m²",
    description: "Stoisko technologiczne z modułowymi panelami, systemem zarządzania treścią i strefą demo dla partnerów.",
    images: [
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1400&q=85",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
    ],
  },
  {
    city: "Frankfurt",
    event: "Messe Frankfurt · Light + Building",
    size: "180 m²",
    description: "Hybrydowa zabudowa multimedialna z systemem LED i trzema strefami produktowymi. Moduły rekonfigurowane między czterema wydarzeniami rocznie.",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1400&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1400&q=85",
    ],
  },
  {
    city: "Amsterdam",
    event: "ISE · RAI Amsterdam (2. edycja)",
    size: "90 m²",
    description: "Modułowe stoisko z ekranami LED i systemem zarządzania treścią. Montaż i demontaż w 12h — rekord NEATI dla tej lokalizacji.",
    images: [
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=85",
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1400&q=85",
    ],
  },
  {
    city: "Warszawa",
    event: "Warsaw Expo · Warsaw Build",
    size: "140 m²",
    description: "Pełna integracja AV z systemem nagłośnienia, wielkoformatowymi ekranami i strefą konferencyjną dla 20 osób.",
    images: [
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1400&q=85",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1400&q=85",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
    ],
  },
  {
    city: "Mediolan",
    event: "Salone del Mobile (edycja premium)",
    size: "200 m²",
    description: "Premium booth z systemem LED i organicznym oświetleniem. Dwupoziomowy układ z galerią materiałów i strefą hospitality. Największa realizacja NEATI w Europie.",
    images: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=85",
    ],
  },
];

/* ─── LIGHTBOX ────────────────────────────────────────────────────────── */
type LightboxState = { projectIdx: number; imgIdx: number };

function Lightbox({
  state,
  onClose,
  onPrev,
  onNext,
  onThumb,
}: {
  state: LightboxState;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onThumb: (i: number) => void;
}) {
  const project = PROJECTS[state.projectIdx];
  const img = project.images[state.imgIdx];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-8"
      style={{ zIndex: 200, background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative w-full flex flex-col"
        style={{ maxWidth: "1000px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <div className="text-xs font-bold tracking-widest text-gray-500">{project.event}</div>
            <div className="text-xl font-black text-white">{project.city}
              <span className="ml-3 text-sm font-normal" style={{ color: "#EF771B" }}>{project.size}</span>
            </div>
          </div>
          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center border text-white font-black text-lg"
            style={{ borderColor: "#333", background: "#1A1A1A" }}
            aria-label="Zamknij"
          >
            ×
          </motion.button>
        </div>

        {/* Main image + arrows */}
        <div className="relative overflow-hidden" style={{ background: "#111", aspectRatio: "16/9" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={img}
              src={img}
              alt={project.city}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Image counter */}
          <div
            className="absolute bottom-3 left-3 px-2 py-1 text-xs font-bold tracking-widest"
            style={{ background: "rgba(26,26,26,0.85)", color: "#EF771B", backdropFilter: "blur(4px)" }}
          >
            {state.imgIdx + 1} / {project.images.length}
          </div>

          {/* Arrow left */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
            style={{ background: "rgba(26,26,26,0.85)", border: "1px solid #333", backdropFilter: "blur(4px)" }}
            aria-label="Poprzednie zdjęcie"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          {/* Arrow right */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
            style={{ background: "rgba(26,26,26,0.85)", border: "1px solid #333", backdropFilter: "blur(4px)" }}
            aria-label="Następne zdjęcie"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {project.images.map((thumb, i) => (
            <motion.button
              key={i}
              onClick={(e) => { e.stopPropagation(); onThumb(i); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex-shrink-0 relative overflow-hidden"
              style={{
                width: "80px",
                height: "52px",
                border: i === state.imgIdx ? "2px solid #EF771B" : "2px solid #333",
                transition: "border-color 0.2s",
              }}
              aria-label={`Zdjęcie ${i + 1}`}
            >
              <img src={thumb.replace("w=1400", "w=200")} alt="" className="w-full h-full object-cover" />
              {i !== state.imgIdx && (
                <div className="absolute inset-0" style={{ background: "rgba(26,26,26,0.45)" }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-400 leading-relaxed px-1">{project.description}</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── REALIZACJE (portfolio z prawdziwymi zdjęciami) ─────────────────── */
function Realizacje() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const open = (projectIdx: number) => setLightbox({ projectIdx, imgIdx: 0 });
  const close = () => setLightbox(null);
  const prev = () => setLightbox((s) => s ? { ...s, imgIdx: (s.imgIdx - 1 + PROJECTS[s.projectIdx].images.length) % PROJECTS[s.projectIdx].images.length } : s);
  const next = () => setLightbox((s) => s ? { ...s, imgIdx: (s.imgIdx + 1) % PROJECTS[s.projectIdx].images.length } : s);
  const thumb = (i: number) => setLightbox((s) => s ? { ...s, imgIdx: i } : s);

  return (
    <section id="realizacje" className="py-24 sm:py-32" style={{ background: "#161616" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>NASZE REALIZACJE</div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
                Stoiska, które<br />
                <span style={{ color: "#EF771B" }}>robią wrażenie.</span>
              </h2>
              <RevealLine delay={0.1} />
            </div>
            <a
              href="#kontakt"
              className="self-start sm:self-auto px-6 py-3 border text-xs font-black tracking-widest transition-all"
              style={{ borderColor: "#EF771B", color: "#EF771B" }}
            >
              CHCĘ PODOBNE STOISKO
            </a>
          </div>
        </FadeIn>

        {/* Desktop: two rows of 4 expanding flex cards */}
        {[PROJECTS.slice(0, 4), PROJECTS.slice(4, 8)].map((rowProjects, rowIdx) => (
          <FadeIn key={rowIdx} delay={rowIdx * 0.15}>
            <div className="hidden md:flex gap-3 h-[380px] mb-3">
              {rowProjects.map((p, colIdx) => {
                const i = rowIdx * 4 + colIdx;
                return (
                  <motion.div
                    key={i}
                    className="relative overflow-hidden cursor-pointer flex-shrink-0"
                    style={{ borderRadius: "2px" }}
                    animate={{ flex: hovered === i ? 3.5 : 1 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => open(i)}
                    whileHover={{
                      y: -8,
                      boxShadow: "0 0 0 1px rgba(239,119,27,0.3), 0 16px 48px rgba(239,119,27,0.12)",
                      transition: { type: "spring", stiffness: 400, damping: 28, delay: 0 },
                    }}
                  >
                    <img
                      src={p.images[0].replace("w=1400", "w=900")}
                      alt={p.city}
                      className="w-full h-full object-cover"
                      style={{ transform: hovered === i ? "scale(1.05)" : "scale(1)", transition: "transform 0.6s ease" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.3) 50%, transparent 100%)" }} />
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: hovered === i ? "#EF771B" : "transparent", transition: "background 0.3s" }} />

                    <div
                      className="absolute top-4 left-4 px-2 py-0.5 text-xs font-bold tracking-widest flex items-center gap-1"
                      style={{ background: "rgba(26,26,26,0.75)", color: "white", backdropFilter: "blur(4px)", border: "1px solid #333" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="0.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                      {p.images.length}
                    </div>

                    <div
                      className="absolute top-4 right-4 px-3 py-1 text-xs font-black tracking-widest"
                      style={{ background: "#EF771B", color: "#1A1A1A" }}
                    >
                      {p.size}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="text-xs font-bold tracking-widest text-gray-400 mb-1 overflow-hidden whitespace-nowrap">{p.event}</div>
                      <div className="text-2xl font-black text-white">{p.city}</div>
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: hovered === i ? "auto" : 0, opacity: hovered === i ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-gray-300 text-sm leading-relaxed mt-2">{p.description}</p>
                        <span className="inline-block mt-3 text-xs font-black tracking-widest px-4 py-2" style={{ background: "#EF771B", color: "#1A1A1A" }}>
                          ZOBACZ GALERIĘ →
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </FadeIn>
        ))}

        {/* Mobile: 2-column grid */}
        <FadeIn delay={0.2}>
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROJECTS.map((p, i) => (
              <motion.div
                key={i}
                className="relative overflow-hidden cursor-pointer"
                style={{ height: "260px" }}
                onClick={() => open(i)}
                whileHover={{ y: -8, boxShadow: "0 0 0 1px rgba(239,119,27,0.3), 0 16px 48px rgba(239,119,27,0.12)", transition: { type: "spring", stiffness: 400, damping: 28, delay: 0 } }}
              >
                <img src={p.images[0].replace("w=1400", "w=600")} alt={p.city} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.2) 60%, transparent 100%)" }} />
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "#EF771B" }} />
                <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-bold flex items-center gap-1" style={{ background: "rgba(26,26,26,0.8)", color: "white" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="0.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
                    <circle cx="5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  {p.images.length}
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 text-xs font-black" style={{ background: "#EF771B", color: "#1A1A1A" }}>{p.size}</div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-xs text-gray-400 mb-1">{p.event}</div>
                  <div className="text-xl font-black text-white">{p.city}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-6">i ponad 500 innych realizacji w 20 krajach</p>
            <a
              href="#kontakt"
              className="inline-block px-8 py-4 text-sm font-black tracking-widest transition-all hover:scale-105"
              style={{ background: "#EF771B", color: "#1A1A1A" }}
            >
              CHCĘ PODOBNE STOISKO
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Lightbox portal */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox state={lightbox} onClose={close} onPrev={prev} onNext={next} onThumb={thumb} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── NASI KLIENCI ────────────────────────────────────────────────────── */
const CLIENTS = [
  { name: "Sungrow",           abbr: "SG" },
  { name: "Schneider Electric", abbr: "SE" },
  { name: "LONGi",             abbr: "LG" },
  { name: "MBDA",              abbr: "MB" },
  { name: "Innomotics",        abbr: "IN" },
  { name: "Blachotrapez",      abbr: "BT" },
  { name: "Eagle Lasers",      abbr: "EL" },
  { name: "Pruszyński",        abbr: "PR" },
  { name: "Darco",             abbr: "DA" },
  { name: "INfire",            abbr: "IF" },
];

const TESTIMONIALS = [
  {
    quote: "Zainwestowaliśmy w system NEATI 3 lata temu i do dziś używamy tych samych modułów na 8–10 targach rocznie. ROI osiągnęliśmy po pierwszym roku. To jedyna sensowna decyzja dla firm aktywnych targowo.",
    author: "Marek Wiśniewski",
    role: "Dyrektor Marketingu",
    company: "Schneider Electric",
    initials: "MW",
  },
  {
    quote: "Jakość wykonania jest na poziomie, którego oczekujemy od ekspozycji premium. Ekipa NEATI jest zawsze na miejscu na czas, montaż przebiega bez stresu. Polecam każdemu, kto szuka partnera na lata.",
    author: "Anna Kowalska",
    role: "Brand Manager",
    company: "Sungrow",
    initials: "AK",
  },
  {
    quote: "Rekonfiguracja stoiska z 40 m² do 80 m² zajęła 2 tygodnie i kosztowała ułamek ceny nowego projektu. W tradycyjnym modelu to byłoby nowe stoisko. NEATI zmienił sposób, w jaki myślimy o obecności targowej.",
    author: "Piotr Nowak",
    role: "Event Manager",
    company: "Pruszyński",
    initials: "PN",
  },
];

function NasiKlienci() {
  const [paused, setPaused] = useState(false);
  // Duplicate list for seamless loop
  const track = [...CLIENTS, ...CLIENTS];

  return (
    <section id="klienci" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>NASI KLIENCI</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            Zaufali nam<br />
            <span style={{ color: "#EF771B" }}>liderzy branży.</span>
          </h2>
          <RevealLine delay={0.1} />
        </FadeIn>

        {/* ── Logo Marquee ── */}
        <FadeIn delay={0.15}>
          <div
            className="relative overflow-hidden mb-20"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
          >
            <div
              className={`flex gap-4 ${paused ? "marquee-track paused" : "marquee-track"}`}
              style={{ width: "max-content" }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {track.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 160,
                    height: 72,
                    flexShrink: 0,
                    background: "#1f1f1f",
                    border: "1px solid #2a2a2a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    transition: "border-color 0.25s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(239,119,27,0.45)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
                >
                  <span
                    className="font-black tracking-widest text-xs"
                    style={{ color: "#EF771B", letterSpacing: "0.12em" }}
                  >
                    {c.abbr}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wide text-center px-2 leading-tight">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Testimonials ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.15} direction="up">
              <motion.div
                className="h-full p-8 border flex flex-col"
                style={{ background: "#242424", borderColor: "#2a2a2a" }}
                whileHover={CARD_HOVER}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-5" style={{ color: "#EF771B" }} aria-label="5 gwiazdek">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t pt-5" style={{ borderColor: "#333" }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: "rgba(239,119,27,0.15)", color: "#EF771B", border: "1px solid rgba(239,119,27,0.3)" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role} · {t.company}</div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ─── MAPA ŚWIATA ─────────────────────────────────────────────────────── */

// ── Single source of truth: add new cities here only ──────────────────
const LOCATIONS = [
  { id: 1,  name: "Amsterdam",    flag: "🇳🇱", coords: [4.90,  52.37] as [number,number], region: "europe" as const, country: "Holandia" },
  { id: 2,  name: "Hannover",     flag: "🇩🇪", coords: [9.73,  52.37] as [number,number], region: "europe" as const, country: "Niemcy"   },
  { id: 3,  name: "Frankfurt",    flag: "🇩🇪", coords: [8.68,  50.11] as [number,number], region: "europe" as const, country: "Niemcy"   },
  { id: 4,  name: "Paryż",        flag: "🇫🇷", coords: [2.35,  48.85] as [number,number], region: "europe" as const, country: "Francja"  },
  { id: 5,  name: "Mediolan",     flag: "🇮🇹", coords: [9.19,  45.46] as [number,number], region: "europe" as const, country: "Włochy"   },
  { id: 6,  name: "Reggio Emilia",flag: "🇮🇹", coords: [10.63, 44.70] as [number,number], region: "europe" as const, country: "Włochy",   isHub: true },
  { id: 7,  name: "Przytkowice",  flag: "🇵🇱", coords: [19.83, 49.97] as [number,number], region: "europe" as const, country: "Polska",   isHQ:  true },
  { id: 8,  name: "Las Vegas",    flag: "🇺🇸", coords: [-115.13, 36.17] as [number,number], region: "usa" as const, country: "Nevada"  },
  { id: 9,  name: "San Antonio",  flag: "🇺🇸", coords: [-98.49,  29.42] as [number,number], region: "usa" as const, country: "Texas"   },
  { id: 10, name: "Atlanta",      flag: "🇺🇸", coords: [-84.39,  33.75] as [number,number], region: "usa" as const, country: "Georgia" },
  { id: 11, name: "Orlando",      flag: "🇺🇸", coords: [-81.38,  28.54] as [number,number], region: "usa" as const, country: "Floryda" },
];
type Location = typeof LOCATIONS[number];

// IDs of Poland (616) and Italy (380) in the 110m dataset
const HIGHLIGHTED = new Set(["616", "380"]);

type RSMComponents = typeof import("react-simple-maps");
type ZoomRegion = "global" | "europe" | "usa";

// ── Projection utils (approx. geoMercator matching ComposableMap config) ──
const SVG_W = 900, SVG_H = 480;
const PROJ_LON0 = -40, PROJ_LAT0 = 48, PROJ_SCALE = 260;

function lonLatToSVG(coords: [number, number]): [number, number] {
  const DEG = Math.PI / 180;
  const x = SVG_W / 2 + PROJ_SCALE * (coords[0] - PROJ_LON0) * DEG * Math.cos(PROJ_LAT0 * DEG);
  const yc = -PROJ_SCALE * Math.log(Math.tan(Math.PI / 4 + PROJ_LAT0 * DEG / 2));
  const yp = -PROJ_SCALE * Math.log(Math.tan(Math.PI / 4 + coords[1] * DEG / 2));
  return [x, SVG_H / 2 + (yp - yc)];
}

// Compute CSS transform target to zoom onto the centroid of a region
function regionZoomTarget(region: "europe" | "usa", cssScale: number) {
  const pts = LOCATIONS.filter(l => l.region === region);
  const lonC = pts.reduce((s, p) => s + p.coords[0], 0) / pts.length;
  const latC = pts.reduce((s, p) => s + p.coords[1], 0) / pts.length;
  const [px, py] = lonLatToSVG([lonC, latC]);
  return { scale: cssScale, x: -(px - SVG_W / 2) * cssScale, y: -(py - SVG_H / 2) * cssScale };
}

// Stagger delays: group by country, 0.2s between countries, 0.1s within same country
function computeStaggerDelays(region: "europe" | "usa"): Map<number, number> {
  const locs = LOCATIONS.filter(l => l.region === region);
  const countries = new Map<string, Location[]>();
  for (const l of locs) {
    if (!countries.has(l.country)) countries.set(l.country, []);
    countries.get(l.country)!.push(l);
  }
  const delays = new Map<number, number>();
  let ci = 0;
  for (const cityList of countries.values()) {
    cityList.forEach((loc, li) => delays.set(loc.id, ci * 0.2 + li * 0.1));
    ci++;
  }
  return delays;
}

// Fixed centers instead of auto-centroid
const EUROPE_ZOOM = (() => { const [px, py] = lonLatToSVG([10, 51]);  const s = 3.08; return { scale: s, x: -(px - SVG_W / 2) * s, y: -(py - SVG_H / 2) * s }; })();
const USA_ZOOM    = (() => { const [px, py] = lonLatToSVG([-98, 37]); const s = 2.5;  return { scale: s, x: -(px - SVG_W / 2) * s, y: -(py - SVG_H / 2) * s }; })();
const EUROPE_DELAYS  = computeStaggerDelays("europe");
const USA_DELAYS     = computeStaggerDelays("usa");

// Plane path — arc from central Europe to Atlanta (not mid-ocean)
const [EX, EY] = lonLatToSVG([11,  49]);
const [UX, UY] = lonLatToSVG([-84, 34]); // Atlanta, GA
const MX = (EX + UX) / 2, MY = Math.min(EY, UY) - 90;
const PLANE_PATH_D = `M ${EX.toFixed(1)} ${EY.toFixed(1)} Q ${MX.toFixed(1)} ${MY.toFixed(1)} ${UX.toFixed(1)} ${UY.toFixed(1)}`;

function quadBez(t: number, p0: number, p1: number, p2: number) {
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
}

// Register GSAP plugin once
if (typeof window !== "undefined") gsap.registerPlugin(MotionPathPlugin);

function MapaSwiat() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const planeRef   = useRef<SVGGElement>(null);
  const trailRef   = useRef<SVGPathElement>(null);
  const tlRef      = useRef<gsap.core.Timeline | null>(null);

  const isInView = useInView(sectionRef, { once: true, margin: "0px 0px -120px 0px" });
  const [hovered, setHovered] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomRegion>("global");
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [rsm, setRsm] = useState<RSMComponents | null>(null);

  useEffect(() => {
    import("react-simple-maps").then(setRsm);
  }, []);

  // Build GSAP timeline once RSM is loaded and section is in view
  useEffect(() => {
    if (!isInView || !rsm || !wrapperRef.current) return;

    const euroLocs = LOCATIONS.filter(l => l.region === "europe");
    const setEuro  = () => { setZoom("europe"); };
    const setGlobal= () => { setZoom("global"); setVisibleIds(new Set()); };
    const setUSA   = () => { setZoom("usa"); };

    // Initial GSAP state
    gsap.set(wrapperRef.current, { scale: 1, x: 0, y: 0, transformOrigin: "center center" });
    if (planeRef.current)  gsap.set(planeRef.current,  { opacity: 0 });
    if (trailRef.current)  gsap.set(trailRef.current,  { opacity: 0, strokeDashoffset: 1 });

    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    // ── 1. Initial global pause (2s) ──────────────────────────────────
    tl.to({}, { duration: 2 });

    // ── 2. Zoom in Europe (2.5s) ──────────────────────────────────────
    tl.to(wrapperRef.current, {
      scale: EUROPE_ZOOM.scale, x: EUROPE_ZOOM.x, y: EUROPE_ZOOM.y,
      duration: 2.5, ease: "power2.inOut", onStart: setEuro,
    });

    // ── 3. Europe cities appear (stagger driven by EUROPE_DELAYS) ────
    tl.call(() => setVisibleIds(new Set(euroLocs.map(l => l.id))));

    // ── 4. Pause on Europe (3s) ───────────────────────────────────────
    tl.to({}, { duration: 3 });

    // ── 5. Zoom out global (2s), clear cities ─────────────────────────
    tl.to(wrapperRef.current, {
      scale: 1, x: 0, y: 0,
      duration: 2, ease: "power2.inOut", onStart: setGlobal,
    });

    // ── 6. Global pause (1.5s) ────────────────────────────────────────
    tl.to({}, { duration: 1.5 });

    // ── 7. Plane + trail (3.5s) ───────────────────────────────────────
    tl.set(planeRef.current, { opacity: 1 });
    tl.set(trailRef.current, { opacity: 0.55, strokeDashoffset: 1 });

    // Trail draws alongside plane movement
    tl.to(trailRef.current, { strokeDashoffset: 0, duration: 3.5, ease: "none" }, "fly");
    tl.to(planeRef.current, {
      motionPath: { path: "#plane-arc-path", autoRotate: true, start: 0, end: 1 },
      duration: 3.5, ease: "power1.inOut",
    }, "fly");

    // Fade out plane + trail
    tl.to(planeRef.current, { opacity: 0, duration: 0.4 });
    tl.to(trailRef.current, { opacity: 0, duration: 0.5 }, "<");

    // ── 8. Zoom in USA (2.5s) ─────────────────────────────────────────
    tl.to(wrapperRef.current, {
      scale: USA_ZOOM.scale, x: USA_ZOOM.x, y: USA_ZOOM.y,
      duration: 2.5, ease: "power2.inOut", onStart: setUSA,
    });

    // ── 9. USA cities appear ──────────────────────────────────────────
    tl.call(() => setVisibleIds(new Set(LOCATIONS.map(l => l.id))));

    // ── 10. Pause on USA (3s) ─────────────────────────────────────────
    tl.to({}, { duration: 3 });

    // ── 11. Zoom out global (2s), clear cities ────────────────────────
    tl.to(wrapperRef.current, {
      scale: 1, x: 0, y: 0,
      duration: 2, ease: "power2.inOut", onStart: setGlobal,
    });

    // ── 12. Final pause (2s) → repeat ────────────────────────────────
    tl.to({}, { duration: 2 });

    return () => { tl.kill(); };
  }, [isInView, rsm]);

  const stats = [
    { value: "12+", label: "Krajów" },
    { value: "500+", label: "Realizacji" },
    { value: "2", label: "Kontynenty" },
  ];

  return (
    <section id="zasieg" className="py-24 sm:py-32" style={{ background: "#1A1A1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>GLOBALNY ZASIĘG</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            Globalna skala.<br />
            <span style={{ color: "#EF771B" }}>Lokalna precyzja.</span>
          </h2>
          <RevealLine delay={0.2} />
          <p className="text-lg max-w-2xl mb-12" style={{ color: "#888", fontWeight: 300 }}>
            Twój kalendarz targowy nie uznaje kompromisów. Gwarantujemy ten sam, bezbłędny standard premium w Europie i USA. Własna logistyka, certyfikowane ekipy montażowe i tylko jeden punkt kontaktu dla wszystkich Twoich eventów.
          </p>
        </FadeIn>

        {/* Map */}
        <div
          ref={sectionRef}
          className="relative w-full overflow-hidden"
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "24px" }}
        >
          {rsm ? (
            <>
              {/* Zoom wrapper — controlled by GSAP */}
              <div ref={wrapperRef} style={{ transformOrigin: "center center", willChange: "transform" }}>
                <rsm.ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [-40, 48], scale: 260 }}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  width={SVG_W}
                  height={SVG_H}
                >
                  <rsm.Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <rsm.Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={HIGHLIGHTED.has(geo.id) ? "#1e1e1e" : "#1a1a1a"}
                          stroke={HIGHLIGHTED.has(geo.id) ? "#EF771B" : "#2a2a2a"}
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: HIGHLIGHTED.has(geo.id) ? "#252525" : "#1e1e1e" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </rsm.Geographies>

                  {/* Hidden arc path — used by MotionPathPlugin */}
                  <path id="plane-arc-path" d={PLANE_PATH_D} fill="none" stroke="none" />

                  {/* Plane trail — controlled by GSAP (pathLength via strokeDashoffset) */}
                  <path
                    ref={trailRef}
                    d={PLANE_PATH_D}
                    stroke="#EF771B"
                    strokeWidth="1.5"
                    strokeDasharray="1"
                    strokeDashoffset="1"
                    fill="none"
                    opacity="0"
                    pathLength={1}
                  />

                  {/* Airplane ✈ — controlled by GSAP MotionPath */}
                  <g ref={planeRef} style={{ opacity: 0 }}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: "16px", fill: "white", pointerEvents: "none", userSelect: "none" }}
                    >✈</text>
                  </g>

                  {/* Markers — auto-driven from LOCATIONS */}
                  {LOCATIONS.map((loc) => {
                    const visible = visibleIds.has(loc.id);
                    const sameRegion = zoom === "global" || zoom === loc.region;
                    const zooming = zoom !== "global";
                    const delay = loc.region === "europe"
                      ? (EUROPE_DELAYS.get(loc.id) ?? 0)
                      : (USA_DELAYS.get(loc.id) ?? 0);
                    // Dot style
                    const dotR = loc.isHQ ? 6 : loc.isHub ? 5 : 4;
                    const dotFill = loc.isHQ ? "#EF771B" : "white";
                    const dotStroke = "#EF771B";
                    // Inverse scale when zoomed
                    const markerScale = zooming && sameRegion ? 0.45 : 1;
                    const markerOpacity = zooming && !sameRegion ? 0 : visible ? 1 : 0;
                    // Label
                    const zoomed = zooming && sameRegion;
                    const citySize = zoomed ? (loc.isHQ || loc.isHub ? "11px" : "9px") : (loc.isHQ ? "8px" : "6px");
                    const bgW = loc.name.length * 5.5 + (zoomed ? 14 : 8);
                    const labelY = loc.isHQ ? -16 : -14;
                    return (
                      <rsm.Marker key={loc.id} coordinates={loc.coords}>
                        <motion.g
                          animate={{ opacity: markerOpacity, scale: markerScale }}
                          transition={{ duration: 0.55, ease: "easeInOut" }}
                          onMouseEnter={() => setHovered(loc.id)}
                          onMouseLeave={() => setHovered(null)}
                          style={{ cursor: "pointer" }}
                        >
                          {/* Entry animation */}
                          <motion.g
                            initial={{ opacity: 0, scale: 0 }}
                            animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                            transition={{ type: "spring", stiffness: 240, damping: 16, delay }}
                          >
                            {/* Pulse ring */}
                            <motion.circle
                              r={dotR * 2.5}
                              fill="none"
                              stroke="#EF771B"
                              strokeWidth="1"
                              animate={visible ? { scale: [1, 2.0], opacity: [0.6, 0] } : { scale: 1, opacity: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: loc.id * 0.18 }}
                            />
                            {/* Dot */}
                            <motion.circle
                              r={dotR}
                              fill={dotFill}
                              stroke={dotStroke}
                              strokeWidth={loc.isHQ ? 0 : 1.5}
                              animate={hovered === loc.id ? { scale: 1.7 } : { scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            />
                            {/* Label */}
                            <g>
                              <rect
                                x={-bgW / 2} y={labelY - 11} width={bgW} height={12} rx="2"
                                fill="#1A1A1A"
                                fillOpacity={zoomed ? 0.7 : 0}
                                style={{ transition: "fill-opacity 0.5s ease" }}
                              />
                              <text
                                y={labelY}
                                textAnchor="middle"
                                style={{
                                  fontFamily: "Arial, sans-serif",
                                  fontSize: citySize,
                                  fontWeight: "400",
                                  fill: loc.isHQ ? "#EF771B" : "rgba(255,255,255,0.75)",
                                  letterSpacing: "0.5px",
                                  pointerEvents: "none",
                                  transition: "font-size 0.4s ease",
                                }}
                              >
                                {loc.name}
                              </text>
                              <text
                                y={loc.isHQ ? -5 : -4}
                                textAnchor="middle"
                                style={{
                                  fontFamily: "Arial, sans-serif",
                                  fontSize: zoomed ? "9px" : "7px",
                                  fill: "rgba(255,255,255,0.5)",
                                  pointerEvents: "none",
                                  transition: "font-size 0.4s ease",
                                }}
                              >
                                {loc.flag}
                              </text>
                            </g>

                            {/* Tooltip */}
                            <AnimatePresence>
                              {hovered === loc.id && (
                                <motion.g
                                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                                >
                                  <rect x="-40" y="8" width="80" height="22" rx="3" fill="#1e1e1e" stroke="#EF771B" strokeWidth="0.5"/>
                                  <text x="0" y="17" textAnchor="middle" style={{ fontFamily: "Arial, sans-serif", fontSize: "7px", fontWeight: "700", fill: "#EF771B", pointerEvents: "none" }}>
                                    {loc.name} {loc.flag}
                                  </text>
                                  <text x="0" y="26" textAnchor="middle" style={{ fontFamily: "Arial, sans-serif", fontSize: "6px", fill: "rgba(255,255,255,0.5)", pointerEvents: "none" }}>
                                    {loc.country}{loc.isHQ ? " · HQ" : loc.isHub ? " · Hub" : ""}
                                  </text>
                                </motion.g>
                              )}
                            </AnimatePresence>
                          </motion.g>
                        </motion.g>
                      </rsm.Marker>
                    );
                  })}
                </rsm.ComposableMap>
              </div>

              {/* Zoom region indicator */}
              <motion.div
                className="absolute bottom-6 left-6 text-xs font-bold tracking-widest pointer-events-none"
                animate={{ opacity: zoom !== "global" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: "#EF771B" }}
              >
                {zoom === "europe" ? "◉ EUROPA" : zoom === "usa" ? "◉ USA" : ""}
              </motion.div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-600 text-sm">Ładowanie mapy…</div>
          )}
        </div>

        {/* Stats */}
        <FadeIn delay={0.3}>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black" style={{ color: "#EF771B" }}>{s.value}</div>
                <div className="text-xs font-bold tracking-widest text-gray-500 mt-1">{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── SKALA I LOGISTYKA ───────────────────────────────────────────────── */
function SkalaLogistyka() {
  const features = [
    { icon: "🌍", title: "Europa", desc: "Wszystkie główne targi europejskie – Frankfurt, Mediolan, Amsterdam, Paryż, Warszawa." },
    { icon: "🇺🇸", title: "USA", desc: "Własna baza logistyczna w Las Vegas. CES, NAB Show, Conexpo i inne kluczowe wydarzenia." },
    { icon: "🏭", title: "Własne Magazyny", desc: "Bezpieczne składowanie modułów w 6 lokalizacjach. Zawsze gotowe na kolejny event." },
    { icon: "👷", title: "Certyfikowane Ekipy", desc: "Własne ekipy montażowe z certyfikatami targowymi. Montaż w 24–48h, demontaż przez noc." },
  ];

  return (
    <section id="system" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="right">
            <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>ZASIĘG &amp; LOGISTYKA</div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
              Jesteśmy tam,<br />
              <span style={{ color: "#EF771B" }}>gdzie Twoi klienci.</span>
            </h2>
            <RevealLine delay={0.15} />
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Nie musisz martwić się o transport, magazynowanie ani montaż. Nasz
              system end-to-end sprawia, że Twoje stoisko jest zawsze gotowe –
              bez względu na kontynent.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Niemcy", "Holandia", "Włochy", "Francja", "Polska", "USA"].map((country) => (
                <span key={country} className="px-3 py-1.5 border text-xs font-bold tracking-widest" style={{ borderColor: "rgba(239,119,27,0.4)", color: "#EF771B" }}>
                  {country}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="p-6 border"
                  style={{ background: "#242424", borderColor: "#333" }}
                  whileHover={CARD_HOVER}
                >
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 border" style={{ borderColor: "#333" }}>
            {[
              { val: "20+", label: "Krajów" },
              { val: "6", label: "Baz Logistycznych" },
              { val: "48h", label: "Maks. Czas Montażu" },
              { val: "24/7", label: "Support Techniczny" },
            ].map((s, i) => (
              <div key={s.label} className="py-8 text-center" style={{ borderRight: i < 3 ? "1px solid #333" : undefined }}>
                <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: "#EF771B" }}>{s.val}</div>
                <div className="text-xs tracking-widest text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── LOOP ICONS (SVG + CSS animations, circle wrapper) ──────────────── */
function IconDesign({ active }: { active: boolean }) {
  return (
    <div className={`loop-icon-circle${active ? "" : " loop-icon-paused"}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* paper */}
        <rect x="5" y="3" width="20" height="26" rx="1.5" stroke="#EF771B" strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>
        {/* ruled lines */}
        <line x1="9" y1="11" x2="21" y2="11" stroke="#EF771B" strokeWidth="1" strokeOpacity="0.2"/>
        <line x1="9" y1="16" x2="21" y2="16" stroke="#EF771B" strokeWidth="1" strokeOpacity="0.2"/>
        <line x1="9" y1="21" x2="21" y2="21" stroke="#EF771B" strokeWidth="1" strokeOpacity="0.2"/>
        {/* drawn trail */}
        <polyline
          points="9,11 17,11 17,17 11,17 11,23"
          stroke="#EF771B" strokeWidth="1.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          className="icon-trail"
        />
        {/* pencil body */}
        <g className="icon-pencil" style={{ transformOrigin: "9px 11px" }}>
          <rect x="7" y="2" width="4" height="9" rx="0.8" fill="#EF771B"/>
          <polygon points="7,11 11,11 9,14.5" fill="white"/>
          <rect x="7" y="2" width="4" height="2" rx="0.8" fill="rgba(255,255,255,0.4)"/>
        </g>
      </svg>
    </div>
  );
}

function IconTech({ active }: { active: boolean }) {
  return (
    <div className={`loop-icon-circle${active ? "" : " loop-icon-paused"}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <clipPath id="screen-clip">
          <rect x="4" y="5" width="28" height="20" rx="1"/>
        </clipPath>
        {/* monitor frame */}
        <rect x="3" y="4" width="30" height="21" rx="1.5" stroke="#EF771B" strokeWidth="1.5" fill="none"/>
        {/* stand */}
        <line x1="13" y1="25" x2="13" y2="30" stroke="#EF771B" strokeWidth="1.5" strokeOpacity="0.45"/>
        <line x1="23" y1="25" x2="23" y2="30" stroke="#EF771B" strokeWidth="1.5" strokeOpacity="0.45"/>
        <line x1="10" y1="30" x2="26" y2="30" stroke="#EF771B" strokeWidth="1.5" strokeOpacity="0.45"/>
        {/* centre circle */}
        <circle cx="18" cy="14.5" r="5" stroke="#EF771B" strokeWidth="1.2" fill="none" strokeOpacity="0.5"/>
        {/* LED pixel dots */}
        {[10, 15, 20, 25].map((x, idx) => (
          <rect key={idx} x={x} y="13" width="2.5" height="2.5" rx="0.5"
            fill="#EF771B" className={`icon-led-${(idx % 3) + 1}`}/>
        ))}
        {/* scan lines */}
        <g clipPath="url(#screen-clip)">
          <rect x="3" y="0" width="30" height="2" fill="rgba(239,119,27,0.65)" className="icon-scan-1"/>
          <rect x="3" y="0" width="30" height="1.5" fill="rgba(239,119,27,0.35)" className="icon-scan-2"/>
          <rect x="3" y="0" width="30" height="1" fill="rgba(255,255,255,0.25)" className="icon-scan-3"/>
        </g>
      </svg>
    </div>
  );
}

function IconStore({ active }: { active: boolean }) {
  return (
    <div className={`loop-icon-circle${active ? "" : " loop-icon-paused"}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* 3D box: front face */}
        <rect x="6" y="16" width="18" height="16" rx="1" stroke="#EF771B" strokeWidth="1.5" fill="none"/>
        {/* top face */}
        <path d="M6 16 L12 10 L30 10 L24 16 Z" stroke="#EF771B" strokeWidth="1.5" fill="rgba(239,119,27,0.07)" strokeLinejoin="round"/>
        {/* right face */}
        <path d="M24 16 L30 10 L30 26 L24 32 Z" stroke="#EF771B" strokeWidth="1.5" fill="rgba(239,119,27,0.04)" strokeLinejoin="round"/>
        {/* lid overlay – animates open */}
        <g className="icon-lid" style={{ transformOrigin: "15px 16px" }}>
          <path d="M6 16 L12 10 L30 10 L24 16 Z" stroke="#EF771B" strokeWidth="1.5" fill="rgba(239,119,27,0.18)" strokeLinejoin="round"/>
        </g>
        {/* checkmark */}
        <polyline
          points="10,23 14,27 22,19"
          stroke="white" strokeWidth="1.8" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          className="icon-check"
        />
      </svg>
    </div>
  );
}

function IconExpand({ active }: { active: boolean }) {
  return (
    <div className={`loop-icon-circle${active ? "" : " loop-icon-paused"}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* centre dot */}
        <circle cx="18" cy="18" r="2.5" fill="#EF771B"/>
        {/* north */}
        <g className="icon-arrow-n" style={{ transformOrigin: "18px 11px" }}>
          <line x1="18" y1="15.5" x2="18" y2="7" stroke="#EF771B" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="15,10 18,6.5 21,10" stroke="#EF771B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {/* east */}
        <g className="icon-arrow-e" style={{ transformOrigin: "25px 18px" }}>
          <line x1="20.5" y1="18" x2="29" y2="18" stroke="#EF771B" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="26,15 29.5,18 26,21" stroke="#EF771B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {/* south */}
        <g className="icon-arrow-s" style={{ transformOrigin: "18px 25px" }}>
          <line x1="18" y1="20.5" x2="18" y2="29" stroke="#EF771B" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="15,26 18,29.5 21,26" stroke="#EF771B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {/* west */}
        <g className="icon-arrow-w" style={{ transformOrigin: "11px 18px" }}>
          <line x1="15.5" y1="18" x2="7" y2="18" stroke="#EF771B" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="10,15 6.5,18 10,21" stroke="#EF771B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    </div>
  );
}

const LOOP_ICONS = [IconDesign, IconTech, IconStore, IconExpand];

/* ─── PROCES ──────────────────────────────────────────────────────────── */
function Proces() {
  const steps = [
    {
      num: "01", name: "DESIGN",
      desc: "Projektujemy Twój modułowy system targowy. Każdy element zaplanowany z myślą o rekonfigurowalności i skalowalności.",
      details: ["Analiza potrzeb", "Projekt 3D", "Prototyp modułu", "Akceptacja"],
    },
    {
      num: "02", name: "TECH",
      desc: "Produkujemy moduły z najwyższej jakości materiałów. Integrujemy technologię LED i systemy multimedialne.",
      details: ["Produkcja CNC", "Integracja LED", "Systemy AV", "Testy QA"],
    },
    {
      num: "03", name: "STORE",
      desc: "Przechowujemy Twoje moduły w naszych bazach logistycznych. Zawsze gotowe, ubezpieczone, zinwentaryzowane.",
      details: ["Magazyn klimat.", "Inwentaryzacja", "Ubezpieczenie", "Zarządzanie"],
    },
    {
      num: "04", name: "EXPAND",
      desc: "Z każdym eventem Twój system rośnie. Dokupujesz moduły, rekonfikurujesz, adaptujesz do nowych przestrzeni.",
      details: ["Nowe moduły", "Rekonfiguracja", "Nowe targowisko", "ROI rośnie"],
    },
  ];

  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "0px 0px -100px 0px" });

  return (
    <section id="multimedia" className="py-24 sm:py-32" style={{ background: "#161616" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>NASZ PROCES</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">The NEATI Loop</h2>
          <RevealLine delay={0.1} />
          <p className="text-gray-400 text-lg max-w-2xl mb-12">
            Cykl, który zamienia jednorazowy wydatek w długoterminowe aktywo biznesowe.
          </p>
        </FadeIn>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            // Wrapper div – relative so the arrow can escape the card boundary
            <div key={step.name} className="relative">

              {/* Arrow – draws left→right after both adjacent cards have appeared */}
              {i < 3 && (
                <motion.div
                  className="hidden lg:flex absolute -right-3 top-12 z-10 w-6 h-6 items-center justify-center"
                  style={{ background: "#161616", transformOrigin: "left" }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={isInView
                    ? { scaleX: 1, opacity: 1 }
                    : { scaleX: 0, opacity: 0 }}
                  transition={{
                    duration: 0.38,
                    delay: i * 0.3 + 0.58,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="#EF771B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}

              {/* Card */}
              <motion.div
                className="relative p-8 h-full"
                style={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a" }}
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                animate={isInView
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 60, scale: 0.85 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 12,
                  delay: i * 0.3 + 0.1,
                }}
                whileHover={{
                  y: -8,
                  borderColor: "rgba(239,119,27,0.55)",
                  boxShadow: "0 0 0 1px rgba(239,119,27,0.3), 0 16px 48px rgba(239,119,27,0.12)",
                  transition: { type: "spring", stiffness: 400, damping: 28, delay: 0 },
                }}
              >
                {/* Animated icon in circle */}
                <motion.div
                  className="mb-5"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 180, damping: 14, delay: i * 0.3 + 0.05 }}
                >
                  {(() => { const Icon = LOOP_ICONS[i]; return <Icon active={isInView} />; })()}
                </motion.div>

                {/* Step number – small */}
                <motion.div
                  className="font-bold tracking-widest mb-2"
                  style={{ color: "#EF771B", fontSize: "11px", letterSpacing: "0.18em" }}
                  initial={{ opacity: 0, y: -12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16, delay: i * 0.3 }}
                >
                  {step.num}
                </motion.div>

                <div className="text-xl font-black mb-3 tracking-wider text-white">{step.name}</div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{step.desc}</p>
                <ul className="space-y-1.5">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full" style={{ background: "#EF771B" }} />{d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-bold tracking-widest text-gray-600">
            {steps.map((s, i) => (
              <span key={s.name}>
                <span style={{ color: "#EF771B" }}>{s.name}</span>
                {i < steps.length - 1 && <span className="mx-3 text-gray-700">→</span>}
              </span>
            ))}
            <span className="ml-3 text-gray-700">↺</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────────── */
function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Jak długo wytrzymują moduły NEATI?",
      a: "Nasze moduły są zaprojektowane na minimum 10 lat intensywnego użytkowania. Wykonane z profili aluminiowych i paneli kompozytowych, wytrzymują wielokrotny montaż i demontaż. Dożywotnia gwarancja na konstrukcję nośną. Większość klientów użytkuje swoje systemy ponad 7 lat bez wymiany głównych elementów.",
    },
    {
      q: "Czy stoisko modułowe wygląda tak samo dobrze jak stoisko budowane na miarę?",
      a: "Wygląda lepiej – bo jest wykonane z lepszych materiałów i z większą precyzją. Nasze moduły z grafikami wielkoformatowymi, podświetlaniem LED i wykończeniami premium wyglądają bardziej profesjonalnie niż większość stoisk z MDF. Potwierdzają to nagrody na ISE Berlin 2023 i CES Las Vegas 2024.",
    },
    {
      q: "Ile kosztuje magazynowanie między eventami?",
      a: "Oferujemy dwa modele: (1) Ryczałt miesięczny od 290 EUR za standardowy system 40 m², obejmujący ubezpieczenie, inwentaryzację i zarządzanie stanem modułów. (2) Model per-event – płacisz tylko za obsługę przy konkretnym wydarzeniu. Dla większości klientów ryczałt zwraca się już przy 2 eventach rocznie.",
    },
  ];

  return (
    <section id="ekologia" className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>NAJCZĘSTSZE PYTANIA</div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4">
            Masz pytania?<br />
            <span style={{ color: "#EF771B" }}>Mamy odpowiedzi.</span>
          </h2>
          <RevealLine delay={0.1} />
          <div className="mb-10" />
        </FadeIn>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <motion.div
                className="border"
                animate={{ borderColor: openIndex === i ? "rgba(239,119,27,0.4)" : "#333" }}
                transition={{ duration: 0.2 }}
                whileHover={CARD_HOVER}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className="text-base sm:text-lg font-bold text-white pr-4">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center border text-lg font-black"
                    style={{ borderColor: "#333", color: "#EF771B" }}
                  >
                    +
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed text-sm border-t border-[#333] pt-4">
                    {faq.a}
                  </div>
                </motion.div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── NASZE BIURA ─────────────────────────────────────────────────────── */
function NaszeBiura() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "0px 0px -80px 0px" });

  const offices = [
    {
      flag: "🇵🇱",
      country: "Polska — Siedziba Główna",
      city: "Przytkowice",
      address: "Przytkowice 601, 34-141 Przytkowice, Małopolska",
      addressNote: null,
      badges: ["Produkcja", "Magazyn", "Design"],
      mapUrl: "https://maps.google.com/?q=Przytkowice+601,+34-141+Przytkowice",
      mapActive: true,
    },
    {
      flag: "🇮🇹",
      country: "Włochy — Hub Europa Południowa",
      city: "Reggio Emilia",
      address: "Reggio Emilia, Emilia-Romania",
      addressNote: "Adres wkrótce",
      badges: ["Logistyka", "Montaż", "Serwis"],
      mapUrl: null,
      mapActive: false,
    },
  ];

  return (
    <section id="biura" className="py-24 sm:py-32" style={{ background: "#1A1A1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn>
          <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>NASZE BIURA</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            Gdzie<br />
            <span style={{ color: "#EF771B" }}>jesteśmy</span>
          </h2>
          <RevealLine delay={0.2} />
        </FadeIn>

        {/* Cards */}
        <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offices.map((office, i) => (
            <motion.div
              key={office.city}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.2 }}
              whileHover={CARD_HOVER}
              className="relative overflow-hidden flex flex-col"
              style={{
                background: "#1e1e1e",
                border: "1px solid #2a2a2a",
                padding: "2rem",
              }}
            >
              {/* Animated bottom bar on hover */}
              <motion.div
                className="absolute bottom-0 left-0 h-[2px] w-full"
                style={{ background: "#EF771B", scaleX: 0, transformOrigin: "left" }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* Flag + heading */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{office.flag}</span>
                <div>
                  <div className="text-xs font-bold tracking-widest mb-1" style={{ color: "#EF771B" }}>
                    {office.city.toUpperCase()}
                  </div>
                  <h3 className="text-xl font-black tracking-tight leading-tight">{office.country}</h3>
                </div>
              </div>

              {/* Divider */}
              <div className="mb-6" style={{ height: "1px", background: "#2a2a2a" }} />

              {/* Address */}
              <div className="mb-6">
                <div className="text-xs font-bold tracking-widest text-gray-500 mb-2">ADRES</div>
                <p className="text-sm text-gray-300 leading-relaxed">{office.address}</p>
                {office.addressNote && (
                  <p className="text-xs font-bold mt-1" style={{ color: "#EF771B" }}>
                    {office.addressNote}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {office.badges.map((badge, bi) => (
                  <motion.span
                    key={badge}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: i * 0.2 + bi * 0.1 + 0.4 }}
                    className="px-3 py-1 text-xs font-bold tracking-widest"
                    style={{ background: "rgba(239,119,27,0.12)", color: "#EF771B", border: "1px solid rgba(239,119,27,0.25)" }}
                  >
                    {badge}
                  </motion.span>
                ))}
              </div>

              {/* Map button */}
              <div className="mt-auto">
                {office.mapActive ? (
                  <a
                    href={office.mapUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black tracking-widest transition-all hover:gap-3"
                    style={{ color: "#EF771B" }}
                  >
                    Zobacz na mapie →
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center gap-2 text-xs font-black tracking-widest opacity-30 cursor-not-allowed"
                    style={{ color: "#EF771B" }}
                  >
                    Zobacz na mapie →
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── KONTAKT ─────────────────────────────────────────────────────────── */
function Kontakt() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", events: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle = { background: "#1A1A1A", border: "1px solid #333", color: "white" } as React.CSSProperties;

  return (
    <section id="kontakt" className="py-24 sm:py-32" style={{ background: "#161616" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <FadeIn direction="right">
            <div className="mb-4 text-xs font-bold tracking-widest" style={{ color: "#EF771B" }}>DARMOWA SYMULACJA ROI</div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-4">
              Przestań budować<br />
              <span style={{ color: "#EF771B" }}>śmieci.</span><br />
              Zacznij budować<br />
              <span className="underline" style={{ textDecorationColor: "#EF771B" }}>system.</span>
            </h2>
            <RevealLine delay={0.15} />
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Wypełnij formularz, a nasz ekspert przygotuje bezpłatną symulację ROI.
              Zobaczysz dokładnie, ile zaoszczędzisz w ciągu 3 lat.
            </p>
            <div className="space-y-3 mb-10">
              {["Bezpłatna konsultacja 45 min", "Symulacja ROI dla Twojej firmy", "Wstępny projekt koncepcyjny", "Bez zobowiązań"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="font-black" style={{ color: "#EF771B" }}>✓</span>{item}
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-[#333]">
              <p className="text-xs tracking-widest text-gray-500 mb-2">NAPISZ BEZPOŚREDNIO</p>
              <a href="mailto:hello@neati.com" className="text-lg font-bold text-white hover:text-[#EF771B] transition-colors">
                hello@neati.com
              </a>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.2}>
            <div className="border p-8" style={{ background: "#1f1f1f", borderColor: "#333" }}>
              {submitted ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                    style={{ color: "#EF771B" }}
                  >
                    ✓
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-3">Wiadomość wysłana!</h3>
                  <p className="text-gray-400">Odezwiemy się w ciągu 24 godzin z Twoją symulacją ROI.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">IMIĘ I NAZWISKO *</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none transition-colors" style={inputStyle} placeholder="Jan Kowalski" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">FIRMA *</label>
                      <input type="text" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none transition-colors" style={inputStyle} placeholder="Twoja Firma S.A." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">E-MAIL *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none transition-colors" style={inputStyle} placeholder="jan@firma.pl" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">TELEFON</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none transition-colors" style={inputStyle} placeholder="+48 600 000 000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">ILE EVENTÓW ROCZNIE? *</label>
                    <select required value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none cursor-pointer appearance-none" style={inputStyle}>
                      <option value="">Wybierz...</option>
                      <option value="1-2">1–2 eventy</option>
                      <option value="3-5">3–5 eventów</option>
                      <option value="6-10">6–10 eventów</option>
                      <option value="10+">Ponad 10 eventów</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2">DODATKOWE INFORMACJE</label>
                    <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} placeholder="Opisz swoje potrzeby, planowane targi, oczekiwany rozmiar stoiska..." />
                  </div>
                  <motion.button
                    type="submit"
                    className="w-full py-4 text-sm font-black tracking-widest"
                    style={{ background: "#EF771B", color: "#1A1A1A" }}
                    whileHover={{ scale: 1.02, background: "#d4621a" } as any}
                    whileTap={{ scale: 0.98 }}
                  >
                    ZAMÓW DARMOWĄ SYMULACJĘ ROI
                  </motion.button>
                  <p className="text-xs text-gray-600 text-center">Dane są chronione zgodnie z RODO. Nie wysyłamy spamu.</p>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-black tracking-widest mb-1">NEA<span style={{ color: "#EF771B" }}>TI</span></div>
            <p className="text-gray-600 text-xs">Modułowe Stoiska Targowe LED · Europa &amp; USA</p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-bold tracking-widest text-gray-600">
            <a href="#system" className="hover:text-white transition-colors">SYSTEM</a>
            <a href="#klienci" className="hover:text-white transition-colors">KLIENCI</a>
            <a href="#multimedia" className="hover:text-white transition-colors">MULTIMEDIA</a>
            <a href="#zasieg" className="hover:text-white transition-colors">ZASIĘG</a>
            <a href="#ekologia" className="hover:text-white transition-colors">EKOLOGIA</a>
            <a href="#biura" className="hover:text-white transition-colors">BIURA</a>
            <a href="#kontakt" className="hover:text-white transition-colors">KONTAKT</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#222] flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-700">
          <span>© 2024 NEATI. Wszelkie prawa zastrzeżone.</span>
          <span>Polityka Prywatności · Regulamin</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE ────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Filozofia />
      <Realizacje />
      <NasiKlienci />
      <SkalaLogistyka />
      <MapaSwiat />
      <Proces />
      <Faq />
      <Kontakt />
      <NaszeBiura />
      <Footer />
    </main>
  );
}
