import type { AssetBucket, AssetStore } from '$lib/stores/assets.store';
import { generateId } from '$lib/utils/generate-id';
import { cancelIdleCB, idleCB } from '$lib/utils/idle-callback-support';
import { KeyedPriorityQueue } from '$lib/utils/keyed-priority-queue';
import { type DateGroup } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import { type AssetResponseDto } from '@immich/sdk';
import { clamp } from 'lodash-es';

type Task = () => void;

class InternalTaskManager {
  assetStore: AssetStore;
  componentTasks = new Map<string, Set<string>>();
  priorityQueue = new KeyedPriorityQueue<string, Task>();
  idleQueue = new Map<string, Task>();
  taskCleaners = new Map<string, Task>();

  queueTimer: ReturnType<typeof setTimeout> | undefined;
  lastIdle: number | undefined;

  constructor(assetStore: AssetStore) {
    this.assetStore = assetStore;
  }
  destroy() {
    this.componentTasks.clear();
    this.priorityQueue.clear();
    this.idleQueue.clear();
    this.taskCleaners.clear();
    clearTimeout(this.queueTimer);
    if (this.lastIdle) {
      cancelIdleCB(this.lastIdle);
    }
  }
  getOrCreateComponentTasks(componentId: string) {
    let componentTaskSet = this.componentTasks.get(componentId);
    if (!componentTaskSet) {
      componentTaskSet = new Set<string>();
      this.componentTasks.set(componentId, componentTaskSet);
    }

    return componentTaskSet;
  }
  deleteFromComponentTasks(componentId: string, taskId: string) {
    if (this.componentTasks.has(componentId)) {
      const componentTaskSet = this.componentTasks.get(componentId);
      componentTaskSet?.delete(taskId);
      if (componentTaskSet?.size === 0) {
        this.componentTasks.delete(componentId);
      }
    }
  }

  drainIntersectedQueue() {
    let count = 0;
    for (let t = this.priorityQueue.shift(); t; t = this.priorityQueue.shift()) {
      t.value();
      if (this.taskCleaners.has(t.key)) {
        this.taskCleaners.get(t.key)!();
        this.taskCleaners.delete(t.key);
      }
      if (count++ >= TUNABLES.SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS) {
        this.scheduleDrainIntersectedQueue(TUNABLES.SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS_DELAY_MS);
        break;
      }
    }
  }

  scheduleDrainIntersectedQueue(delay: number = TUNABLES.SCROLL_TASK_QUEUE.CHECK_INTERVAL_MS) {
    clearTimeout(this.queueTimer);
    this.queueTimer = setTimeout(() => {
      const delta = Date.now() - this.assetStore.lastScrollTime;
      if (delta < TUNABLES.SCROLL_TASK_QUEUE.MIN_DELAY_MS) {
        let amount = clamp(
          1 + Math.round(this.priorityQueue.length / TUNABLES.SCROLL_TASK_QUEUE.TRICKLE_BONUS_FACTOR),
          1,
          TUNABLES.SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS * 2,
        );

        const nextDelay = clamp(
          amount > 1
            ? Math.round(delay / TUNABLES.SCROLL_TASK_QUEUE.TRICKLE_ACCELERATION_FACTOR)
            : TUNABLES.SCROLL_TASK_QUEUE.CHECK_INTERVAL_MS,
          TUNABLES.SCROLL_TASK_QUEUE.TRICKLE_ACCELERATED_MIN_DELAY,
          TUNABLES.SCROLL_TASK_QUEUE.TRICKLE_ACCELERATED_MAX_DELAY,
        );

        while (amount > 0) {
          this.priorityQueue.shift()?.value();
          amount--;
        }
        if (this.priorityQueue.length > 0) {
          this.scheduleDrainIntersectedQueue(nextDelay);
        }
      } else {
        this.drainIntersectedQueue();
      }
    }, delay);
  }

  removeAllTasksForComponent(componentId: string) {
    if (this.componentTasks.has(componentId)) {
      const tasksIds = this.componentTasks.get(componentId) || [];
      for (const taskId of tasksIds) {
        this.priorityQueue.remove(taskId);
        this.idleQueue.delete(taskId);
        if (this.taskCleaners.has(taskId)) {
          const cleanup = this.taskCleaners.get(taskId);
          this.taskCleaners.delete(taskId);
          cleanup!();
        }
      }
    }
    this.componentTasks.delete(componentId);
  }

  queueScrollSensitiveTask({
    task,
    cleanup,
    componentId,
    priority = 10,
    taskId = generateId(),
  }: {
    task: Task;
    cleanup?: Task;
    componentId: string;
    priority?: number;
    taskId?: string;
  }) {
    this.priorityQueue.push(taskId, task, priority);
    if (cleanup) {
      this.taskCleaners.set(taskId, cleanup);
    }
    this.getOrCreateComponentTasks(componentId).add(taskId);
    const lastTime = this.assetStore.lastScrollTime;
    const delta = Date.now() - lastTime;
    if (lastTime != 0 && delta < TUNABLES.SCROLL_TASK_QUEUE.MIN_DELAY_MS) {
      this.scheduleDrainIntersectedQueue();
    } else {
      // flush the queue early
      clearTimeout(this.queueTimer);
      this.drainIntersectedQueue();
    }
  }

  scheduleDrainSeparatedQueue() {
    if (this.lastIdle) {
      cancelIdleCB(this.lastIdle);
    }
    this.lastIdle = idleCB(
      () => {
        let count = 0;
        let entry = this.idleQueue.entries().next().value;
        while (entry) {
          const [taskId, task] = entry;
          this.idleQueue.delete(taskId);
          task();
          if (count++ >= TUNABLES.SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS) {
            break;
          }
          entry = this.idleQueue.entries().next().value;
        }
        if (this.idleQueue.size > 0) {
          this.scheduleDrainSeparatedQueue();
        }
      },
      { timeout: 1000 },
    );
  }
  queueSeparateTask({
    task,
    cleanup,
    componentId,
    taskId,
  }: {
    task: Task;
    cleanup: Task;
    componentId: string;
    taskId: string;
  }) {
    this.idleQueue.set(taskId, task);
    this.taskCleaners.set(taskId, cleanup);
    this.getOrCreateComponentTasks(componentId).add(taskId);
    this.scheduleDrainSeparatedQueue();
  }

  removeIntersectedTask(taskId: string) {
    const removed = this.priorityQueue.remove(taskId);
    if (this.taskCleaners.has(taskId)) {
      const cleanup = this.taskCleaners.get(taskId);
      this.taskCleaners.delete(taskId);
      cleanup!();
    }
    return removed;
  }

  removeSeparateTask(taskId: string) {
    const removed = this.idleQueue.delete(taskId);
    if (this.taskCleaners.has(taskId)) {
      const cleanup = this.taskCleaners.get(taskId);
      this.taskCleaners.delete(taskId);
      cleanup!();
    }
    return removed;
  }
}

export class AssetGridTaskManager {
  private internalManager: InternalTaskManager;
  constructor(assetStore: AssetStore) {
    this.internalManager = new InternalTaskManager(assetStore);
  }

  tasks: Map<AssetBucket, BucketTask> = new Map();

  queueScrollSensitiveTask({
    task,
    cleanup,
    componentId,
    priority = 10,
    taskId = generateId(),
  }: {
    task: Task;
    cleanup?: Task;
    componentId: string;
    priority?: number;
    taskId?: string;
  }) {
    return this.internalManager.queueScrollSensitiveTask({ task, cleanup, componentId, priority, taskId });
  }

  removeAllTasksForComponent(componentId: string) {
    return this.internalManager.removeAllTasksForComponent(componentId);
  }

  destroy() {
    return this.internalManager.destroy();
  }

  private getOrCreateBucketTask(bucket: AssetBucket) {
    let bucketTask = this.tasks.get(bucket);
    if (!bucketTask) {
      bucketTask = this.createBucketTask(bucket);
    }
    return bucketTask;
  }

  private createBucketTask(bucket: AssetBucket) {
    const bucketTask = new BucketTask(this.internalManager, this, bucket);
    this.tasks.set(bucket, bucketTask);
    return bucketTask;
  }

  intersectedBucket(componentId: string, bucket: AssetBucket, task: Task) {
    const bucketTask = this.getOrCreateBucketTask(bucket);
    bucketTask.scheduleIntersected(componentId, task);
  }

  separatedBucket(componentId: string, bucket: AssetBucket, separated: Task) {
    const bucketTask = this.getOrCreateBucketTask(bucket);
    bucketTask.scheduleSeparated(componentId, separated);
  }

  intersectedDateGroup(componentId: string, dateGroup: DateGroup, intersected: Task) {
    const bucketTask = this.getOrCreateBucketTask(dateGroup.bucket);
    bucketTask.intersectedDateGroup(componentId, dateGroup, intersected);
  }

  separatedDateGroup(componentId: string, dateGroup: DateGroup, separated: Task) {
    const bucketTask = this.getOrCreateBucketTask(dateGroup.bucket);
    bucketTask.separatedDateGroup(componentId, dateGroup, separated);
  }

  intersectedThumbnail(componentId: string, dateGroup: DateGroup, asset: AssetResponseDto, intersected: Task) {
    const bucketTask = this.getOrCreateBucketTask(dateGroup.bucket);
    const dateGroupTask = bucketTask.getOrCreateDateGroupTask(dateGroup);
    dateGroupTask.intersectedThumbnail(componentId, asset, intersected);
  }

  separatedThumbnail(componentId: string, dateGroup: DateGroup, asset: AssetResponseDto, separated: Task) {
    const bucketTask = this.getOrCreateBucketTask(dateGroup.bucket);
    const dateGroupTask = bucketTask.getOrCreateDateGroupTask(dateGroup);
    dateGroupTask.separatedThumbnail(componentId, asset, separated);
  }
}

class IntersectionTask {
  internalTaskManager: InternalTaskManager;
  separatedKey;
  intersectedKey;
  priority;

  intersected: Task | undefined;
  separated: Task | undefined;

  constructor(internalTaskManager: InternalTaskManager, keyPrefix: string, key: string, priority: number) {
    this.internalTaskManager = internalTaskManager;
    this.separatedKey = keyPrefix + ':s:' + key;
    this.intersectedKey = keyPrefix + ':i:' + key;
    this.priority = priority;
  }

  trackIntersectedTask(componentId: string, task: Task) {
    const execTask = () => {
      if (this.separated) {
        return;
      }
      task?.();
    };
    this.intersected = execTask;
    const cleanup = () => {
      this.intersected = undefined;
      this.internalTaskManager.deleteFromComponentTasks(componentId, this.intersectedKey);
    };
    return { task: execTask, cleanup };
  }

  trackSeparatedTask(componentId: string, task: Task) {
    const execTask = () => {
      if (this.intersected) {
        return;
      }
      task?.();
    };
    this.separated = execTask;
    const cleanup = () => {
      this.separated = undefined;
      this.internalTaskManager.deleteFromComponentTasks(componentId, this.separatedKey);
    };
    return { task: execTask, cleanup };
  }

  removePendingSeparated() {
    if (this.separated) {
      this.internalTaskManager.removeSeparateTask(this.separatedKey);
    }
  }
  removePendingIntersected() {
    if (this.intersected) {
      this.internalTaskManager.removeIntersectedTask(this.intersectedKey);
    }
  }

  scheduleIntersected(componentId: string, intersected: Task) {
    this.removePendingSeparated();
    if (this.intersected) {
      return;
    }
    const { task, cleanup } = this.trackIntersectedTask(componentId, intersected);
    this.internalTaskManager.queueScrollSensitiveTask({
      task,
      cleanup,
      componentId,
      priority: this.priority,
      taskId: this.intersectedKey,
    });
  }

  scheduleSeparated(componentId: string, separated: Task) {
    this.removePendingIntersected();

    if (this.separated) {
      return;
    }

    const { task, cleanup } = this.trackSeparatedTask(componentId, separated);
    this.internalTaskManager.queueSeparateTask({
      task,
      cleanup,
      componentId,
      taskId: this.separatedKey,
    });
  }
}
class BucketTask extends IntersectionTask {
  assetBucket: AssetBucket;
  assetGridTaskManager: AssetGridTaskManager;
  // indexed by dateGroup's date
  dateTasks: Map<DateGroup, DateGroupTask> = new Map();

  constructor(internalTaskManager: InternalTaskManager, parent: AssetGridTaskManager, assetBucket: AssetBucket) {
    super(internalTaskManager, 'b', assetBucket.bucketDate, TUNABLES.BUCKET.PRIORITY);
    this.assetBucket = assetBucket;
    this.assetGridTaskManager = parent;
  }

  getOrCreateDateGroupTask(dateGroup: DateGroup) {
    let dateGroupTask = this.dateTasks.get(dateGroup);
    if (!dateGroupTask) {
      dateGroupTask = this.createDateGroupTask(dateGroup);
    }
    return dateGroupTask;
  }

  createDateGroupTask(dateGroup: DateGroup) {
    const dateGroupTask = new DateGroupTask(this.internalTaskManager, this, dateGroup);
    this.dateTasks.set(dateGroup, dateGroupTask);
    return dateGroupTask;
  }

  removePendingSeparated() {
    super.removePendingSeparated();
    for (const dateGroupTask of this.dateTasks.values()) {
      dateGroupTask.removePendingSeparated();
    }
  }

  intersectedDateGroup(componentId: string, dateGroup: DateGroup, intersected: Task) {
    const dateGroupTask = this.getOrCreateDateGroupTask(dateGroup);
    dateGroupTask.scheduleIntersected(componentId, intersected);
  }

  separatedDateGroup(componentId: string, dateGroup: DateGroup, separated: Task) {
    const dateGroupTask = this.getOrCreateDateGroupTask(dateGroup);
    dateGroupTask.scheduleSeparated(componentId, separated);
  }
}
class DateGroupTask extends IntersectionTask {
  dateGroup: DateGroup;
  bucketTask: BucketTask;
  // indexed by thumbnail's asset
  thumbnailTasks: Map<AssetResponseDto, ThumbnailTask> = new Map();

  constructor(internalTaskManager: InternalTaskManager, parent: BucketTask, dateGroup: DateGroup) {
    super(internalTaskManager, 'dg', dateGroup.date.toString(), TUNABLES.DATEGROUP.PRIORITY);
    this.dateGroup = dateGroup;
    this.bucketTask = parent;
  }

  removePendingSeparated() {
    super.removePendingSeparated();
    for (const thumbnailTask of this.thumbnailTasks.values()) {
      thumbnailTask.removePendingSeparated();
    }
  }

  getOrCreateThumbnailTask(asset: AssetResponseDto) {
    let thumbnailTask = this.thumbnailTasks.get(asset);
    if (!thumbnailTask) {
      thumbnailTask = new ThumbnailTask(this.internalTaskManager, this, asset);
      this.thumbnailTasks.set(asset, thumbnailTask);
    }
    return thumbnailTask;
  }

  intersectedThumbnail(componentId: string, asset: AssetResponseDto, intersected: Task) {
    const thumbnailTask = this.getOrCreateThumbnailTask(asset);
    thumbnailTask.scheduleIntersected(componentId, intersected);
  }

  separatedThumbnail(componentId: string, asset: AssetResponseDto, separated: Task) {
    const thumbnailTask = this.getOrCreateThumbnailTask(asset);
    thumbnailTask.scheduleSeparated(componentId, separated);
  }
}
class ThumbnailTask extends IntersectionTask {
  asset: AssetResponseDto;
  dateGroupTask: DateGroupTask;

  constructor(internalTaskManager: InternalTaskManager, parent: DateGroupTask, asset: AssetResponseDto) {
    super(internalTaskManager, 't', asset.id, TUNABLES.THUMBNAIL.PRIORITY);
    this.asset = asset;
    this.dateGroupTask = parent;
  }
}
