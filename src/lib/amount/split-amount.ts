export function splitAmount(amount: number, splits: number): number[] {
  const absAmount = Math.abs(amount);
  const base = Math.floor(Math.abs(absAmount) / splits);
  let remainder = absAmount % splits;

  const amounts = Array.from({ length: splits }, (_) => {
    let result = base;
    if (remainder > 0) {
      result += 1;
      remainder -= 1;
    }
    return result;
  });

  if (amount < 0) {
    return amounts.map((a) => -a);
  }

  return amounts;
}
