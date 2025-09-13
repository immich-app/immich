package app.alextran.immich.background

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundUploadImpl"

class BackgroundWorkerApiImpl(context: Context) : BackgroundWorkerFgHostApi {
  private val ctx: Context = context.applicationContext

  override fun enable() {
    enqueueMediaObserver(ctx)
  }

  override fun disable() {
    WorkManager.getInstance(ctx).cancelUniqueWork(OBSERVER_WORKER_NAME)
    WorkManager.getInstance(ctx).cancelUniqueWork(BACKGROUND_WORKER_NAME)
    Log.i(TAG, "Cancelled background upload tasks")
  }

  companion object {
    private const val BACKGROUND_WORKER_NAME = "immich/BackgroundWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"

    fun enqueueMediaObserver(ctx: Context) {
      val constraints = Constraints.Builder()
        .addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
        .setTriggerContentUpdateDelay(30, TimeUnit.SECONDS)
        .setTriggerContentMaxDelay(3, TimeUnit.MINUTES)
        .build()

      val work = OneTimeWorkRequest.Builder(MediaObserver::class.java)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(OBSERVER_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued media observer worker with name: $OBSERVER_WORKER_NAME")
    }

    fun enqueueBackgroundWorker(ctx: Context) {
      val constraints = Constraints.Builder().setRequiresBatteryNotLow(true).build()

      val work = OneTimeWorkRequest.Builder(BackgroundWorker::class.java)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKGROUND_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued background worker with name: $BACKGROUND_WORKER_NAME")
    }
  }
}
