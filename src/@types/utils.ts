export type AwaitedReturnType<
  T extends (...args: unknown[]) => Promise<unknown>
> = Awaited<ReturnType<T>>;
