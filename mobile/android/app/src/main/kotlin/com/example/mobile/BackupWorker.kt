package app.alextran.immich

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.provider.MediaStore
import android.provider.BaseColumns
import android.provider.MediaStore.MediaColumns
import android.provider.MediaStore.Images.Media
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.concurrent.futures.ResolvableFuture
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ForegroundInfo
import androidx.work.ListenableWorker
import androidx.work.NetworkType
import androidx.work.WorkerParameters
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import com.google.common.util.concurrent.ListenableFuture
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.embedding.engine.loader.FlutterLoader
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.view.FlutterCallbackInformation
import java.util.concurrent.TimeUnit

/**
 * Worker executed by Android WorkManager to perform backup in background
 *
 * Starts the Dart runtime/engine and calls `_nativeEntry` function in
 * `background.service.dart` to run the actual backup logic.
 * Called by Android WorkManager when all constraints for the work are met,
 * i.e. a new photo/video is created on the device AND battery is not low.
 * Optionally, unmetered network (wifi) and charging can be required.
 * As this work is not triggered periodically, but on content change, the
 * worker enqueues itself again with the same settings.
 * In case the worker is stopped by the system (e.g. constraints like wifi
 * are no longer met, or the system needs memory resources for more other
 * more important work), the worker is replaced without the constraint on
 * changed contents to run again as soon as deemed possible by the system.
 */
class BackupWorker(ctx: Context, params: WorkerParameters) : ListenableWorker(ctx, params), MethodChannel.MethodCallHandler {

    private val resolvableFuture = ResolvableFuture.create<Result>()
    private var engine: FlutterEngine? = null
    private lateinit var backgroundChannel: MethodChannel
    private val notificationManager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val isIgnoringBatteryOptimizations = isIgnoringBatteryOptimizations(applicationContext)

    override fun startWork(): ListenableFuture<ListenableWorker.Result> {

        val ctx = applicationContext
        // enqueue itself once again to continue to listen on added photos/videos
        enqueueMoreWork(ctx,
                        requireUnmeteredNetwork = inputData.getBoolean(DATA_KEY_UNMETERED, true),
                        requireCharging = inputData.getBoolean(DATA_KEY_CHARGING, false))

        if (!flutterLoader.initialized()) {
            flutterLoader.startInitialization(ctx)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create a Notification channel if necessary
            createChannel()
        }
        if (isIgnoringBatteryOptimizations) {
            // normal background services can only up to 10 minutes
            // foreground services are allowed to run indefinitely
            // requires battery optimizations to be disabled (either manually by the user
            // or by the system learning that immich is important to the user)
            val title = ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
                .getString(SHARED_PREF_NOTIFICATION_TITLE, NOTIFICATION_DEFAULT_TITLE)!!
            setForegroundAsync(createForegroundInfo(title))
        }
        engine = FlutterEngine(ctx)

        flutterLoader.ensureInitializationCompleteAsync(ctx, null, Handler(Looper.getMainLooper())) {
            runDart()
        }

        return resolvableFuture
    }

    /**
     * Starts the Dart runtime/engine and calls `_nativeEntry` function in
     * `background.service.dart` to run the actual backup logic.
     */
    private fun runDart() {
        val callbackDispatcherHandle = applicationContext.getSharedPreferences(
            SHARED_PREF_NAME, Context.MODE_PRIVATE).getLong(SHARED_PREF_CALLBACK_KEY, 0L)
        val callbackInformation = FlutterCallbackInformation.lookupCallbackInformation(callbackDispatcherHandle)
        val appBundlePath = flutterLoader.findAppBundlePath()

        engine?.let { engine ->
            backgroundChannel = MethodChannel(engine.dartExecutor, "immich/backgroundChannel")
            backgroundChannel.setMethodCallHandler(this@BackupWorker)
            engine.dartExecutor.executeDartCallback(
                DartExecutor.DartCallback(
                    applicationContext.assets,
                    appBundlePath,
                    callbackInformation
                )
            )
        }
    }

    override fun onStopped() {
        // called when the system has to stop this worker because constraints are
        // no longer met or the system needs resources for more important tasks
        Handler(Looper.getMainLooper()).postAtFrontOfQueue {
            backgroundChannel.invokeMethod("systemStop", null)
        }
        // cannot await/get(block) on resolvableFuture as its already cancelled (would throw CancellationException)
        // instead, wait for 5 seconds until forcefully stopping backup work
        Handler(Looper.getMainLooper()).postDelayed({
            stopEngine(null)
        }, 5000)
    }


    private fun stopEngine(result: Result?) {
        if (result != null) {
            resolvableFuture.set(result)
        } else if (engine != null && inputData.getInt(DATA_KEY_RETRIES, 0) == 0) {
            // stopped by system and this is the first time (content change constraints active)
            // replace the task without the content constraints to finish the backup as soon as possible
            enqueueMoreWork(applicationContext,
                immediate = true,
                requireUnmeteredNetwork = inputData.getBoolean(DATA_KEY_UNMETERED, true),
                requireCharging = inputData.getBoolean(DATA_KEY_CHARGING, false),
                initialDelayInMs = ONE_MINUTE,
                retries = inputData.getInt(DATA_KEY_RETRIES, 0) + 1)
        }
        engine?.destroy()
        engine = null
    }

    override fun onMethodCall(call: MethodCall, r: MethodChannel.Result) {
        when (call.method) {
            "initialized" ->
                backgroundChannel.invokeMethod(
                    "onAssetsChanged",
                    null,
                    object : MethodChannel.Result {
                        override fun notImplemented() {
                            stopEngine(Result.failure())
                        }

                        override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {
                            stopEngine(Result.failure())
                        }

                        override fun success(receivedResult: Any?) {
                            val success = receivedResult as Boolean
                            stopEngine(if(success) Result.success() else Result.retry())
                            if (!success && inputData.getInt(DATA_KEY_RETRIES, 0) == 0) {
                                // there was an error (e.g. server not available)
                                // replace the task without the content constraints to finish the backup as soon as possible
                                enqueueMoreWork(applicationContext,
                                    immediate = true,
                                    requireUnmeteredNetwork = inputData.getBoolean(DATA_KEY_UNMETERED, true),
                                    requireCharging = inputData.getBoolean(DATA_KEY_CHARGING, false),
                                    initialDelayInMs = ONE_MINUTE,
                                    retries = inputData.getInt(DATA_KEY_RETRIES, 0) + 1)
                            }
                        }
                    }
                )
            "updateNotification" -> {
                val args = call.arguments<ArrayList<*>>()!!
                val title = args.get(0) as String
                val content = args.get(1) as String
                if (isIgnoringBatteryOptimizations) {
                    setForegroundAsync(createForegroundInfo(title, content))
                }
            }
            "showError" -> {
                val args = call.arguments<ArrayList<*>>()!!
                val title = args.get(0) as String
                val content = args.get(1) as String
                val individualTag = args.get(2) as String?
                showError(title, content, individualTag)
            }
            "clearErrorNotifications" -> clearErrorNotifications()
            else -> r.notImplemented()
        }
    }

    private fun showError(title: String, content: String, individualTag: String?) {
        val notification = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ERROR_ID)
           .setContentTitle(title)
           .setTicker(title)
           .setContentText(content)
           .setSmallIcon(R.mipmap.ic_launcher)
           .setOnlyAlertOnce(true)
           .build()
        notificationManager.notify(individualTag, NOTIFICATION_ERROR_ID, notification)
    }

    private fun clearErrorNotifications() {
        notificationManager.cancel(NOTIFICATION_ERROR_ID)
    }

    private fun createForegroundInfo(title: String = NOTIFICATION_DEFAULT_TITLE, content: String? = null): ForegroundInfo {
       val notification = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ID)
           .setContentTitle(title)
           .setTicker(title)
           .setContentText(content)
           .setSmallIcon(R.mipmap.ic_launcher)
           .setOngoing(true)
           .build()
       return ForegroundInfo(NOTIFICATION_ID, notification)
   }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createChannel() {
        val foreground = NotificationChannel(NOTIFICATION_CHANNEL_ID, NOTIFICATION_CHANNEL_ID, NotificationManager.IMPORTANCE_LOW)
        notificationManager.createNotificationChannel(foreground)
        val error = NotificationChannel(NOTIFICATION_CHANNEL_ERROR_ID, NOTIFICATION_CHANNEL_ERROR_ID, NotificationManager.IMPORTANCE_DEFAULT)
        notificationManager.createNotificationChannel(error)
    }

    companion object {
        const val SHARED_PREF_NAME = "immichBackgroundService"
        const val SHARED_PREF_CALLBACK_KEY = "callbackDispatcherHandle"
        const val SHARED_PREF_SERVICE_ENABLED = "serviceEnabled"
        const val SHARED_PREF_NOTIFICATION_TITLE = "notificationTitle"

        private const val TASK_NAME = "immich/photoListener"
        private const val DATA_KEY_UNMETERED = "unmetered"
        private const val DATA_KEY_CHARGING = "charging"
        private const val DATA_KEY_RETRIES = "retries"
        private const val NOTIFICATION_CHANNEL_ID = "immich/backgroundService"
        private const val NOTIFICATION_CHANNEL_ERROR_ID = "immich/backgroundServiceError"
        private const val NOTIFICATION_DEFAULT_TITLE = "Immich"
        private const val NOTIFICATION_ID = 1
        private const val NOTIFICATION_ERROR_ID = 2 
        private const val ONE_MINUTE: Long = 60000

        /**
         * Enqueues the `BackupWorker` to run when all constraints are met.
         * 
         * @param context Android Context
         * @param immediate whether to enqueue(replace) the worker without the content change constraint
         * @param keepExisting if true, use `ExistingWorkPolicy.KEEP`, else `ExistingWorkPolicy.APPEND_OR_REPLACE`
         * @param requireUnmeteredNetwork if true, task only runs if connected to wifi
         * @param requireCharging if true, task only runs if device is charging
         * @param retries retry count (should be 0 unless an error occured and this is a retry)
         */
        fun startWork(context: Context,
                        immediate: Boolean = false,
                        keepExisting: Boolean = false,
                        requireUnmeteredNetwork: Boolean = false,
                        requireCharging: Boolean = false) {
            context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .edit().putBoolean(SHARED_PREF_SERVICE_ENABLED, true).apply()
            enqueueMoreWork(context, immediate, keepExisting, requireUnmeteredNetwork, requireCharging)
        }

        private fun enqueueMoreWork(context: Context,
                                    immediate: Boolean = false,
                                    keepExisting: Boolean = false,
                                    requireUnmeteredNetwork: Boolean = false,
                                    requireCharging: Boolean = false,
                                    initialDelayInMs: Long = 0,
                                    retries: Int = 0) {
            if (!isEnabled(context)) {
                return
            }
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(if (requireUnmeteredNetwork) NetworkType.UNMETERED else NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .setRequiresCharging(requireCharging);
            if (!immediate) {
                constraints
                .addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
            }

            val inputData = Data.Builder()
                .putBoolean(DATA_KEY_CHARGING, requireCharging)
                .putBoolean(DATA_KEY_UNMETERED, requireUnmeteredNetwork)
                .putInt(DATA_KEY_RETRIES, retries)
                .build()
                
            val photoCheck = OneTimeWorkRequest.Builder(BackupWorker::class.java)
                .setConstraints(constraints.build())
                .setInputData(inputData)
                .setInitialDelay(initialDelayInMs, TimeUnit.MILLISECONDS)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    ONE_MINUTE,
                    TimeUnit.MILLISECONDS)
                .build()
            val policy = if (immediate) ExistingWorkPolicy.REPLACE else (if (keepExisting) ExistingWorkPolicy.KEEP else ExistingWorkPolicy.APPEND_OR_REPLACE)
            val op = WorkManager.getInstance(context).enqueueUniqueWork(TASK_NAME, policy, photoCheck)
            val result = op.getResult().get()
        }

        /**
         * Stops the currently running worker (if any) and removes it from the work queue
         */
        fun stopWork(context: Context) {
            context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .edit().putBoolean(SHARED_PREF_SERVICE_ENABLED, false).apply()
            WorkManager.getInstance(context).cancelUniqueWork(TASK_NAME)
        }

        /**
         * Returns `true` if the app is ignoring battery optimizations
         */
        fun isIgnoringBatteryOptimizations(ctx: Context): Boolean {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val pwrm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
                val name = ctx.packageName
                return pwrm.isIgnoringBatteryOptimizations(name)
            }
            return true
        }

        /**
         * Return true if the user has enabled the background backup service
         */
        fun isEnabled(ctx: Context): Boolean {
            return ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .getBoolean(SHARED_PREF_SERVICE_ENABLED, false)
        }

        private val flutterLoader = FlutterLoader()
    }
}

private const val TAG = "BackupWorker"