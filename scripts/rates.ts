import { z } from "zod";
import CURRENCIES from "public/currencies.json";

async function readOldRates() {
  const path = "./public/rates.json";
  const f = Bun.file(path);
  return (await f.json()) as Record<string, number>;
}

async function getRates() {
  const api_key = process.env.CURRENCY_API_KEY as string;
  if (!api_key) {
    throw new Error("No API key found");
  }
  const endpoint = "https://api.currencyapi.com/v3/latest";

  const Response = z.object({
    data: z.record(z.object({ value: z.number() })),
  });

  const res = await fetch(`${endpoint}?apikey=${api_key}`);
  const body = (await res.json()) as unknown;
  const data = Response.parse(body);

  return Object.fromEntries(
    Object.entries(data.data).map(([key, { value }]) => [key, value]),
  );
}

const rates = await getRates();
const oldRates = await readOldRates();
const myCodes = new Set(Object.keys(CURRENCIES));

for (const code of Object.keys(rates)) {
  if (!myCodes.has(code)) {
    delete rates[code];
  }
}

for (const currency of myCodes) {
  if (rates[currency]) continue;

  const oldRate = oldRates[currency];
  if (oldRate === undefined) throw new Error(`No rate found for ${currency}`);
  console.warn(`No rate found for ${currency}, using old rate ${oldRate}`);

  rates[currency] = oldRate;
}

await Bun.write("./public/rates.tmp.json", JSON.stringify(oldRates, null, 2));
await Bun.write("./public/rates.json", JSON.stringify(rates, null, 2));
