// ============================================================================
// POST /api/merchants — 加盟店登録
//
// EC事業者がデプロイ後に一度だけ呼び出して、自分の merchantId を取得する。
// ヘッダー `x-admin-key: {ADMIN_API_KEY}` による認証が必須。
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const createMerchantSchema = z.object({
  name: z.string().min(1, "店舗名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  fiatCurrency: z.string().length(3).default("JPY"),
});

export async function POST(request: NextRequest) {
  // 管理者認証
  const adminKey = request.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: "認証に失敗しました", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const validated = createMerchantSchema.parse(body);
    const db = getDb();

    // メール重複チェック
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

    // 加盟店を作成
    const { data: merchant, error } = await db
      .from("merchants")
      .insert({
        supabase_user_id: `merchant-${Date.now()}`,
        name: validated.name,
        email: validated.email,
        fiat_currency: validated.fiatCurrency,
        deposit_balance: 0,
        sales_balance: 0,
      })
      .select("id, name, email, fiat_currency, deposit_balance, sales_balance, created_at")
      .single();

    if (error || !merchant) {
      return NextResponse.json(
        { error: `加盟店の作成に失敗しました: ${error?.message}`, code: "DB_ERROR" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "加盟店を登録しました",
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        fiatCurrency: merchant.fiat_currency,
        depositBalance: Number(merchant.deposit_balance),
        salesBalance: Number(merchant.sales_balance),
        createdAt: merchant.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    console.error("[merchants/create] Error:", error);
    return NextResponse.json(
      { error: "内部エラー", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
