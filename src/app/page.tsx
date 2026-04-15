"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Wallet,
  ArrowRightLeft,
  QrCode,
  ArrowRight,
  Zap,
  Lock,
  Globe,
} from "lucide-react";

const STATS = [
  { label: "対応通貨", value: "50+", unit: "種類" },
  { label: "決済手数料", value: "3.5", unit: "%" },
  { label: "送金スピード", value: "< 30", unit: "秒" },
  { label: "稼働率", value: "99.9", unit: "%" },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "法定通貨での自動受取",
    description:
      "顧客がBTC・ETHで支払った代金をリアルタイムに円・ドルへ自動換金。ボラティリティリスクをゼロに。",
    accent: "emerald",
    size: "large",
  },
  {
    icon: Shield,
    title: "完全な法令遵守",
    description:
      "暗号資産交換業に抵触しない「手数料デポジット制」。コンプライアンスを担保しながら安全に運用。",
    accent: "blue",
    size: "normal",
  },
  {
    icon: QrCode,
    title: "圧倒的に美しいUI",
    description:
      "購入者が迷わない、極限まで研ぎ澄まされた決済画面。ワンタップでQRを生成。",
    accent: "purple",
    size: "normal",
  },
  {
    icon: Zap,
    title: "即時決済確認",
    description:
      "Webhookによるリアルタイムステータス更新。決済完了を瞬時に検知し、ビジネスロジックを自動実行。",
    accent: "amber",
    size: "normal",
  },
  {
    icon: ArrowRightLeft,
    title: "エンタープライズ連携",
    description:
      "NOWPaymentsの堅牢なCustody+Fiat Payoutインフラをバックエンドに採用。高可用なトランザクションを保証。",
    accent: "emerald",
    size: "large",
  },
];

const accentMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "rgba(16,185,129,0.08)", text: "#10b981", border: "rgba(16,185,129,0.2)" },
  blue: { bg: "rgba(59,130,246,0.08)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  purple: { bg: "rgba(168,85,247,0.08)", text: "#a855f7", border: "rgba(168,85,247,0.2)" },
  amber: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#080808] bg-grid overflow-x-hidden">
      {/* Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="orb absolute w-[600px] h-[600px] opacity-30"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            top: "-200px",
            left: "-100px",
          }}
        />
        <div
          className="orb absolute w-[500px] h-[500px] opacity-20"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            bottom: "0",
            right: "-150px",
            animationDelay: "4s",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white text-[11px] font-black tracking-widest shadow-lg shadow-emerald-500/30">
              CP
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              クリプトペイ
            </span>
            <span className="ml-1 hidden sm:inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Beta
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["機能", "料金", "ドキュメント"].map((item) => (
              <span
                key={item}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {item}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/pay/demo" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              デモ
            </Link>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 hover:-translate-y-px active:translate-y-0">
                ダッシュボード
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-7xl px-6 pt-40 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-zinc-400"
            >
              <div className="status-dot" />
              システム正常稼働中 — 全サービス利用可能
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[1.05]"
            >
              <span className="text-gradient">暗号資産決済を、</span>
              <br />
              <span className="text-gradient-green">法定通貨</span>
              <span className="text-gradient">で受け取る。</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed"
            >
              クリプトペイは、B2B/B2C向けの暗号資産決済代行プラットフォーム。
              顧客は暗号資産でシームレスに支払い、あなたはボラティリティリスクなしで
              <strong className="font-semibold text-zinc-200">日本円・ドル</strong>を受け取れます。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-3"
            >
              <Link href="/setup">
                <button className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-emerald-400/30 active:translate-y-0">
                  無料で始める
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/pay/demo">
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-[15px] font-medium text-zinc-300 backdrop-blur transition-all hover:bg-white/[0.06] hover:text-white hover:border-white/20">
                  決済UIを体験する
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto mt-20 max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03]"
          >
            {STATS.map(({ label, value, unit }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 px-6 py-6 bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
              >
                <div className="num text-3xl font-black text-white">
                  {value}
                  <span className="text-lg font-medium text-zinc-500 ml-0.5">{unit}</span>
                </div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-7xl px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-3">
                機能
              </p>
              <h2 className="text-4xl font-black tracking-tight text-gradient">
                すべてが揃っている。
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Large card 1 */}
              <div className="md:col-span-2 glass-card rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"
                  style={{ background: "rgba(16,185,129,0.12)", marginRight: "-60px", marginTop: "-60px" }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentMap.emerald.bg, border: `1px solid ${accentMap.emerald.border}` }}
                  >
                    <Wallet className="h-5 w-5" style={{ color: accentMap.emerald.text }} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">法定通貨での自動受取</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                    顧客がビットコインやイーサリアムで支払った代金を、リアルタイムに法定通貨（JPY/USD等）へ換金。
                    価格変動リスクをゼロに抑えながら、安定した売上を確保できます。
                  </p>
                </div>
              </div>

              {/* Shield */}
              <div className="glass-card rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-36 h-36 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"
                  style={{ background: "rgba(59,130,246,0.1)" }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentMap.blue.bg, border: `1px solid ${accentMap.blue.border}` }}
                  >
                    <Shield className="h-5 w-5" style={{ color: accentMap.blue.text }} />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-white">完全な法令遵守</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    暗号資産交換業に抵触しない「手数料デポジット制」という画期的スキームでコンプライアンスを担保。
                  </p>
                </div>
              </div>

              {/* QR */}
              <div className="glass-card rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"
                  style={{ background: "rgba(168,85,247,0.1)" }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentMap.purple.bg, border: `1px solid ${accentMap.purple.border}` }}
                  >
                    <QrCode className="h-5 w-5" style={{ color: accentMap.purple.text }} />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-white">圧倒的に美しいUI</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    購入者が迷わない、極限まで研ぎ澄まされた決済画面。ワンタップでQRコードを生成。
                  </p>
                </div>
              </div>

              {/* Zap */}
              <div className="glass-card rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className="absolute bottom-0 right-0 w-36 h-36 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentMap.amber.bg, border: `1px solid ${accentMap.amber.border}` }}
                  >
                    <Zap className="h-5 w-5" style={{ color: accentMap.amber.text }} />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-white">即時決済確認</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Webhookによるリアルタイム更新。決済完了を瞬時に検知しビジネスロジックを自動実行。
                  </p>
                </div>
              </div>

              {/* Large card 2 */}
              <div className="md:col-span-2 glass-card rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"
                  style={{ background: "rgba(16,185,129,0.08)", marginLeft: "-60px", marginBottom: "-60px" }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentMap.emerald.bg, border: `1px solid ${accentMap.emerald.border}` }}
                  >
                    <Globe className="h-5 w-5" style={{ color: accentMap.emerald.text }} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">エンタープライズグレードのインフラ</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                    NOWPaymentsの堅牢なCustody + Fiat Payoutインフラをバックエンドに採用。
                    高可用なトランザクション処理と安全なウォレット管理を実現します。
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-7xl px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden border border-white/[0.07] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-px"
          >
            <div className="glass-card rounded-3xl px-12 py-16 text-center relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-96 h-96 rounded-full blur-[100px] opacity-20" style={{ background: "#10b981" }} />
              </div>
              <div className="relative z-10">
                <Lock className="mx-auto mb-6 h-10 w-10 text-emerald-400" />
                <h2 className="text-4xl font-black tracking-tight text-white mb-4">
                  今すぐ始める準備はできていますか？
                </h2>
                <p className="mx-auto max-w-xl text-zinc-400 mb-10 leading-relaxed">
                  セットアップに必要なのは数分だけ。NOWPayments APIキーとSupabaseプロジェクトがあれば、
                  すぐに暗号資産決済を受け付け始められます。
                </p>
                <Link href="/setup">
                  <button className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-emerald-400/40">
                    無料で始める
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white text-[9px] font-black">
              CP
            </div>
            <span className="text-sm font-semibold text-zinc-400">CryptoPay</span>
          </div>
          <p className="text-xs text-zinc-600 text-center max-w-md">
            クリプトペイは決済代行システムであり、暗号資産交換業には該当しません。
            手数料は「システム利用料」としてデポジット（預り金）から充当されます。
          </p>
        </div>
      </footer>
    </div>
  );
}
