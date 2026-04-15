import { z } from "zod";

export const createPaymentSchema = z.object({
  merchantId: z.string().uuid(),
  amountFiat: z.number().positive("金額は正の数でなければなりません"),
  payCurrency: z.string().min(1).default("btc"),
  orderId: z.string().min(1, "注文IDは必須です"),
  description: z.string().optional(),
});

export const requestPayoutSchema = z.object({
  merchantId: z.string().uuid(),
  amountFiat: z.number().positive("出金額は正の数でなければなりません"),
  destinationAddress: z.string().min(1, "出金先は必須です"),
});

export const addDepositSchema = z.object({
  merchantId: z.string().uuid(),
  amount: z.number().positive("デポジット額は正の数でなければなりません"),
  description: z.string().optional(),
});
