import { redirect } from "next/navigation";

const DEMO_MERCHANT_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_AMOUNT = 5000;

export default function DemoPage() {
  redirect(`/pay/new?amount=${DEMO_AMOUNT}&merchant=${DEMO_MERCHANT_ID}`);
}
