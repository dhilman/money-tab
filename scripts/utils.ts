export async function inputConfirm(message: string): Promise<void> {
  process.stdout.write(`${message} (y/n): `);
  for await (const line of console) {
    if (line === "y") return;
    if (line === "n") process.exit(0);
    process.stdout.write("Please enter y or n: ");
  }
}
