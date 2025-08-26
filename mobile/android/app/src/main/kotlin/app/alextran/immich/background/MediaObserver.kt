package app.alextran.immich.background

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class MediaObserver(context: Context, params: WorkerParameters) : Worker(context, params) {
  private val ctx: Context = context.applicationContext

  override fun doWork(): Result {
    Log.i("MediaObserver", "Content change detected, starting backup worker")

    // Enqueue backup worker only if there are new media changes
    if (triggeredContentUris.isNotEmpty()) {
      BackgroundUploadImpl.enqueueBackupWorker(ctx)
    }

    // Re-enqueue itself to listen for future changes
    BackgroundUploadImpl.enqueueMediaObserver(ctx)
    return Result.success()
  }
}
