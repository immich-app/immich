package app.alextran.immich.background

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class PeriodicWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  private val ctx: Context = context.applicationContext

  override fun doWork(): Result {
    Log.i("PeriodicWorker", "Periodic worker triggered, starting background worker")
    BackgroundWorkerApiImpl.enqueueBackgroundWorker(ctx)
    return Result.success()
  }
}
