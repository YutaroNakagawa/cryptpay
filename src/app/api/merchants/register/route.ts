// ============================================================================
// POST /api/merchants/register — 加盟店セルフ登録（管理者キー不要）
//
// ECサイト運営者がワンタイムのセットアップとして呼び出す公開エンドポイント。
// レート制限はミドルウェアやデプロイ先の設定で行うこと。
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "店舗名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  fiatCurrency: z.string().length(3).default("JPY"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    const db = getDb();

    const { data: existing } = await db
      .from("merchants")
      .select("id")
      .eq("email", validated.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています", code: "EMAIL_ALREADY_EXISTS" },
        { status: 409 },
      );
    }

    const { data: merchant, error } = await db
      .from("merchants")
      .insert({
        supabase_user_id: `self-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: validated.name,
        email: validated.email,
        fiat_currency: validated.fiatCurrency,
        deposit_balance: 0,
        sales_balance: 0,
      })
      .select("id, name, email, fiat_currency, deposit_balance, created_at")
      .single();

    if (error || !merchant) {
      return NextResponse.json(
        { error: `登録に失敗しました: ${error?.message}`, code: "DB_ERROR" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      merchantId: merchant.id,
      name: merchant.name,
      email: merchant.email,
      fiatCurrency: merchant.fiat_currency,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    console.error("[merchants/register] Error:", error);
    return NextResponse.json(
      { error: "内部エラー", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
