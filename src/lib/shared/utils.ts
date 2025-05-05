import { Big } from "big.js";
import { Address, Hex, formatUnits, isAddress, isHex, parseUnits } from "viem";
import { z } from "zod";

/* Fixed Point */

const DECIMALS = 18;

function scale(decimals: number) {
  return 10n ** BigInt(decimals);
}

function scaleUp(n: bigint, decimals: number) {
  return n * scale(decimals);
}

function scaleDown(n: bigint, decimals: number, rounding: "up" | "down" = "down") {
  const _n = rounding == "down" ? n : n + scale(decimals);
  return _n / scale(decimals);
}

function mul(a: bigint, b: bigint, decimals = DECIMALS) {
  return scaleDown(a * b, decimals);
}

function div(a: bigint, b: bigint, decimals = 18) {
  return scaleUp(a, decimals) / b;
}

export const FixedPoint = { scaleUp, scaleDown, mul, div, DECIMALS };

/* number utils */

export function fromUnits(u: bigint, decimals = DECIMALS) {
  return new Big(formatUnits(u, decimals));
}

export function toUnits(n: number | string | Big, decimals = DECIMALS) {
  return parseUnits(n.toString(), decimals);
}

export function printNumber(n: Big) {
  return n.toFixed(3);
}

export function getDaysFromSeconds(seconds: number) {
  return Math.floor(seconds / 86400);
}

/* zod */

export const zodAddress = z
  .string()
  .refine(isAddress)
  .transform((s) => s.toLowerCase() as Address);

export const zodHex = z
  .string()
  .refine(isHex)
  .transform((s) => s as Hex);

export const zodStringToBigInt = z.string().transform((s) => BigInt(s));

export const zodStringToNumber = z.string().transform((s) => parseInt(s));
