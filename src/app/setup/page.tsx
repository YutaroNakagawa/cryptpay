"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Store, Mail, Globe, Zap, Shield, QrCode } from "lucide-react";

const CURRENCIES = [
  { code: "JPY", label: "日本円 (JPY)" },
  { code: "USD", label: "米ドル (USD)" },
  { code: "EUR", label: "ユーロ (EUR)" },
];

export default function SetupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/merchants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, fiatCurrency: currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }
      // 登録完了 → 専用ガイドページへリダイレクト
      window.location.href = `/guide/${data.merchantId}`;
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] bg-grid flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            filter: "blur(80px)",
            top: "-100px",
            left: "-100px",
          }}
        />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/[0.06] px-6 py-4 flex items-center gap-3 relative z-10">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/30">
          CP
        </div>
        <span className="text-sm font-semibold text-white">クリプトペイ — 加盟店登録</span>
      </header>

      <div className="flex flex-1 items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-center mb-10">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Store className="h-7 w-7 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                加盟店登録
              </h1>
              <p className="text-sm text-zinc-500">
                店舗情報を入力すると、すぐに暗号資産決済を受け付けられます。
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 店舗名 */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                    店舗名 / サービス名
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="山田商店"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/40 focus:bg-white/[0.06] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* メール */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/40 focus:bg-white/[0.06] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 受取通貨 */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                    受取通貨
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 py-3.5 text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.06] focus:outline-none transition-all appearance-none"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-zinc-900">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-500 py-4 text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>登録して始める <ArrowRight className="h-4 w-4" /></>
                  )}
                </motion.button>
              </form>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-3">
                {[
                  { icon: Zap, text: "即時セットアップ" },
                  { icon: Shield, text: "法令完全遵守" },
                  { icon: QrCode, text: "QR決済対応" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                    <Icon className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] text-zinc-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
