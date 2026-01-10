export function reduceArr<T, R>(
  arr: T[],
  reducer: (acc: R, val: T) => R,
  initial: R,
  filter?: (val: T) => boolean,
): R {
  return arr.reduce((acc, val) => {
    if (filter && !filter(val)) return acc;
    return reducer(acc, val);
  }, initial);
}

export function arrCombine<T>(
  arrays: T[][],
  key: (item: T) => string,
  combine: (acc: T, item: T) => T,
) {
  return Array.from(
    arrays.reduce((acc, arr) => {
      arr.forEach((item) => {
        const k = key(item);
        const existing = acc.get(k);
        if (existing) {
          acc.set(k, combine(existing, item));
        } else {
          acc.set(k, item);
        }
      });
      return acc;
    }, new Map<string, T>()),
  ).map(([_, item]) => item);
}
