type KeyOrFunc<T> = keyof T | ((item: T) => string);

export function toMap<T>(arr: T[], key: KeyOrFunc<T>): Map<string, T> {
  return arr.reduce(
    (acc, item) => {
      const k = typeof key === "function" ? key(item) : item[key];
      acc.set(k as string, item);
      return acc;
    },
    new Map() as Map<string, T>,
  );
}

export function toMapGrouped<T>(arr: T[], key: KeyOrFunc<T>): Map<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = typeof key === "function" ? key(item) : item[key];
      const group = acc.get(k as string) || [];
      group.push(item);
      acc.set(k as string, group);
      return acc;
    },
    new Map() as Map<string, T[]>,
  );
}

type ValueGetter<T, K> = (item: T) => K | undefined | null;

export function toMapWithValue<T, K>(
  arr: T[],
  key: KeyOrFunc<T>,
  valueGetter: ValueGetter<T, K>,
): Map<string, K> {
  return arr.reduce(
    (acc, item) => {
      const k = typeof key === "function" ? key(item) : item[key];
      const v = valueGetter(item);
      if (v !== undefined && v !== null) {
        acc.set(k as string, v);
      }
      return acc;
    },
    new Map() as Map<string, K>,
  );
}
