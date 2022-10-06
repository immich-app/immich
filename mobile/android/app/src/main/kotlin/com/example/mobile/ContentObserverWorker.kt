package app.alextran.immich

import android.content.Context
import android.os.SystemClock
import android.provider.MediaStore
import android.util.Log
import androidx.work.Constraints
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.Operation
import java.util.concurrent.TimeUnit

/**
 * Worker executed by Android WorkManager observing content changes (new photos/videos)
 *
 * Immediately enqueues the BackupWorker when running. 
 * As this work is not triggered periodically, but on content change, the
 * worker enqueues itself again after each run.
 */
class ContentObserverWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    override fun doWork(): Result {
        if (!isEnabled(applicationContext)) {
            return Result.failure()
        }
        if (getTriggeredContentUris().size > 0) {
            startBackupWorker(applicationContext, delayMilliseconds = 0)
        }
        enqueueObserverWorker(applicationContext, ExistingWorkPolicy.REPLACE)
        return Result.success()
    }

    companion object {
        const val SHARED_PREF_SERVICE_ENABLED = "serviceEnabled"
        const val SHARED_PREF_REQUIRE_WIFI = "requireWifi"
        const val SHARED_PREF_REQUIRE_CHARGING = "requireCharging"

        private const val TASK_NAME_OBSERVER = "immich/ContentObserver"

        /**
         * Enqueues the `ContentObserverWorker`.
         * 
         * @param context Android Context
         */
        fun enable(context: Context, immediate: Boolean = false) {
            enqueueObserverWorker(context, ExistingWorkPolicy.KEEP)
            Log.d(TAG, "enabled ContentObserverWorker")
            if (immediate) {
                startBackupWorker(context, delayMilliseconds = 5000)
            }
        }

        /**
         * Configures the `BackupWorker` to run when all constraints are met.
         * 
         * @param context Android Context
         * @param requireWifi if true, task only runs if connected to wifi
         * @param requireCharging if true, task only runs if device is charging
         */
        fun configureWork(context: Context,
                          requireWifi: Boolean = false,
                          requireCharging: Boolean = false) {
            context.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(SHARED_PREF_SERVICE_ENABLED, true)
                .putBoolean(SHARED_PREF_REQUIRE_WIFI, requireWifi)
                .putBoolean(SHARED_PREF_REQUIRE_CHARGING, requireCharging)
                .apply()
            BackupWorker.updateBackupWorker(context, requireWifi, requireCharging)
        }

        /**
         * Stops the currently running worker (if any) and removes it from the work queue
         */
        fun disable(context: Context) {
            context.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .edit().putBoolean(SHARED_PREF_SERVICE_ENABLED, false).apply()
            WorkManager.getInstance(context).cancelUniqueWork(TASK_NAME_OBSERVER)
            Log.d(TAG, "disabled ContentObserverWorker")
        }

        /**
         * Return true if the user has enabled the background backup service
         */
        fun isEnabled(ctx: Context): Boolean {
            return ctx.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .getBoolean(SHARED_PREF_SERVICE_ENABLED, false)
        }

        /**
         * Enqueue and replace the worker without the content trigger but with a short delay
         */
        fun workManagerAppClearedWorkaround(context: Context) {
            val work = OneTimeWorkRequest.Builder(ContentObserverWorker::class.java)
                .setInitialDelay(500, TimeUnit.MILLISECONDS)
                .build()
            WorkManager
                .getInstance(context)
                .enqueueUniqueWork(TASK_NAME_OBSERVER, ExistingWorkPolicy.REPLACE, work)
                .getResult()
                .get()
            Log.d(TAG, "workManagerAppClearedWorkaround")
        }

        private fun enqueueObserverWorker(context: Context, policy: ExistingWorkPolicy) {
            val constraints = Constraints.Builder()
                .addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
                .setTriggerContentUpdateDelay(5000, TimeUnit.MILLISECONDS)
                .build()
                
            val work = OneTimeWorkRequest.Builder(ContentObserverWorker::class.java)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(TASK_NAME_OBSERVER, policy, work)
        }

        fun startBackupWorker(context: Context, delayMilliseconds: Long) {
            val sp = context.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
            if (!sp.getBoolean(SHARED_PREF_SERVICE_ENABLED, false))
                return
            val requireWifi = sp.getBoolean(SHARED_PREF_REQUIRE_WIFI, true)
            val requireCharging = sp.getBoolean(SHARED_PREF_REQUIRE_CHARGING, false)
            BackupWorker.enqueueBackupWorker(context, requireWifi, requireCharging, delayMilliseconds)
            sp.edit().putLong(BackupWorker.SHARED_PREF_LAST_CHANGE, SystemClock.uptimeMillis()).apply()
        }

    }
}

private const val TAG = "ContentObserverWorker"