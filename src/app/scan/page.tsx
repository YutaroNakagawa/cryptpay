"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Zap, Camera, CheckCircle2, ArrowRight,
  AlertTriangle, RotateCcw,
} from "lucide-react";

const DEMO_MERCHANT_ID = "00000000-0000-0000-0000-000000000001";

type Phase = "scanning" | "detected" | "confirming" | "success";

const MOCK_PAYMENT = {
  merchant: "クリプトペイ デモ店",
  amount: 3200,
  currency: "JPY",
  btcAmount: "0.00021333",
  address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
};

function fmt(n: number, cur = "JPY") {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}

/* ── QR Frame Corners ── */
function QRFrame({ detected }: { detected: boolean }) {
  const cornerStyle = {
    position: "absolute" as const,
    width: 32,
    height: 32,
    borderColor: detected ? "#10b981" : "rgba(255,255,255,0.9)",
    borderStyle: "solid" as const,
    transition: "border-color 0.3s ease, border-width 0.3s ease",
    borderWidth: detected ? 3 : 2.5,
  };
  return (
    <div className="relative" style={{ width: 260, height: 260 }}>
      {/* Corners */}
      <div style={{ ...cornerStyle, top: 0, left: 0, borderRight: "none", borderBottom: "none", borderTopLeftRadius: 4 }} />
      <div style={{ ...cornerStyle, top: 0, right: 0, borderLeft: "none", borderBottom: "none", borderTopRightRadius: 4 }} />
      <div style={{ ...cornerStyle, bottom: 0, left: 0, borderRight: "none", borderTop: "none", borderBottomLeftRadius: 4 }} />
      <div style={{ ...cornerStyle, bottom: 0, right: 0, borderLeft: "none", borderTop: "none", borderBottomRightRadius: 4 }} />

      {/* Scanning line */}
      {!detected && (
        <div className="absolute inset-[2px] overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, transparent, #10b981 30%, #34d399 50%, #10b981 70%, transparent)",
              boxShadow: "0 0 12px rgba(16,185,129,0.8), 0 0 24px rgba(16,185,129,0.4)",
            }}
          />
        </div>
      )}

      {/* Detected flash */}
      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{ background: "rgba(16,185,129,0.25)", borderRadius: 2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Confirmation Sheet ── */
function ConfirmSheet({
  onConfirm,
  onCancel,
  confirming,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}) {
  const fee = Math.ceil(MOCK_PAYMENT.amount * 0.035);
  const total = MOCK_PAYMENT.amount + fee;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        onClick={onCancel}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
        className="fixed bottom-0 left-1/2 z-50 w-full"
        style={{ maxWidth: 430, transform: "translateX(-50%)", background: "white", borderRadius: "28px 28px 0 0", boxShadow: "0 -12px 48px rgba(0,0,0,0.2)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" />
        </div>

        <div className="px-6 pt-2 pb-10 space-y-5">
          {/* Merchant */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0" style={{ border: "1px solid rgba(16,185,129,0.15)" }}>
              🏪
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-[17px]">{MOCK_PAYMENT.merchant}</p>
              <p className="text-sm text-[#64748B] mt-0.5">QRスキャン決済</p>
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#F8F9FB" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">商品代金</span>
              <span className="num font-semibold text-[#0F172A]">{fmt(MOCK_PAYMENT.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#94A3B8]">システム利用料 (3.5%)</span>
              <span className="num text-[#94A3B8]">{fmt(fee)}</span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0F172A]">合計</span>
                <span className="num font-black text-emerald-600 text-[22px]">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* BTC info */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <span className="text-[12px] font-medium text-emerald-700">BTC送金額</span>
            <span className="num text-[13px] font-bold text-emerald-700">{MOCK_PAYMENT.btcAmount} BTC</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-[#E2E8F0] py-4 text-[15px] font-semibold text-[#64748B] hover:bg-[#F8F9FB] transition-colors"
            >
              キャンセル
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={onConfirm}
              disabled={confirming}
              className="flex-[2] rounded-2xl bg-emerald-500 py-4 text-[15px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ boxShadow: "0 8px 20px rgba(5,150,105,0.3)" }}
            >
              {confirming ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><CheckCircle2 className="h-5 w-5" /> 支払いを確定</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Main Page ── */

export default function ScanPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [flashOn, setFlashOn] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dots, setDots] = useState("");

  // Animate waiting dots
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => clearInterval(t);
  }, [phase]);

  const handleScanDemo = () => {
    setPhase("detected");
    setTimeout(() => setPhase("confirming"), 600);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1200));
    setConfirming(false);
    setPhase("success");
  };

  const handleRetry = () => {
    setPhase("scanning");
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#000", maxWidth: 430, margin: "0 auto" }}
    >
      {/* ── Camera Simulation BG ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(20,30,50,0.95) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 60%, rgba(10,20,40,0.98) 0%, transparent 60%),
            linear-gradient(180deg, #0d1117 0%, #111827 100%)
          `,
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
        >
          <X className="h-5 w-5 text-white" />
        </motion.button>

        <div className="text-center">
          <p className="text-[15px] font-semibold text-white">スキャン決済</p>
          <p className="text-[11px] text-white/40 mt-0.5">QRコードを読み取ってください</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setFlashOn(f => !f)}
          className="h-10 w-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: flashOn ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: flashOn ? "1px solid rgba(251,191,36,0.4)" : "none",
          }}
        >
          <Zap className={`h-5 w-5 ${flashOn ? "text-amber-300" : "text-white"}`} />
        </motion.button>
      </div>

      {/* ── Viewfinder ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8">
        {/* QR Frame */}
        <div className="relative flex items-center justify-center">
          {/* Outer blur ring */}
          <AnimatePresence>
            {phase === "detected" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.15, 1.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute rounded-2xl"
                style={{
                  inset: -16,
                  background: "rgba(16,185,129,0.15)",
                  filter: "blur(12px)",
                }}
              />
            )}
          </AnimatePresence>

          <QRFrame detected={phase === "detected" || phase === "confirming"} />

          {/* Flash overlay on detect */}
          <AnimatePresence>
            {flashOn && (
              <motion.div
                animate={{ opacity: [0.15, 0.08, 0.15] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-sm"
                style={{ background: "rgba(251,191,36,0.15)" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center space-y-1"
            >
              <p className="text-[15px] font-medium text-white/80">
                スキャン中{dots}
              </p>
              <p className="text-[12px] text-white/35">
                QRコードをフレーム内に合わせてください
              </p>
            </motion.div>
          )}
          {phase === "detected" && (
            <motion.div
              key="detected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-[15px] font-semibold text-emerald-400">QRコードを検出しました</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera icon decoration */}
        {phase === "scanning" && (
          <div className="flex items-center gap-3 opacity-20">
            <div className="h-px w-16 bg-white" />
            <Camera className="h-5 w-5 text-white" />
            <div className="h-px w-16 bg-white" />
          </div>
        )}
      </div>

      {/* ── Bottom Panel ── */}
      <div className="relative z-10 pb-10">
        {phase === "scanning" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-5 space-y-3"
          >
            {/* Demo trigger */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handleScanDemo}
              className="w-full rounded-2xl py-4 text-[15px] font-bold text-emerald-400 flex items-center justify-center gap-2"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Camera className="h-5 w-5" />
              Demo: QRをスキャンする
            </motion.button>

            <p className="text-center text-[11px] text-white/25 font-medium">
              ※ デモ環境のため実際のカメラは使用しません
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Confirmation Sheet ── */}
      <AnimatePresence>
        {phase === "confirming" && (
          <ConfirmSheet
            onConfirm={handleConfirm}
            onCancel={() => { setPhase("scanning"); }}
            confirming={confirming}
          />
        )}
      </AnimatePresence>

      {/* ── Success Overlay ── */}
      <AnimatePresence>
        {phase === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
          >
            {/* Success ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative mb-8"
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: "rgba(16,185,129,0.3)", transform: "scale(1.4)" }}
              />
              <div
                className="relative h-28 w-28 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.3 }}
                >
                  <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-2 px-8"
            >
              <p className="text-2xl font-black text-white">支払い完了</p>
              <p className="num text-4xl font-black text-emerald-400 my-4">
                {fmt(MOCK_PAYMENT.amount + Math.ceil(MOCK_PAYMENT.amount * 0.035))}
              </p>
              <p className="text-sm text-white/50">{MOCK_PAYMENT.merchant} への決済が完了しました</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 mt-10 px-6 w-full"
              style={{ maxWidth: 360 }}
            >
              <button
                onClick={handleRetry}
                className="flex-1 rounded-2xl py-4 text-[15px] font-semibold text-white/60 flex items-center justify-center gap-2"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <RotateCcw className="h-4 w-4" /> 続けてスキャン
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/dashboard")}
                className="flex-[1.5] rounded-2xl py-4 text-[15px] font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 8px 24px rgba(5,150,105,0.35)" }}
              >
                ホームへ <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
