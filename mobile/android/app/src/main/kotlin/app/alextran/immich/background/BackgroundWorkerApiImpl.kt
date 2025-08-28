package app.alextran.immich.background

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.edit
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundUploadImpl"

class BackgroundWorkerApiImpl(context: Context) : BackgroundWorkerFgHostApi {
  private val ctx: Context = context.applicationContext
  override fun enableSyncWorker() {
    enqueueMediaObserver(ctx)
    Log.i(TAG, "Scheduled media observer")
  }

  override fun enableUploadWorker(callbackHandle: Long) {
    updateUploadEnabled(ctx, true)
    updateCallbackHandle(ctx, callbackHandle)
    Log.i(TAG, "Scheduled background upload tasks")
  }

  override fun disableUploadWorker() {
    updateUploadEnabled(ctx, false)
    WorkManager.getInstance(ctx).cancelUniqueWork(BACKGROUND_WORKER_NAME)
    Log.i(TAG, "Cancelled background upload tasks")
  }

  companion object {
    private const val BACKGROUND_WORKER_NAME = "immich/BackgroundWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"

    const val WORKER_DATA_TASK_TYPE = "taskType"

    const val SHARED_PREF_NAME = "Immich::Background"
    const val SHARED_PREF_BACKUP_ENABLED = "Background::backup::enabled"
    const val SHARED_PREF_CALLBACK_HANDLE = "Background::backup::callbackHandle"

    private fun updateUploadEnabled(context: Context, enabled: Boolean) {
      context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE).edit {
        putBoolean(SHARED_PREF_BACKUP_ENABLED, enabled)
      }
    }

    private fun updateCallbackHandle(context: Context, callbackHandle: Long) {
      context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE).edit {
        putLong(SHARED_PREF_CALLBACK_HANDLE, callbackHandle)
      }
    }

    fun enqueueMediaObserver(ctx: Context) {
      val constraints = Constraints.Builder()
        .addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
        .addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
        .setTriggerContentUpdateDelay(5, TimeUnit.SECONDS)
        .setTriggerContentMaxDelay(1, TimeUnit.MINUTES)
        .build()

      val work = OneTimeWorkRequest.Builder(MediaObserver::class.java)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(OBSERVER_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued media observer worker with name: $OBSERVER_WORKER_NAME")
    }

    fun enqueueBackgroundWorker(ctx: Context, taskType: BackgroundTaskType) {
      val constraints = Constraints.Builder().setRequiresBatteryNotLow(true).build()

      val data = Data.Builder()
      data.putInt(WORKER_DATA_TASK_TYPE, taskType.ordinal)
      val work = OneTimeWorkRequest.Builder(BackgroundWorker::class.java)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .setInputData(data.build()).build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKGROUND_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued background worker with name: $BACKGROUND_WORKER_NAME")
    }
  }
}
