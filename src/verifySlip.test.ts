import { expect, test } from "bun:test";
import { matchWithMask } from "./verifySlip";

test("matchWithMask", () => {
  expect(matchWithMask("1234567890", "1234567890")).toBe(true);
  expect(matchWithMask("1234567891", "1234567890")).toBe(false);
  expect(matchWithMask("123456789x", "1234567890")).toBe(true);
  expect(matchWithMask("1234567893", "123456789x")).toBe(true);
  expect(matchWithMask("1234567893", "12345678xx")).toBe(true);
  expect(matchWithMask("1234567893", "12345678x")).toBe(false);
  expect(matchWithMask("12-3456-78-93", "12345678x")).toBe(false);
});
