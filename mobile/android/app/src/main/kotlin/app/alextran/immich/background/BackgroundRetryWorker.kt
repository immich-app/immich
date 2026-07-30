package app.alextran.immich.background

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

private const val TAG = "BackgroundRetryWorker"

class BackgroundRetryWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  private val ctx = context.applicationContext

  override fun doWork(): Result {
    return try {
      BackgroundWorkerApiImpl.enqueueBackgroundWorker(ctx, widenRetryTarget = false)
      Result.retry()
    } catch (error: Exception) {
      Log.w(TAG, "Failed to enqueue background worker", error)
      Result.retry()
    }
  }
}
