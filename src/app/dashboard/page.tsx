"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode, Send, Download, History,
  Bell, Eye, EyeOff, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  X, ArrowRight, Wallet, Plus,
} from "lucide-react";

const DEMO_MERCHANT_ID = "00000000-0000-0000-0000-000000000001";
const WITHDRAWAL_FEE = 500;

interface Merchant { salesBalance: number; depositBalance: number; fiatCurrency: string; }
interface Tx { id: string; order_id: string | null; amount_fiat: number; platform_fee_fiat: number; status: string; pay_currency: string | null; created_at: string; }

function fmt(n: number, cur = "JPY") {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}

function statusLabel(s: string) {
  return s === "FINISHED" ? "完了" : s === "PENDING" || s === "WAITING" || s === "CONFIRMING" ? "処理中" : "失敗";
}

const CURRENCY_EMOJI: Record<string, string> = { BTC: "₿", ETH: "Ξ", USDT: "₮" };

/* ─────────── Sub-components ─────────── */

function TxRow({ tx, index }: { tx: Tx; index: number }) {
  const isPositive = tx.status === "FINISHED";
  const emoji = CURRENCY_EMOJI[tx.pay_currency ?? ""] ?? "💳";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
      className="tx-row flex items-center gap-4 px-5 py-4"
    >
      <div className="h-11 w-11 rounded-full flex items-center justify-center text-xl shrink-0 bg-[#F0F2F5]">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#0F172A] truncate">
          {tx.order_id ?? `決済 #${tx.id.slice(0, 6)}`}
        </p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          {new Date(tx.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`num text-[15px] font-bold ${isPositive ? "text-emerald-600" : "text-[#0F172A]"}`}>
          {isPositive ? "+" : ""}{fmt(Number(tx.amount_fiat))}
        </p>
        <p className={`text-[11px] font-medium mt-0.5 ${
          tx.status === "FINISHED" ? "text-emerald-500"
          : tx.status === "PENDING" || tx.status === "WAITING" ? "text-amber-500"
          : "text-red-400"
        }`}>
          {statusLabel(tx.status)}
        </p>
      </div>
    </motion.div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-white">
      <div className="shimmer h-11 w-11 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-3.5 w-36 rounded-full" />
        <div className="shimmer h-3 w-24 rounded-full" />
      </div>
      <div className="shimmer h-4 w-16 rounded-full" />
    </div>
  );
}

/* ─────────── Main Page ─────────── */

function DashboardContent() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get("merchantId") ?? DEMO_MERCHANT_ID;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [activeSheet, setActiveSheet] = useState<"pay" | "receive" | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payQR, setPayQR] = useState<{ transactionId: string; payAddress: string; payAmount: string; payCurrency: string } | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/merchant/${merchantId}`).then(r => r.json()),
      fetch(`/api/merchant/${merchantId}/transactions`).then(r => r.json()),
    ]).then(([m, t]) => {
      if (!m.error) setMerchant({ salesBalance: Number(m.sales_balance), depositBalance: Number(m.deposit_balance), fiatCurrency: m.fiat_currency });
      if (!t.error) setTransactions(t.transactions ?? []);
    }).finally(() => setLoading(false));
  }, [merchantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const headerCompact = scrollY > 60;

  const closeSheet = () => {
    setActiveSheet(null);
    setPayAmount("");
    setPayQR(null);
  };

  const handleGenerateQR = async () => {
    if (!payAmount || Number(payAmount) <= 0) return;
    setGeneratingQR(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, amountFiat: Number(payAmount), payCurrency: "btc", orderId: `ORD-${Date.now()}` }),
      }).then(r => r.json());
      if (!res.error) {
        setPayQR({ transactionId: res.transactionId, payAddress: res.payAddress, payAmount: String(res.payAmount), payCurrency: String(res.payCurrency).toUpperCase() });
      }
    } finally {
      setGeneratingQR(false);
    }
  };

  const fee = Math.ceil(Number(payAmount || 0) * 0.035);
  const total = Number(payAmount || 0) + fee;

  const ACTIONS: Array<{
    label: string;
    icon: React.ElementType;
    color: string;
    href?: string;
    onClick?: () => void;
  }> = [
    { label: "スキャン", icon: QrCode, color: "default", href: "/scan" },
    { label: "送金", icon: Send, color: "blue", onClick: () => {} },
    { label: "受取", icon: Download, color: "purple", onClick: () => setActiveSheet("pay") },
    { label: "履歴", icon: History, color: "slate", onClick: () => {} },
  ];

  return (
    <div
      ref={scrollRef}
      className="app-shell overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* ── Sticky Header ── */}
      <motion.header
        animate={{ height: headerCompact ? 56 : 72, backgroundColor: headerCompact ? "rgba(240,242,245,0.92)" : "rgba(240,242,245,0)" }}
        transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
        className="sticky top-0 z-40 flex items-center justify-between px-5 backdrop-blur-xl border-b border-transparent"
        style={{ borderBottomColor: headerCompact ? "rgba(0,0,0,0.06)" : "transparent" }}
      >
        <motion.div animate={{ scale: headerCompact ? 0.88 : 1 }} transition={{ duration: 0.28 }} className="flex items-center gap-2 origin-left">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shadow-md shadow-emerald-500/30">CP</div>
          <span className="font-bold text-[#0F172A] text-[15px] tracking-tight">クリプトペイ</span>
        </motion.div>
        <div className="flex items-center gap-3">
          <button className="relative h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Bell className="h-4 w-4 text-[#64748B]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 ring-2 ring-white shadow-sm" />
        </div>
      </motion.header>

      <div className="px-4 space-y-5 pb-10">
        {/* ── Wallet Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="wallet-card p-7 mt-1"
        >
          {loading ? (
            <div className="space-y-4">
              <div className="shimmer h-3 w-24 rounded-full opacity-30" style={{ background: "rgba(255,255,255,0.15)" }} />
              <div className="shimmer h-10 w-44 rounded-lg opacity-30" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
          ) : !merchant ? (
            <div className="text-center py-4">
              <p className="text-white/60 text-sm">加盟店データなし</p>
              <a href="/api/seed" className="text-emerald-300 text-xs underline mt-1 block">/api/seed で作成</a>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 mb-1">売上残高</p>
                  <div className="flex items-end gap-3">
                    {balanceVisible ? (
                      <motion.p
                        key="balance"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="num text-[38px] font-black text-white leading-none tracking-tight"
                      >
                        {fmt(merchant.salesBalance, merchant.fiatCurrency)}
                      </motion.p>
                    ) : (
                      <p className="num text-[38px] font-black text-white/30 leading-none tracking-tight">¥ ● ● ● ●</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setBalanceVisible(v => !v)}
                  className="h-9 w-9 rounded-full flex items-center justify-center relative z-10"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  {balanceVisible ? <Eye className="h-4 w-4 text-white/70" /> : <EyeOff className="h-4 w-4 text-white/70" />}
                </button>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-white/40 font-medium">デポジット残高</p>
                  <p className="num text-[15px] font-bold text-white/75">{fmt(merchant.depositBalance, merchant.fiatCurrency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px w-12 bg-white/10 hidden sm:block" />
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    稼働中
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-4 gap-3"
        >
          {ACTIONS.map(({ label, icon: Icon, color, href, onClick }) => {
            const content = (
              <motion.div
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="action-btn flex flex-col items-center gap-2.5 p-4"
                onClick={onClick}
              >
                <div className={`action-btn-icon ${color === "default" ? "" : color} h-13 w-13 flex items-center justify-center`}
                  style={{ height: 52, width: 52 }}>
                  <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-[12px] font-semibold text-[#0F172A] tracking-tight">{label}</span>
              </motion.div>
            );
            return href ? (
              <Link key={label} href={href}>{content}</Link>
            ) : (
              <div key={label}>{content}</div>
            );
          })}
        </motion.div>

        {/* ── Transaction Feed ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)", background: "white" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5]">
            <h2 className="text-[15px] font-bold text-[#0F172A]">最近の決済</h2>
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
              すべて <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : transactions.length === 0 ? (
            <div className="py-14 text-center">
              <Wallet className="mx-auto h-8 w-8 text-[#CBD5E1] mb-3" />
              <p className="text-sm text-[#94A3B8] font-medium">まだ決済がありません</p>
              <button
                onClick={() => setActiveSheet("pay")}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" /> 最初の決済を作成
              </button>
            </div>
          ) : (
            transactions.slice(0, 8).map((tx, i) => <TxRow key={tx.id} tx={tx} index={i} />)
          )}
        </motion.div>

        {/* ── Create Payment CTA ── */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveSheet("pay")}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-[15px] font-bold text-white flex items-center justify-center gap-2"
          style={{ boxShadow: "0 8px 24px rgba(5,150,105,0.3), 0 2px 6px rgba(5,150,105,0.15)" }}
        >
          <QrCode className="h-5 w-5" />
          決済QRコードを作成する
        </motion.button>
      </div>

      {/* ─────────── Bottom Sheets ─────────── */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="sheet-overlay"
              onClick={closeSheet}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
              className="sheet"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" />
              </div>

              <div className="px-5 pb-8 pt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-bold text-[#0F172A]">
                    {payQR ? "決済QRコード" : "新規決済を作成"}
                  </h3>
                  <button onClick={closeSheet} className="h-8 w-8 rounded-full bg-[#F0F2F5] flex items-center justify-center">
                    <X className="h-4 w-4 text-[#64748B]" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Amount Input ── */}
                  {!payQR && (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-5"
                    >
                      {/* Big amount input */}
                      <div className="text-center py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8] mb-3">商品代金</p>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-3xl font-bold text-[#94A3B8]">¥</span>
                          <input
                            type="number"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            placeholder="0"
                            autoFocus
                            className="num text-5xl font-black text-[#0F172A] bg-transparent border-none outline-none w-full text-center placeholder:text-[#CBD5E1]"
                            style={{ maxWidth: 220 }}
                          />
                        </div>
                      </div>

                      {/* Fee breakdown */}
                      {Number(payAmount) > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="rounded-2xl bg-[#F8F9FB] p-4 space-y-2.5"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-[#64748B]">商品代金</span>
                            <span className="num font-semibold text-[#0F172A]">{fmt(Number(payAmount))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#94A3B8]">システム利用料 <span className="text-[11px]">(3.5%)</span></span>
                            <span className="num text-[#94A3B8]">{fmt(fee)}</span>
                          </div>
                          <div className="border-t border-[#E2E8F0] pt-2.5 flex justify-between">
                            <span className="text-sm font-bold text-[#0F172A]">請求総額</span>
                            <span className="num font-black text-emerald-600 text-[17px]">{fmt(total)}</span>
                          </div>
                        </motion.div>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleGenerateQR}
                        disabled={!payAmount || Number(payAmount) <= 0 || generatingQR}
                        className="w-full rounded-2xl bg-emerald-500 py-4 text-[15px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-30"
                        style={{ boxShadow: "0 8px 20px rgba(5,150,105,0.28)" }}
                      >
                        {generatingQR ? (
                          <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <><QrCode className="h-5 w-5" /> QRコードを生成</>
                        )}
                      </motion.button>
                    </motion.div>
                  )}

                  {/* ── QR Display ── */}
                  {payQR && (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.94, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-5"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div
                            className="absolute -inset-3 rounded-3xl opacity-30 blur-xl"
                            style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }}
                          />
                          <div className="relative bg-white rounded-3xl p-5 shadow-xl">
                            <QRCodeSVG
                              value={`bitcoin:${payQR.payAddress}?amount=${payQR.payAmount}`}
                              size={200}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="num text-2xl font-black text-[#0F172A]">{payQR.payAmount} <span className="text-base font-bold text-[#94A3B8]">{payQR.payCurrency}</span></p>
                          <p className="text-sm text-[#94A3B8] mt-0.5">{fmt(total)} 相当</p>
                        </div>
                      </div>

                      <p className="text-center text-[11px] font-mono text-[#94A3B8] truncate px-4">
                        {payQR.payAddress}
                      </p>

                      <Link href={`/pay/new?amount=${payAmount}&merchant=${merchantId}`}>
                        <button className="w-full rounded-2xl border border-[#E2E8F0] py-3.5 text-sm font-semibold text-[#64748B] flex items-center justify-center gap-2 hover:bg-[#F8F9FB] transition-colors">
                          決済ページで開く <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
