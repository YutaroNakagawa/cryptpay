// ============================================================================
// デポジットサービス — 手数料デポジットの管理
//
// 法的位置づけ:
//   加盟店は「システム利用料」の前払いとしてデポジット（預り金）を差し入れる。
//   出金時にデポジットから手数料を差し引く。
//   これは暗号資産の売買ではなく、SaaS 利用料の預り・充当スキームである。
// ============================================================================

import { getDb } from "./db";
import { DepositInsufficientError, MerchantNotFoundError } from "./errors";

export async function addDeposit(
  merchantId: string,
  amount: number,
  description?: string,
) {
  if (amount <= 0) throw new Error("デポジット額は正の数でなければなりません");
  const db = getDb();

  const { data: merchant, error: fetchErr } = await db
    .from("merchants")
    .select("deposit_balance")
    .eq("id", merchantId)
    .single();
  if (fetchErr || !merchant) throw new MerchantNotFoundError();

  const newBalance = Number(merchant.deposit_balance) + amount;

  const { error: ledgerErr } = await db.from("deposit_ledger").insert({
    merchant_id: merchantId,
    amount,
    type: "TOPUP",
    description: description ?? "システム利用料デポジット入金",
  });
  if (ledgerErr) throw new Error(`台帳記録失敗: ${ledgerErr.message}`);

  const { data: updated, error: updateErr } = await db
    .from("merchants")
    .update({ deposit_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", merchantId)
    .select()
    .single();
  if (updateErr) throw new Error(`残高更新失敗: ${updateErr.message}`);

  return updated;
}

export async function deductFeeFromDeposit(
  merchantId: string,
  fee: number,
  referenceId: string,
  referenceType: string = "payout_request",
) {
  if (fee <= 0) throw new Error("手数料は正の数でなければなりません");
  const db = getDb();

  const { data: merchant, error: fetchErr } = await db
    .from("merchants")
    .select("deposit_balance")
    .eq("id", merchantId)
    .single();
  if (fetchErr || !merchant) throw new MerchantNotFoundError();

  const currentBalance = Number(merchant.deposit_balance);
  if (currentBalance < fee) {
    throw new DepositInsufficientError(fee, currentBalance);
  }

  const { error: ledgerErr } = await db.from("deposit_ledger").insert({
    merchant_id: merchantId,
    amount: -fee,
    type: "FEE_DEDUCT",
    description: `出金手数料充当 (ref: ${referenceType}/${referenceId})`,
    reference_id: referenceId,
    reference_type: referenceType,
  });
  if (ledgerErr) throw new Error(`台帳記録失敗: ${ledgerErr.message}`);

  const { data: updated, error: updateErr } = await db
    .from("merchants")
    .update({
      deposit_balance: currentBalance - fee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", merchantId)
    .select()
    .single();
  if (updateErr) throw new Error(`残高更新失敗: ${updateErr.message}`);

  return updated;
}

export async function getDepositBalance(merchantId: string): Promise<number> {
  const db = getDb();
  const { data, error } = await db
    .from("merchants")
    .select("deposit_balance")
    .eq("id", merchantId)
    .single();
  if (error || !data) throw new MerchantNotFoundError();
  return Number(data.deposit_balance);
}

export async function getDepositHistory(merchantId: string, limit = 50) {
  const db = getDb();
  const { data, error } = await db
    .from("deposit_ledger")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`履歴取得失敗: ${error.message}`);
  return data;
}
