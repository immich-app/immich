import { PriorityQueue } from '$lib/utils/data-structure';
import { throttle } from 'lodash-es';

type Config = IntersectionObserverActionProperties & {
  observer?: IntersectionObserver;
};
type TrackedProperties = {
  root?: Element | Document | null;
  threshold?: number | number[];
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};
type OnIntersectCallback = (entry: IntersectionObserverEntry) => unknown;
type OnSeperateCallback = (element: HTMLElement) => unknown;
type IntersectionObserverActionProperties = {
  key?: string;
  onSeparate?: OnSeperateCallback;
  onIntersect?: OnIntersectCallback;

  root?: Element | Document | null;
  threshold?: number | number[];
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;

  hidden?: boolean;
  priority?: number;
  immediate?: boolean;
};
type TaskKey = HTMLElement | string;
type Task = () => void;

const queue = new PriorityQueue<TaskKey>();
const queueMap = new Map<TaskKey, Task>();

const RESPONSIVENESS_FACTOR = 50;
const THROTTLE_MS = 16;
const THROTTLE = true;

function _drainTasks() {
  let key = queue.shift();
  let count = RESPONSIVENESS_FACTOR;
  while (key) {
    const task = queueMap.get(key);
    if (task) {
      // note - the queue may contain deleted or updated tasks
      // which produce gaps, just ignore these as we loop
      queueMap.delete(key);
      task();
      if (--count < 0) {
        drain();
        break;
      }
    }
    key = queue.shift();
  }
}
const drain = THROTTLE ? throttle(_drainTasks, THROTTLE_MS, { leading: false, trailing: true }) : _drainTasks;

function addTask(key: TaskKey, task: Task, priority: number = 0) {
  queue.push(key, priority);
  queueMap.set(key, task);
  drain();
}

function deleteTask(key: TaskKey) {
  queueMap.delete(key);
  drain();
}

function isEquivalent(a: TrackedProperties, b: TrackedProperties) {
  return (
    a?.bottom === b?.bottom &&
    a?.top === b?.top &&
    a?.left === b?.left &&
    a?.right == b?.right &&
    a?.threshold === b?.threshold &&
    a?.root === b?.root
  );
}

const elementToConfig = new Map<TaskKey, Config>();

const observe = (key: HTMLElement | string, target: HTMLElement, properties: IntersectionObserverActionProperties) => {
  if (!target.isConnected) {
    elementToConfig.get(key)?.observer?.unobserve(target);
    return;
  }
  const {
    root,
    threshold,
    top = '0px',
    right = '0px',
    bottom = '0px',
    left = '0px',
    onSeparate,
    onIntersect,
  } = properties;
  const rootMargin = `${top} ${right} ${bottom} ${left}`;
  const observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      // This IntersectionObserver is limited to observing a single element, the one the
      // action is attached to. If there are multiple entries, it means that this
      // observer is being notified of multiple events that have occured quickly together,
      // and the latest element is the one we are interested in.

      entries.sort((a, b) => a.time - b.time);

      const latestEntry = entries.pop();
      if (latestEntry?.isIntersecting) {
        onIntersect?.(latestEntry);
      } else {
        onSeparate?.(target);
      }
    },
    {
      rootMargin,
      threshold,
      root,
    },
  );
  observer.observe(target);
  elementToConfig.set(key, { ...properties, observer });
};

function _intersectionObserver(
  key: HTMLElement | string,
  element: HTMLElement,
  properties: IntersectionObserverActionProperties,
) {
  elementToConfig.set(key, properties);
  if (properties.immediate) {
    observe(key, element, properties);
  } else {
    addTask(key, () => observe(key, element, properties), properties.priority);
  }
  return {
    update(properties: IntersectionObserverActionProperties) {
      const config = elementToConfig.get(key);
      if (!config) {
        return;
      }
      if (isEquivalent(config, properties)) {
        return;
      }
    },
    destroy: () => {
      const config = elementToConfig.get(key);
      const { observer, onSeparate } = config || {};
      observer?.unobserve(element);
      elementToConfig.delete(key);
      deleteTask(key);
      if (onSeparate) {
        onSeparate?.(element);
      }
    },
  };
}

export function intersectionObserver(
  element: HTMLElement,
  properties: IntersectionObserverActionProperties | IntersectionObserverActionProperties[],
) {
  // svelte doesn't allow multiple use:action directives of the same kind on the same element,
  // so accept an array when multiple configurations are needed.
  if (Array.isArray(properties)) {
    if (!properties.every((p) => p.key)) {
      throw 'Multiple configurations must specify key';
    }
    const observers = properties.map((p) => _intersectionObserver(p.key as string, element, p));
    return {
      update: (properties: IntersectionObserverActionProperties[]) => {
        for (const [i, props] of properties.entries()) {
          observers[i].update(props);
        }
      },
      destroy: () => {
        for (const observer of observers) {
          observer.destroy();
        }
      },
    };
  }
  return _intersectionObserver(element, element, properties);
}
