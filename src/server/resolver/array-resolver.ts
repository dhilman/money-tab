import { toMap } from "~/utils/map";

type WithId<T> = T & { id: string };

export interface Changeset<T> {
  creates: T[];
  deletes: string[];
}

class ArrayResolver<T> {
  changeset: Changeset<T> = { creates: [], deletes: [] };
  oldMap: Map<string, T>;
  newMap: Map<string, T>;

  constructor(params: { old: WithId<T>[]; new: WithId<T>[] }) {
    this.oldMap = toMap(params.old, "id");
    this.newMap = toMap(params.new, "id");
  }

  resolve(): Changeset<T> {
    this.handleDeletions();
    this.handleAdditions();
    return this.changeset;
  }

  private handleDeletions() {
    this.oldMap.forEach((c, id) => {
      if (this.newMap.has(id)) return;

      this.changeset.deletes.push(id);
    });
  }

  private handleAdditions() {
    this.newMap.forEach((c, id) => {
      if (this.oldMap.has(id)) return;

      this.changeset.creates.push(c);
    });
  }
}

export function resolveArrayChanges<T>(params: {
  old: WithId<T>[];
  new: WithId<T>[];
}): Changeset<T> {
  return new ArrayResolver(params).resolve();
}
