import crypto from "crypto";

export interface LiqPayParams {
  version: number;
  public_key: string;
  action: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  server_url?: string;
  result_url?: string;
  [key: string]: any;
}

export interface LiqPayCallbackData {
  version: number;
  public_key: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  status: string;
  transaction_id: number;
  sender_phone?: string;
  payment_id?: number;
  [key: string]: any;
}

/**
 * Generates a LiqPay checkout URL.
 */
export function generatePaymentUrl(params: LiqPayParams, privateKey: string): string {
  const jsonString = JSON.stringify(params);
  const data = Buffer.from(jsonString).toString("base64");
  
  const signString = privateKey + data + privateKey;
  const signature = crypto.createHash("sha1").update(signString).digest("base64");
  
  const query = new URLSearchParams({
    data,
    signature,
  });
  
  return `https://www.liqpay.ua/api/3/checkout?${query.toString()}`;
}

/**
 * Verifies LiqPay webhook signature.
 */
export function verifySignature(data: string, signature: string, privateKey: string): boolean {
  const signString = privateKey + data + privateKey;
  const expectedSignature = crypto.createHash("sha1").update(signString).digest("base64");
  return signature === expectedSignature;
}

/**
 * Parses LiqPay callback data.
 */
export function parseCallbackData(data: string): LiqPayCallbackData {
  const jsonString = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(jsonString) as LiqPayCallbackData;
}
