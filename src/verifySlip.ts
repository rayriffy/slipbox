import { ofetch } from "ofetch";

export async function verifySlip(payload: string) {
  const url = Bun.env["SLIP_VERIFY_API_URL"]!;
  const auth = Bun.env["SLIP_VERIFY_AUTHORIZATION"]!;
  const result = await ofetch(`${url}/verify/${payload}`, {
    headers: {
      authorization: auth,
    },
  });
  return result;
}

export async function isWalletMatching(value: string) {
  const ppid = Bun.env["PROMPTPAY_ID"]!;
  const digits = value.replace(/\W/g, "");
  if (ppid.length !== digits.length) return false;

  // Some digits are replaced with x or X.
  for (let i = 0; i < ppid.length; i++) {
    if (digits[i] !== "x" && digits[i] !== "X" && ppid[i] !== digits[i]) {
      return false;
    }
  }

  return true;
}

export function validateVerifiedSlip(options: {
  verificationResult: {
    discriminator: string;
    valid: boolean;
    data: {
      receiver: {
        name: string;
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
  if (
    !(
      data.receiver.name.toUpperCase() === Bun.env["OWNER_ACCOUNT_NAME"]! &&
      ((data.receiver.account?.type === "BANKAC" &&
        data.receiver.account.value === Bun.env["OWNER_ACCOUNT_NO"]!) ||
        (data.receiver.proxy?.type === "EWALLETID" &&
          isWalletMatching(data.receiver.proxy.value)))
    )
  ) {
    return { ok: false, message: "Receiver mismatch" };
  }
  return { ok: true };
}
