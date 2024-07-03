type HistoryAction = {
  type: string;
  properties: unknown;
};

export const createHistory = () => {
  let stack: HistoryAction[] = [];
  let currentIndex = -1;

  const canRedo = () => {
    return currentIndex < stack.length - 1;
  };

  const canUndo = () => {
    return currentIndex > 0;
  };

  const currentState = () => {
    let resolvedState = {};

    for (let i = 0; i <= currentIndex; i++) {
      resolvedState = { ...resolvedState, [stack[i].type]: stack[i].properties };
    }

    return resolvedState;
  };

  const push = (action: HistoryAction) => {
    if (canRedo()) {
      stack = stack.slice(0, currentIndex + 1);
    }

    stack.push(action);
    currentIndex = stack.length - 1;
  };

  const undo = () => {
    if (!canUndo()) {
      return currentState();
    }

    currentIndex -= 1;

    return currentState();
  };

  return { canRedo, canUndo, currentState, push, undo };
};
