package app.alextran.immich.background

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class MediaObserver(context: Context, params: WorkerParameters) : Worker(context, params) {
  private val ctx: Context = context.applicationContext

  override fun doWork(): Result {
    Log.i("MediaObserver", "Content change detected, starting background worker")
    // Re-enqueue itself to listen for future changes
    BackgroundWorkerApiImpl.enqueueMediaObserver(ctx)

    // Enqueue backup worker only if there are new media changes
    if (triggeredContentUris.isNotEmpty()) {
      BackgroundWorkerApiImpl.enqueueBackgroundWorker(ctx)
    }
    return Result.success()
  }
}
