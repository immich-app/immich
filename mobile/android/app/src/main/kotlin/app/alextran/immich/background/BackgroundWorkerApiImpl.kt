package app.alextran.immich.background

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.Operation
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

private const val TAG = "BackgroundWorkerApiImpl"

internal enum class BackgroundRetryTarget(val networkType: NetworkType, val tag: String) {
  CONNECTED(NetworkType.CONNECTED, "immich/BackgroundRetryWorkerV1/connected"),
  UNMETERED(NetworkType.UNMETERED, "immich/BackgroundRetryWorkerV1/unmetered"),
}

class BackgroundWorkerApiImpl(context: Context) : BackgroundWorkerFgHostApi {
  private val ctx: Context = context.applicationContext

  override fun enable() {
    enqueueMediaObserver(ctx)
    enqueuePeriodicWorker(ctx)
  }

  override fun saveNotificationMessage(title: String, body: String) {
    BackgroundWorkerPreferences(ctx).updateNotificationConfig(title, body)
  }

  override fun configure(settings: BackgroundWorkerSettings) {
    BackgroundWorkerPreferences(ctx).updateSettings(settings)
    enqueueMediaObserver(ctx)
    enqueuePeriodicWorker(ctx)
  }

  override fun disable() {
    WorkManager.getInstance(ctx).apply {
      cancelUniqueWork(OBSERVER_WORKER_NAME)
      cancelUniqueWork(BACKGROUND_WORKER_NAME)
      cancelUniqueWork(PERIODIC_WORKER_NAME)
    }
    retryExecutor.execute {
      retryEpoch.incrementAndGet()
      try {
        val manager = WorkManager.getInstance(ctx)
        manager.cancelUniqueWork(RETRY_WORKER_NAME).result.get()
        manager.cancelUniqueWork(BACKGROUND_WORKER_NAME).result.get()
      } catch (error: Exception) {
        Log.w(TAG, "Failed to cancel background workers", error)
      }
    }
    Log.i(TAG, "Cancelled background upload tasks")
  }

  companion object {
    private const val BACKGROUND_WORKER_NAME = "immich/BackgroundWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"
    private const val RETRY_WORKER_NAME = "immich/BackgroundRetryWorkerV1"
    private const val PERIODIC_WORKER_NAME = "immich/PeriodicBackgroundWorkerV1"
    const val WIDEN_RETRY_TARGET_KEY = "immich::background_worker::widen_retry_target"
    const val ENGINE_CACHE_KEY = "immich::background_worker::engine"
    private val retryExecutor = Executors.newSingleThreadExecutor()
    private val retryEpoch = AtomicLong()

    fun enqueueMediaObserver(ctx: Context) {
      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder().apply {
        addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
        setTriggerContentUpdateDelay(settings.minimumDelaySeconds, TimeUnit.SECONDS)
        setTriggerContentMaxDelay(settings.minimumDelaySeconds * 10, TimeUnit.SECONDS)
        setRequiresCharging(settings.requiresCharging)
      }.build()

      val work = OneTimeWorkRequestBuilder<MediaObserver>()
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(OBSERVER_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(
        TAG,
        "Enqueued media observer worker with name: $OBSERVER_WORKER_NAME and settings: $settings"
      )
    }

    fun enqueuePeriodicWorker(ctx: Context) {
      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder().apply {
        setRequiresCharging(settings.requiresCharging)
      }.build()

      val work =
        PeriodicWorkRequestBuilder<PeriodicWorker>(
          1,
          TimeUnit.HOURS,
          15,
          TimeUnit.MINUTES
        ).setConstraints(constraints)
          .build()

      WorkManager.getInstance(ctx)
        .enqueueUniquePeriodicWork(PERIODIC_WORKER_NAME, ExistingPeriodicWorkPolicy.UPDATE, work)

      Log.i(TAG, "Enqueued periodic background worker with name: $PERIODIC_WORKER_NAME")
    }

    fun enqueueBackgroundWorker(ctx: Context, widenRetryTarget: Boolean = true): Operation {
      if (widenRetryTarget) {
        try {
          retryExecutor.submit {
            retryEpoch.incrementAndGet()
            val backgroundEngines = if (BackgroundWorker.hasEngine()) 1 else 0
            val isForeground =
              BackgroundWorkerPreferences(ctx).isLocked() &&
                BackgroundEngineLock.connectEngines > backgroundEngines
            if (!isForeground) {
              val current = queryRetryTarget(ctx)
              if (current == BackgroundRetryTarget.UNMETERED ||
                current == null && isBackgroundWorkRunning(ctx)
              ) {
                enqueueRetryWorker(ctx, BackgroundRetryTarget.CONNECTED).result.get()
              }
            }
          }.get()
        } catch (error: Exception) {
          Log.w(TAG, "Failed to prepare background retry worker", error)
        }
      }

      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder()
        .setRequiresBatteryNotLow(true)
        .setRequiresCharging(settings.requiresCharging)
        .build()
      val input = Data.Builder()
        .putBoolean(WIDEN_RETRY_TARGET_KEY, widenRetryTarget)
        .build()
      val work = OneTimeWorkRequestBuilder<BackgroundWorker>()
        .setConstraints(constraints)
        .setInputData(input)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .build()
      val operation = WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKGROUND_WORKER_NAME, ExistingWorkPolicy.KEEP, work)

      Log.i(TAG, "Enqueued background worker with name: $BACKGROUND_WORKER_NAME")
      return operation
    }

    internal fun prepareRetryWorker(
      ctx: Context,
      widenRetryTarget: Boolean,
      callback: (kotlin.Result<Long>) -> Unit,
    ) {
      retryExecutor.execute {
        val result = try {
          prepareRetryTarget(ctx, widenRetryTarget)
          kotlin.Result.success(retryEpoch.get())
        } catch (error: Exception) {
          kotlin.Result.failure(error)
        }
        ContextCompat.getMainExecutor(ctx).execute {
          callback(result)
        }
      }
    }

    internal fun updateRetryWorker(
      ctx: Context,
      epoch: Long,
      result: BackgroundWorkerResult,
      callback: (kotlin.Result<Unit>) -> Unit,
    ) {
      retryExecutor.execute {
        val update = try {
          if (epoch == retryEpoch.get()) {
            val current = queryRetryTarget(ctx)
            val operation = when (result) {
              BackgroundWorkerResult.NONE ->
                WorkManager.getInstance(ctx).cancelUniqueWork(RETRY_WORKER_NAME)
              BackgroundWorkerResult.CONNECTED -> {
                if (current == BackgroundRetryTarget.CONNECTED) null
                else enqueueRetryWorker(ctx, BackgroundRetryTarget.CONNECTED)
              }
              BackgroundWorkerResult.UNMETERED -> {
                if (current == BackgroundRetryTarget.UNMETERED) null
                else enqueueRetryWorker(ctx, BackgroundRetryTarget.UNMETERED)
              }
              BackgroundWorkerResult.UNCHANGED -> null
            }
            operation?.result?.get()
          }
          kotlin.Result.success(Unit)
        } catch (error: Exception) {
          kotlin.Result.failure(error)
        }
        ContextCompat.getMainExecutor(ctx).execute {
          callback(update)
        }
      }
    }

    fun rearmRetryWorker(ctx: Context) {
      retryExecutor.execute {
        try {
          val target = queryRetryTarget(ctx)
          if (target != null) {
            enqueueRetryWorker(ctx, target).result.get()
          }
        } catch (error: Exception) {
          Log.w(TAG, "Failed to rearm background retry worker", error)
        }
      }
    }

    private fun isBackgroundWorkRunning(ctx: Context): Boolean {
      return WorkManager.getInstance(ctx)
        .getWorkInfosForUniqueWork(BACKGROUND_WORKER_NAME)
        .get()
        .any { it.state == WorkInfo.State.RUNNING }
    }

    private fun prepareRetryTarget(
      ctx: Context,
      widenRetryTarget: Boolean,
    ): BackgroundRetryTarget {
      val current = queryRetryTarget(ctx)
      val target =
        if (widenRetryTarget && current == BackgroundRetryTarget.UNMETERED) {
          BackgroundRetryTarget.CONNECTED
        } else {
          current ?: BackgroundRetryTarget.CONNECTED
        }
      if (target != current) {
        enqueueRetryWorker(ctx, target).result.get()
      }
      return target
    }

    private fun queryRetryTarget(ctx: Context): BackgroundRetryTarget? {
      val info = WorkManager.getInstance(ctx)
        .getWorkInfosForUniqueWork(RETRY_WORKER_NAME)
        .get()
        .firstOrNull {
          it.state == WorkInfo.State.ENQUEUED || it.state == WorkInfo.State.RUNNING
        }
      return info?.let { workInfo ->
        BackgroundRetryTarget.entries.firstOrNull { it.tag in workInfo.tags }
      }
    }

    private fun enqueueRetryWorker(ctx: Context, target: BackgroundRetryTarget): Operation {
      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(target.networkType)
        .setRequiresCharging(settings.requiresCharging)
        .build()
      val work = OneTimeWorkRequestBuilder<BackgroundRetryWorker>()
        .setConstraints(constraints)
        .addTag(target.tag)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .build()
      val operation = WorkManager.getInstance(ctx)
        .enqueueUniqueWork(RETRY_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued background retry worker with target: $target")
      return operation
    }

    fun isBackgroundWorkerRunning(): Boolean = BackgroundWorker.isRunning()

    fun cancelBackgroundWorker(ctx: Context) {
      WorkManager.getInstance(ctx).cancelUniqueWork(BACKGROUND_WORKER_NAME)

      Log.i(TAG, "Cancelled background upload task")
    }
  }
}
