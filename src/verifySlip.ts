import { ofetch } from "ofetch";

export async function verifySlip(payload: string) {
  const url = Bun.env["SLIP_VERIFY_API_URL"]!;
  const auth = Bun.env["SLIP_VERIFY_AUTHORIZATION"]!;

  const result = await ofetch(`${url}`, {
    headers: { 'x-authorization': auth },
    method: "POST",
    body: { data: payload },
  });
  return result;
}

export function matchWithMask(a: string, b: string) {
  a = a.replace(/\W/g, "").toUpperCase();
  b = b.replace(/\W/g, "").toUpperCase();
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] === "X" || b[i] === "X") continue;
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function validateVerifiedSlip(options: {
  verificationResult: {
    discriminator: string;
    valid: boolean;
    data: {
      receiver: {
        name: string | null;
        displayName: string | null;
        proxy?: { type: string; value: string };
        account?: { type: string; value: string };
        value: string;
      };
      amount: number;
    };
  };
  expectedAmount: number;
}): { ok: true } | { ok: false; message: string } {
  if (!options.verificationResult.valid) {
    return { ok: false, message: "Invalid slip" };
  }
  const data = options.verificationResult.data;
  if (Math.abs(data.amount - options.expectedAmount) >= 0.005) {
    return { ok: false, message: "Amount mismatch" };
  }

  const receiverNames = [data.receiver.name, data.receiver.displayName]
    .filter((x) => x)
    .map((x) => x!.toUpperCase());
  const acceptedNames = new Set(
    Bun.env["OWNER_ACCOUNT_NAME"]!.split("|").map((x) => x.toUpperCase())
  );
  if (!receiverNames.some((x) => acceptedNames.has(x))) {
    return { ok: false, message: "Receiver name mismatch" };
  }

  const receiverIds = [
    data.receiver.account?.value,
    data.receiver.proxy?.value,
  ].filter((x) => x);
  const acceptedIds = [
    Bun.env["OWNER_ACCOUNT_NO"]!,
    Bun.env["PROMPTPAY_ID"]!,
  ].filter((x) => x);
  if (
    !receiverIds.some((x) => acceptedIds.some((y) => matchWithMask(x!, y!)))
  ) {
    return { ok: false, message: "Receiver ID mismatch" };
  }

  return { ok: true };
}
