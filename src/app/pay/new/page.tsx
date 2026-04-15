"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Clock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function fmt(amount: number, currency = "JPY") {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

interface PaymentData {
  transactionId: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const merchantId = searchParams.get("merchant");
  const amount = amountParam ? Number(amountParam) : 0;
  const fee = Math.ceil(amount * 0.035);
  const total = amount + fee;

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [status, setStatus] = useState<"pending" | "finished" | "expired">("pending");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [completing, setCompleting] = useState(false);
  const creatingRef = useRef(false);

  // 決済インボイスを作成
  useEffect(() => {
    if (!amount || amount <= 0 || !merchantId) {
      setLoading(false);
      return;
    }
    if (creatingRef.current) return;
    creatingRef.current = true;

    fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        amountFiat: amount,
        payCurrency: "btc",
        orderId: `ORD-${Date.now()}`,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else
          setPaymentData({
            transactionId: data.transactionId,
            payAddress: data.payAddress,
            payAmount: String(data.payAmount),
            payCurrency: String(data.payCurrency).toUpperCase(),
          });
      })
      .catch(() => setLoadError("決済の作成に失敗しました。"))
      .finally(() => setLoading(false));
  }, [amount, merchantId]);

  // カウントダウンタイマー
  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setStatus("expired"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  // 本番: 決済ステータスをポーリング（5秒ごと）
  useEffect(() => {
    if (!paymentData?.transactionId || status !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/payments/${paymentData.transactionId}`);
        if (!r.ok) return;
        const data = await r.json();
        if (data.status === "FINISHED") setStatus("finished");
        else if (data.status === "FAILED" || data.status === "EXPIRED") setStatus("expired");
      } catch {
        // ポーリングエラーは無視
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentData?.transactionId, status]);

  const min = Math.floor(secondsLeft / 60);
  const sec = secondsLeft % 60;
  const progress = secondsLeft / 1800;

  const handleCopy = async (text: string, type: "address" | "amount") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // デモ専用: 手動で完了ステータスにする
  const handleDemoComplete = async () => {
    if (!paymentData || completing) return;
    setCompleting(true);
    try {
      const r = await fetch(`/api/payments/${paymentData.transactionId}/demo-complete`, {
        method: "POST",
      });
      if (r.ok) setStatus("finished");
    } finally {
      setCompleting(false);
    }
  };

  if (!amount || amount <= 0 || !merchantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400 mb-4" />
          <p className="text-lg font-bold text-white">無効なリクエスト</p>
          <p className="text-sm text-zinc-500 mt-2">正しい決済リンクからアクセスしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] bg-grid flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/[0.06] px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/30">
            CP
          </div>
          <span className="text-sm font-semibold text-white">クリプトペイ</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          安全に保護された通信
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ── Loading ── */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-3xl p-10 text-center"
              >
                <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-500" />
                <p className="text-sm font-medium text-zinc-400">決済情報を生成中...</p>
              </motion.div>
            )}

            {/* ── Error ── */}
            {!loading && loadError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-10 text-center border border-red-500/20"
              >
                <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-4" />
                <p className="text-lg font-bold text-white mb-2">エラーが発生しました</p>
                <p className="text-sm text-zinc-500">{loadError}</p>
              </motion.div>
            )}

            {/* ── Pending ── */}
            {!loading && !loadError && paymentData && status === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-3xl overflow-hidden"
              >
                {/* Timer bar */}
                <div className="h-0.5 bg-white/[0.04]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="p-8">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600 mb-1">請求額</p>
                      <div className="num text-4xl font-black text-white tracking-tight leading-none">
                        {paymentData.payAmount}
                        <span className="text-xl font-bold text-zinc-500 ml-2">{paymentData.payCurrency}</span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1.5">{fmt(total)} 相当</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1.5 text-xs font-semibold text-amber-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      {min}:{String(sec).padStart(2, "0")}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="relative mx-auto w-fit mb-8">
                    <div
                      className="absolute -inset-3 rounded-3xl opacity-40 blur-xl"
                      style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }}
                    />
                    <div className="relative rounded-2xl bg-white p-5 shadow-2xl">
                      <QRCodeSVG
                        value={`bitcoin:${paymentData.payAddress}?amount=${paymentData.payAmount}`}
                        size={180}
                        level="Q"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-2 text-center">
                      送金先アドレス
                    </p>
                    <button
                      onClick={() => handleCopy(paymentData.payAddress, "address")}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all active:scale-[0.99]"
                    >
                      <span className="truncate font-mono text-[13px] text-zinc-300 flex-1 text-left">
                        {paymentData.payAddress}
                      </span>
                      <div className={`shrink-0 rounded-lg p-1.5 transition-colors ${copied === "address" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-zinc-500"}`}>
                        {copied === "address" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </div>
                    </button>
                  </div>

                  {/* Amount copy */}
                  <button
                    onClick={() => handleCopy(paymentData.payAmount, "amount")}
                    className="w-full flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-all mb-6 group"
                  >
                    <span className="text-xs text-zinc-600">送金額をコピー</span>
                    <div className="flex items-center gap-2">
                      <span className="num font-bold text-zinc-300 text-sm">{paymentData.payAmount} {paymentData.payCurrency}</span>
                      <div className={`rounded-md p-1 transition-colors ${copied === "amount" ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                        {copied === "amount" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </button>

                  {/* Breakdown */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-2.5 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">商品代金</span>
                      <span className="num font-medium text-zinc-200">{fmt(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">システム利用料</span>
                      <span className="num text-zinc-400">{fmt(fee)}</span>
                    </div>
                    <div className="border-t border-white/[0.05] pt-2.5 flex justify-between">
                      <span className="text-sm font-semibold text-zinc-300">合計</span>
                      <span className="num font-bold text-white">{fmt(total)}</span>
                    </div>
                  </div>

                  {/* ポーリング中インジケーター */}
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    支払いを待っています...
                  </div>

                  {/* デモモード時のみ表示 */}
                  {IS_DEMO && (
                    <button
                      onClick={handleDemoComplete}
                      disabled={completing}
                      className="w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-50"
                    >
                      {completing ? "処理中..." : "（Demo）支払いを完了する"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Finished ── */}
            {status === "finished" && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-3xl p-12 text-center glow-green"
              >
                <div className="relative mx-auto mb-6 w-fit">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40"
                    style={{ background: "#10b981" }}
                  />
                  <div className="relative h-20 w-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                  お支払いが完了しました
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {fmt(total)} 分の決済を正常に確認しました。<br />
                  ご利用ありがとうございます。
                </p>
                <div className="mt-8 num text-3xl font-black text-gradient-green">
                  {fmt(total)}
                </div>
              </motion.div>
            )}

            {/* ── Expired ── */}
            {status === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-12 text-center border border-amber-500/20"
              >
                <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-amber-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">期限切れ</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  セッションの有効期限が切れました。<br />
                  加盟店にて再度決済URLを発行してください。
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-[10px] font-medium text-zinc-700 uppercase tracking-[0.2em]">
            Powered by CryptoPay Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-500" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
