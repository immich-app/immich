package app.alextran.immich.background

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class MediaObserver(context: Context, params: WorkerParameters) : Worker(context, params) {
    private val ctx: Context = context.applicationContext

    override fun doWork(): Result {
        Log.i("MediaObserver", "Content change detected, starting background worker")

        // Enqueue backup worker only if there are new media changes
        if (triggeredContentUris.isNotEmpty()) {
            val type =
                if (isBackupEnabled(ctx)) BackgroundTaskType.UPLOAD else BackgroundTaskType.LOCAL_SYNC
            BackgroundWorkerApiImpl.enqueueBackgroundWorker(ctx, type)
        }

        // Re-enqueue itself to listen for future changes
        BackgroundWorkerApiImpl.enqueueMediaObserver(ctx)
        return Result.success()
    }

    private fun isBackupEnabled(context: Context): Boolean {
        val prefs =
            context.getSharedPreferences(
                BackgroundWorkerApiImpl.SHARED_PREF_NAME,
                Context.MODE_PRIVATE
            )
        return prefs.getBoolean(BackgroundWorkerApiImpl.SHARED_PREF_BACKUP_ENABLED, false)
    }
}
