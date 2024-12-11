import { grist } from "./grist";

export interface Bill {
  id: number;
  payer: string;
  description: string;
  amount: number;
  status: "unpaid" | "verificationPending" | "verificationFailed" | "paid";
  verificationPayload: string | null;
  /** Seconds since epoch */
  submittedAt: number | null;
  /** Seconds since epoch */
  paidAt: number | null;

  errorMessage: string | null;
  verificationResult: string | null;
  paymentDiscriminator: string | null;
}

export async function loadBill(billId: string): Promise<Bill | undefined> {
  const found = await grist.fetchTable("Bills", { billId: [billId] });
  if (found.length !== 1) return undefined;
  return found[0] as unknown as Bill;
}

export async function updateBill(bill: Bill, updates: Partial<Bill>) {
  await grist.updateRecords("Bills", [{ id: bill.id, ...updates }]);
  return { ...bill, ...updates };
}

export async function isAlreadyPaid(discriminator: string) {
  const found = await grist.fetchTable("Bills", {
    paymentDiscriminator: [discriminator],
    status: ["paid"],
  });
  return found.length > 0;
}
