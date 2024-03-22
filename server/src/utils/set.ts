// NOTE: The following Set utils have been added here, to easily determine where they are used.
//       They should be replaced with native Set operations, when they are added to the language.
//       Proposal reference: https://github.com/tc39/proposal-set-methods

export const setUnion = <T>(...sets: Set<T>[]): Set<T> => {
  const union = new Set(sets[0]);
  for (const set of sets.slice(1)) {
    for (const element of set) {
      union.add(element);
    }
  }
  return union;
};

export const setDifference = <T>(setA: Set<T>, ...sets: Set<T>[]): Set<T> => {
  const difference = new Set(setA);
  for (const set of sets) {
    for (const element of set) {
      difference.delete(element);
    }
  }
  return difference;
};

export const setIsSuperset = <T>(set: Set<T>, subset: Set<T>): boolean => {
  for (const element of subset) {
    if (!set.has(element)) {
      return false;
    }
  }
  return true;
};

export const setIsEqual = <T>(setA: Set<T>, setB: Set<T>): boolean => {
  return setA.size === setB.size && setIsSuperset(setA, setB);
};
