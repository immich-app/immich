export const GHOST_KEY = 'reorder-ghost';

export type ReorderEntry<T> = {
  item: T;
  index: number;
  isGhost: boolean;
  isSource: boolean;
};

export function createListReorder<T>(getItems: () => T[], setItems: (items: T[]) => void) {
  let draggingIndex = $state<number | null>(null);
  let dropIndex = $state<number | null>(null);

  const entries = $derived.by<ReorderEntry<T>[]>(() => {
    const items = getItems();
    const list: ReorderEntry<T>[] = items.map((item, index) => ({
      item,
      index,
      isGhost: false,
      isSource: index === draggingIndex,
    }));

    if (
      draggingIndex !== null &&
      dropIndex !== null &&
      dropIndex !== draggingIndex &&
      dropIndex !== draggingIndex + 1
    ) {
      list.splice(dropIndex, 0, { item: items[draggingIndex], index: draggingIndex, isGhost: true, isSource: false });
    }

    return list;
  });

  return {
    get isDragging() {
      return draggingIndex !== null;
    },
    get entries() {
      return entries;
    },
    start(index: number) {
      draggingIndex = index;
      dropIndex = index;
    },
    over(index: number, after: boolean) {
      if (draggingIndex === null) {
        return;
      }
      dropIndex = Math.max(0, Math.min(index + (after ? 1 : 0), getItems().length));
    },
    toEnd() {
      if (draggingIndex !== null) {
        dropIndex = getItems().length;
      }
    },
    end() {
      draggingIndex = null;
      dropIndex = null;
    },
    drop() {
      if (draggingIndex === null || dropIndex === null) {
        return;
      }

      const target = dropIndex > draggingIndex ? dropIndex - 1 : dropIndex;
      if (target !== draggingIndex) {
        const next = [...getItems()];
        const [moved] = next.splice(draggingIndex, 1);
        next.splice(target, 0, moved);
        setItems(next);
      }

      draggingIndex = null;
      dropIndex = null;
    },
  };
}
