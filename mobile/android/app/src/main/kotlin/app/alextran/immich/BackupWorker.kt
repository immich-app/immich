package app.alextran.immich

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.concurrent.futures.ResolvableFuture
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ForegroundInfo
import androidx.work.ListenableWorker
import androidx.work.NetworkType
import androidx.work.WorkerParameters
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.WorkInfo
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
 * i.e. battery is not low and optionally Wifi and charging are active.
 */
class BackupWorker(ctx: Context, params: WorkerParameters) : ListenableWorker(ctx, params),
  MethodChannel.MethodCallHandler {

  private val resolvableFuture = ResolvableFuture.create<Result>()
  private var engine: FlutterEngine? = null
  private lateinit var backgroundChannel: MethodChannel
  private val notificationManager =
    ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  private val isIgnoringBatteryOptimizations = isIgnoringBatteryOptimizations(applicationContext)
  private var timeBackupStarted: Long = 0L
  private var notificationBuilder: NotificationCompat.Builder? = null
  private var notificationDetailBuilder: NotificationCompat.Builder? = null
  private var fgFuture: ListenableFuture<Void>? = null

  override fun startWork(): ListenableFuture<ListenableWorker.Result> {

    Log.d(TAG, "startWork")

    val ctx = applicationContext

    if (!flutterLoader.initialized()) {
      flutterLoader.startInitialization(ctx)
    }

    // Create a Notification channel
    createChannel()

    Log.d(TAG, "isIgnoringBatteryOptimizations $isIgnoringBatteryOptimizations")
    if (isIgnoringBatteryOptimizations) {
      // normal background services can only up to 10 minutes
      // foreground services are allowed to run indefinitely
      // requires battery optimizations to be disabled (either manually by the user
      // or by the system learning that immich is important to the user)
      val title = ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        .getString(SHARED_PREF_NOTIFICATION_TITLE, NOTIFICATION_DEFAULT_TITLE)!!
      showInfo(getInfoBuilder(title, indeterminate = true).build())
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
      SHARED_PREF_NAME, Context.MODE_PRIVATE
    ).getLong(SHARED_PREF_CALLBACK_KEY, 0L)
    val callbackInformation =
      FlutterCallbackInformation.lookupCallbackInformation(callbackDispatcherHandle)
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
    Log.d(TAG, "onStopped")
    // called when the system has to stop this worker because constraints are
    // no longer met or the system needs resources for more important tasks
    Handler(Looper.getMainLooper()).postAtFrontOfQueue {
      if (::backgroundChannel.isInitialized) {
        backgroundChannel.invokeMethod("systemStop", null)
      }
    }
    waitOnSetForegroundAsync()
    // cannot await/get(block) on resolvableFuture as its already cancelled (would throw CancellationException)
    // instead, wait for 5 seconds until forcefully stopping backup work
    Handler(Looper.getMainLooper()).postDelayed({
      stopEngine(null)
    }, 5000)
  }

  private fun waitOnSetForegroundAsync() {
    val fgFuture = this.fgFuture
    if (fgFuture != null && !fgFuture.isCancelled && !fgFuture.isDone) {
      try {
        fgFuture.get(500, TimeUnit.MILLISECONDS)
      } catch (e: Exception) {
        // ignored, there is nothing to be done
      }
    }
  }

  private fun stopEngine(result: Result?) {
    clearBackgroundNotification()
    engine?.destroy()
    engine = null
    if (result != null) {
      Log.d(TAG, "stopEngine result=${result}")
      resolvableFuture.set(result)
    }
    waitOnSetForegroundAsync()
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  override fun onMethodCall(call: MethodCall, r: MethodChannel.Result) {
    when (call.method) {
      "initialized" -> {
        timeBackupStarted = SystemClock.uptimeMillis()
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
              stopEngine(if (success) Result.success() else Result.retry())
            }
          }
        )
      }

      "updateNotification" -> {
        val args = call.arguments<ArrayList<*>>()!!
        val title = args[0] as String?
        val content = args[1] as String?
        val progress = args[2] as Int
        val max = args[3] as Int
        val indeterminate = args[4] as Boolean
        val isDetail = args[5] as Boolean
        val onlyIfFG = args[6] as Boolean
        if (!onlyIfFG || isIgnoringBatteryOptimizations) {
          showInfo(
            getInfoBuilder(title, content, isDetail, progress, max, indeterminate).build(),
            isDetail
          )
        }
      }

      "showError" -> {
        val args = call.arguments<ArrayList<*>>()!!
        val title = args[0] as String
        val content = args[1] as String?
        val individualTag = args[2] as String?
        showError(title, content, individualTag)
      }

      "clearErrorNotifications" -> clearErrorNotifications()
      "hasContentChanged" -> {
        val lastChange = applicationContext
          .getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
          .getLong(SHARED_PREF_LAST_CHANGE, timeBackupStarted)
        val hasContentChanged = lastChange > timeBackupStarted;
        timeBackupStarted = SystemClock.uptimeMillis()
        r.success(hasContentChanged)
      }

      else -> r.notImplemented()
    }
  }

  private fun showError(title: String, content: String?, individualTag: String?) {
    val notification = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ERROR_ID)
      .setContentTitle(title)
      .setTicker(title)
      .setContentText(content)
      .setSmallIcon(R.drawable.notification_icon)
      .build()
    notificationManager.notify(individualTag, NOTIFICATION_ERROR_ID, notification)
  }

  private fun clearErrorNotifications() {
    notificationManager.cancel(NOTIFICATION_ERROR_ID)
  }

  private fun clearBackgroundNotification() {
    notificationManager.cancel(NOTIFICATION_ID)
    notificationManager.cancel(NOTIFICATION_DETAIL_ID)
  }

  private fun showInfo(notification: Notification, isDetail: Boolean = false) {
    val id = if (isDetail) NOTIFICATION_DETAIL_ID else NOTIFICATION_ID

    if (isIgnoringBatteryOptimizations && !isDetail) {
      fgFuture = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        setForegroundAsync(ForegroundInfo(id, notification, FOREGROUND_SERVICE_TYPE_SHORT_SERVICE))
      } else {
        setForegroundAsync(ForegroundInfo(id, notification))
      }
    } else {
      notificationManager.notify(id, notification)
    }
  }

  private fun getInfoBuilder(
    title: String? = null,
    content: String? = null,
    isDetail: Boolean = false,
    progress: Int = 0,
    max: Int = 0,
    indeterminate: Boolean = false,
  ): NotificationCompat.Builder {
    var builder = if (isDetail) notificationDetailBuilder else notificationBuilder
    if (builder == null) {
      builder = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ID)
        .setSmallIcon(R.drawable.notification_icon)
        .setOnlyAlertOnce(true)
        .setOngoing(true)
      if (isDetail) {
        notificationDetailBuilder = builder
      } else {
        notificationBuilder = builder
      }
    }
    if (title != null) {
      builder.setTicker(title).setContentTitle(title)
    }
    if (content != null) {
      builder.setContentText(content)
    }
    return builder.setProgress(max, progress, indeterminate)
  }

  private fun createChannel() {
    val foreground = NotificationChannel(
      NOTIFICATION_CHANNEL_ID,
      NOTIFICATION_CHANNEL_ID,
      NotificationManager.IMPORTANCE_LOW
    )
    notificationManager.createNotificationChannel(foreground)
    val error = NotificationChannel(
      NOTIFICATION_CHANNEL_ERROR_ID,
      NOTIFICATION_CHANNEL_ERROR_ID,
      NotificationManager.IMPORTANCE_HIGH
    )
    notificationManager.createNotificationChannel(error)
  }

  companion object {
    const val SHARED_PREF_NAME = "immichBackgroundService"
    const val SHARED_PREF_CALLBACK_KEY = "callbackDispatcherHandle"
    const val SHARED_PREF_NOTIFICATION_TITLE = "notificationTitle"
    const val SHARED_PREF_LAST_CHANGE = "lastChange"

    private const val TASK_NAME_BACKUP = "immich/BackupWorker"
    private const val NOTIFICATION_CHANNEL_ID = "immich/backgroundService"
    private const val NOTIFICATION_CHANNEL_ERROR_ID = "immich/backgroundServiceError"
    private const val NOTIFICATION_DEFAULT_TITLE = "Immich"
    private const val NOTIFICATION_ID = 1
    private const val NOTIFICATION_ERROR_ID = 2
    private const val NOTIFICATION_DETAIL_ID = 3
    private const val ONE_MINUTE = 60000L

    /**
     * Enqueues the BackupWorker to run once the constraints are met
     */
    fun enqueueBackupWorker(
      context: Context,
      requireWifi: Boolean = false,
      requireCharging: Boolean = false,
      delayMilliseconds: Long = 0L
    ) {
      val workRequest = buildWorkRequest(requireWifi, requireCharging, delayMilliseconds)
      WorkManager.getInstance(context)
        .enqueueUniqueWork(TASK_NAME_BACKUP, ExistingWorkPolicy.KEEP, workRequest)
      Log.d(TAG, "enqueueBackupWorker: BackupWorker enqueued")
    }

    /**
     * Updates the constraints of an already enqueued BackupWorker
     */
    fun updateBackupWorker(
      context: Context,
      requireWifi: Boolean = false,
      requireCharging: Boolean = false
    ) {
      try {
        val wm = WorkManager.getInstance(context)
        val workInfoFuture = wm.getWorkInfosForUniqueWork(TASK_NAME_BACKUP)
        val workInfoList = workInfoFuture.get(1000, TimeUnit.MILLISECONDS)
        if (workInfoList != null) {
          for (workInfo in workInfoList) {
            if (workInfo.state == WorkInfo.State.ENQUEUED) {
              val workRequest = buildWorkRequest(requireWifi, requireCharging)
              wm.enqueueUniqueWork(TASK_NAME_BACKUP, ExistingWorkPolicy.REPLACE, workRequest)
              Log.d(TAG, "updateBackupWorker updated BackupWorker constraints")
              return
            }
          }
        }
        Log.d(TAG, "updateBackupWorker: BackupWorker not enqueued")
      } catch (e: Exception) {
        Log.d(TAG, "updateBackupWorker failed: $e")
      }
    }

    /**
     * Stops the currently running worker (if any) and removes it from the work queue
     */
    fun stopWork(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(TASK_NAME_BACKUP)
      Log.d(TAG, "stopWork: BackupWorker cancelled")
    }

    /**
     * Returns `true` if the app is ignoring battery optimizations
     */
    fun isIgnoringBatteryOptimizations(ctx: Context): Boolean {
      val powerManager = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      return powerManager.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    private fun buildWorkRequest(
      requireWifi: Boolean = false,
      requireCharging: Boolean = false,
      delayMilliseconds: Long = 0L
    ): OneTimeWorkRequest {
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(if (requireWifi) NetworkType.UNMETERED else NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .setRequiresCharging(requireCharging)
        .build();

      val work = OneTimeWorkRequest.Builder(BackupWorker::class.java)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, ONE_MINUTE, TimeUnit.MILLISECONDS)
        .setInitialDelay(delayMilliseconds, TimeUnit.MILLISECONDS)
        .build()
      return work
    }

    private val flutterLoader = FlutterLoader()
  }
}

private const val TAG = "BackupWorker"
