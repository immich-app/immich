package app.alextran.immich.background

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.google.common.util.concurrent.FutureCallback
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.MoreExecutors
import io.flutter.embedding.engine.FlutterEngineCache
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundWorkerApiImpl"

class BackgroundWorkerApiImpl(context: Context) : BackgroundWorkerFgHostApi {
  private val ctx: Context = context.applicationContext

  override fun enable(settings: BackgroundWorkerSettings) {
    applySettings(settings)
  }

  override fun saveNotificationMessage(title: String, body: String) {
    BackgroundWorkerPreferences(ctx).updateNotificationConfig(title, body)
  }

  override fun configure(settings: BackgroundWorkerSettings) {
    applySettings(settings)
  }

  private fun applySettings(settings: BackgroundWorkerSettings) {
    BackgroundWorkerPreferences(ctx).updateSettings(settings)
    enqueueMediaObserver(ctx)
    enqueuePeriodicWorker(ctx)
    refreshQueuedBackgroundWorker(ctx)
  }

  override fun disable() {
    WorkManager.getInstance(ctx).apply {
      cancelUniqueWork(OBSERVER_WORKER_NAME)
      cancelUniqueWork(BACKGROUND_WORKER_NAME)
      cancelUniqueWork(PERIODIC_WORKER_NAME)
    }
    Log.i(TAG, "Cancelled background upload tasks")
  }

  companion object {
    private const val BACKGROUND_WORKER_NAME = "immich/BackgroundWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"
    private const val PERIODIC_WORKER_NAME = "immich/PeriodicBackgroundWorkerV1"
    const val ENGINE_CACHE_KEY = "immich::background_worker::engine"


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

    fun enqueueBackgroundWorker(ctx: Context) {
      val work = backgroundWorkerRequestBuilder(ctx).build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKGROUND_WORKER_NAME, ExistingWorkPolicy.KEEP, work)

      Log.i(TAG, "Enqueued background worker with name: $BACKGROUND_WORKER_NAME")
    }

    private fun backgroundWorkerRequestBuilder(ctx: Context): OneTimeWorkRequest.Builder {
      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(if (settings.requiresUnmetered) NetworkType.UNMETERED else NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()
      return OneTimeWorkRequestBuilder<BackgroundWorker>()
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
    }

    private fun refreshQueuedBackgroundWorker(ctx: Context) {
      val workManager = WorkManager.getInstance(ctx)
      Futures.addCallback(
        workManager.getWorkInfosForUniqueWork(BACKGROUND_WORKER_NAME),
        object : FutureCallback<List<WorkInfo>> {
          override fun onSuccess(infos: List<WorkInfo>?) {
            val info = infos?.firstOrNull { it.state == WorkInfo.State.ENQUEUED } ?: return
            workManager.updateWork(backgroundWorkerRequestBuilder(ctx).setId(info.id).build())
          }

          override fun onFailure(t: Throwable) {
            Log.w(TAG, "Failed to update background worker", t)
          }
        },
        MoreExecutors.directExecutor(),
      )
    }

    fun isBackgroundWorkerRunning(): Boolean {
      // Easier to check if the engine is cached as we always cache the engine when starting the worker
      // and remove it when the worker is finished
      return FlutterEngineCache.getInstance().get(ENGINE_CACHE_KEY) != null
    }

    fun cancelBackgroundWorker(ctx: Context) {
      WorkManager.getInstance(ctx).cancelUniqueWork(BACKGROUND_WORKER_NAME)
      FlutterEngineCache.getInstance().remove(ENGINE_CACHE_KEY)

      Log.i(TAG, "Cancelled background upload task")
    }
  }
}
