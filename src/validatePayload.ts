import { slipVerify } from "promptparse/validate";

export function validatePayload(payload: string) {
  const data = slipVerify(payload);
  if (!data) return false;
  return !!data.sendingBank && !!data.transRef;
}
