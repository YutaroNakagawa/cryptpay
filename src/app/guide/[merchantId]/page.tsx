"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy, CheckCircle2, ExternalLink, LayoutDashboard,
  QrCode, Code2, ArrowRight, Store, AlertTriangle,
} from "lucide-react";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

function CopyBox({ label, value, id, copied, onCopy }: {
  label: string; value: string; id: string;
  copied: string | null; onCopy: (v: string, k: string) => void;
}) {
  const isCopied = copied === id;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">{label}</span>
        <button
          onClick={() => onCopy(value, id)}
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
            isCopied
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300"
          }`}
        >
          {isCopied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {isCopied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <div className="px-4 py-3 font-mono text-sm text-zinc-300 break-all">{value}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/30">
          {n}
        </div>
        <h2 className="text-[17px] font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

export default function GuidePage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { copied, copy } = useCopy();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const dashboardUrl = `${origin}/dashboard?merchantId=${merchantId}`;
  const payUrl = `${origin}/pay/new?amount=10000&merchant=${merchantId}`;
  const payUrlTemplate = `${origin}/pay/new?amount={金額}&merchant=${merchantId}`;

  useEffect(() => {
    fetch(`/api/merchant/${merchantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else setMerchantName(d.name);
      })
      .catch(() => setNotFound(true));
  }, [merchantId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400 mb-4" />
          <p className="text-white font-bold text-lg">加盟店が見つかりません</p>
          <p className="text-zinc-500 text-sm mt-1">URLを確認してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] bg-grid">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)", filter: "blur(80px)", top: "-100px", right: "-100px" }} />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/[0.06] px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/30">CP</div>
          <span className="text-sm font-semibold text-white">クリプトペイ — 導入ガイド</span>
        </div>
        <a
          href={dashboardUrl}
          className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          ダッシュボード
        </a>
      </header>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 space-y-4">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Store className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {merchantName ? `${merchantName} の導入ガイド` : "導入ガイド"}
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            以下の URL があなた専用です。このページをブックマークしてください。
          </p>
        </motion.div>

        {/* Merchant ID */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-2">あなたの Merchant ID</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-mono text-sm text-white break-all">{merchantId}</code>
            <button
              onClick={() => copy(merchantId, "mid")}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                copied === "mid" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.06] text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {copied === "mid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "mid" ? "コピー済み" : "コピー"}
            </button>
          </div>
        </motion.div>

        {/* Step 1: Dashboard */}
        <Step n={1} title="売上をダッシュボードで確認する">
          <p className="text-sm text-zinc-400">このURLにアクセスすると売上残高・決済履歴が見られます。</p>
          <CopyBox label="ダッシュボードURL" value={dashboardUrl} id="dash" copied={copied} onCopy={copy} />
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            今すぐダッシュボードを開く
          </a>
        </Step>

        {/* Step 2: Payment URL */}
        <Step n={2} title="EC サイトに決済リンクを貼る">
          <p className="text-sm text-zinc-400">
            「仮想通貨で支払う」ボタンのリンク先をこの形式にするだけです。<br />
            <span className="text-amber-400 font-semibold">{"{金額}"}</span> の部分を商品の価格（円）に変えてください。
          </p>

          {/* URL の構造説明 */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">URL の構造</p>
            <div className="font-mono text-xs leading-relaxed break-all">
              <span className="text-zinc-400">{origin}/pay/new?amount=</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">10000</span>
              <span className="text-zinc-400">&merchant=</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">{merchantId.slice(0, 8)}...</span>
            </div>
            <div className="flex gap-4 mt-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-500/50" />
                <span className="text-zinc-500">金額（円）= 自分で変える</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" />
                <span className="text-zinc-500">Merchant ID = 固定（変えない）</span>
              </div>
            </div>
          </div>

          <CopyBox label="テンプレートURL（{金額}を書き換えて使う）" value={payUrlTemplate} id="tmpl" copied={copied} onCopy={copy} />

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">具体例</p>
            {[
              ["¥3,000 の商品", `${origin}/pay/new?amount=3000&merchant=${merchantId}`],
              ["¥10,000 の商品", `${origin}/pay/new?amount=10000&merchant=${merchantId}`],
              ["¥50,000 の商品", `${origin}/pay/new?amount=50000&merchant=${merchantId}`],
            ].map(([label, url]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500 shrink-0">{label}</span>
                <button
                  onClick={() => copy(url, url)}
                  className={`text-[11px] font-mono truncate max-w-[220px] text-left transition-colors ${
                    copied === url ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {copied === url ? "✓ コピーしました" : url.replace(origin, "")}
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">動作確認（¥10,000 のテスト）</p>
            <a
              href={payUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-all"
            >
              <QrCode className="h-4 w-4" />
              決済ページを確認する（¥10,000）
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </Step>

        {/* Step 3: API（上級） */}
        <Step n={3} title="API で自動連携する（上級・任意）">
          <p className="text-sm text-zinc-400">
            EC サイトのサーバーから直接決済を作成・完了確認ができます。
          </p>

          <div className="space-y-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">① 決済を作成する</span>
              </div>
              <pre className="px-4 py-3 text-[12px] text-zinc-400 overflow-x-auto leading-relaxed">{`POST ${origin}/api/payments/create

{
  "merchantId": "${merchantId}",
  "amountFiat": 10000,       // 商品代金（円）
  "payCurrency": "btc",      // 支払通貨
  "orderId": "ORDER-001"     // 注文番号
}`}</pre>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">② 決済完了を確認する（5秒ごとにポーリング）</span>
              </div>
              <pre className="px-4 py-3 text-[12px] text-zinc-400 overflow-x-auto leading-relaxed">{`GET ${origin}/api/payments/{transactionId}

// "status": "FINISHED" になったら注文確定`}</pre>
            </div>
          </div>
        </Step>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-center pt-4"
        >
          <a
            href={dashboardUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 transition-all hover:-translate-y-0.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            ダッシュボードで売上を確認する
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-zinc-600 mt-4">
            このページは何度でも開けます。ブックマーク推奨
          </p>
        </motion.div>
      </div>
    </div>
  );
}
