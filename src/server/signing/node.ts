import crypto from "crypto";

// returns a signature of the data
// creates a secret key from the salt and key (follows Telegram's method)
export async function tg_hmac(params: {
  key: string;
  salt: string;
  data: string;
}) {
  const { key, salt, data } = params;

  const secret_key = crypto.createHmac("sha256", salt).update(key).digest();

  // use a promise to make it async
  return new Promise<string>((resolve) => {
    const digest = crypto
      .createHmac("sha256", secret_key)
      .update(data)
      .digest("hex");
    resolve(digest);
  });
}
