import { isAlreadyPaid, updateBill, type Bill } from "./Bill";
import { validateVerifiedSlip, verifySlip } from "./verifySlip";

export async function verifyBill(bill: Bill) {
  const payload = bill.verificationPayload;
  if (!payload) {
    throw new Error("No verification payload");
  }
  let result: { ok: true } | { ok: false; message: string };
  try {
    const { data: verificationResult } = await verifySlip(payload);
    bill = await updateBill(bill, {
      verificationResult: JSON.stringify(verificationResult, null, 2),
      paymentDiscriminator: verificationResult.transRef,
    });
    const alreadyPaid = await isAlreadyPaid(verificationResult.transRef);
    if (alreadyPaid) {
      result = { ok: false, message: "This slip has already been used" };
    } else {
      result = validateVerifiedSlip({
        verificationResult,
        expectedAmount: bill.amount,
      });
    }
  } catch (error) {
    result = { ok: false, message: `Failed to verify: ${error}` };
  }
  if (result.ok) {
    bill = await updateBill(bill, {
      status: "paid",
      paidAt: Math.floor(Date.now() / 1000),
    });
  } else {
    bill = await updateBill(bill, {
      status: "verificationFailed",
      errorMessage: result.message,
    });
  }
  return bill;
}
