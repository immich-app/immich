package app.alextran.immich.background

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.edit
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundUploadImpl"

class BackgroundUploadImpl(context: Context) : BackgroundUploadFgHostApi {
  private val ctx: Context = context.applicationContext

  override fun enable(callbackHandle: Long) {
    updateBackupEnabled(ctx, true)
    updateCallbackHandle(ctx, callbackHandle)
    enqueueMediaObserver(ctx)
    Log.i(TAG, "Scheduled background tasks")
  }

  override fun disable() {
    updateBackupEnabled(ctx, false)
    cancelTasks(ctx)
    Log.i(TAG, "Cancelled background tasks")
  }

  companion object {
    private const val BACKUP_WORKER_NAME = "immich/BackupWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"

    const val SHARED_PREF_NAME = "Immich::Backups"
    private const val SHARED_PREF_BACKUP_ENABLED = "Backups::enabled"
    const val SHARED_PREF_CALLBACK_HANDLE = "Backups::callbackHandle"

    private fun updateBackupEnabled(context: Context, enabled: Boolean) {
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
        .setTriggerContentUpdateDelay(30, TimeUnit.SECONDS)
        .setTriggerContentMaxDelay(2, TimeUnit.MINUTES)
        .build()

      val work = OneTimeWorkRequest.Builder(MediaObserver::class.java)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(OBSERVER_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued media observer worker with name: $OBSERVER_WORKER_NAME")
    }

    fun enqueueBackupWorker(ctx: Context) {
      val constraints = Constraints.Builder().setRequiresBatteryNotLow(true).build()

      val work = OneTimeWorkRequest.Builder(BackgroundUploadWorker::class.java)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .setInitialDelay(5, TimeUnit.SECONDS)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKUP_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(TAG, "Enqueued backup worker with name: $BACKUP_WORKER_NAME")
    }

    private fun cancelTasks(ctx: Context) {
      WorkManager.getInstance(ctx).cancelUniqueWork(OBSERVER_WORKER_NAME)
      WorkManager.getInstance(ctx).cancelUniqueWork(BACKUP_WORKER_NAME)
    }
  }
}
