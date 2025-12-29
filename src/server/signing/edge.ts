// returns a signature of the data
// creates a secret key from the salt and key (follows Telegram's method)
export async function tg_hmac(params: {
  key: string;
  salt: string;
  data: string;
}) {
  const enc = new TextEncoder();

  const key = await sign(enc.encode(params.salt), enc.encode(params.key));

  const signature = await sign(key, enc.encode(params.data));
  const hashArray = Array.from(new Uint8Array(signature));
  const digest = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return digest;
}

async function sign(secret: BufferSource, data: BufferSource) {
  const algo = { name: "HMAC", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("raw", secret, algo, false, [
    "sign",
    "verify",
  ]);
  return await crypto.subtle.sign(algo.name, key, data);
}
