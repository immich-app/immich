package app.alextran.immich.background

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.ForegroundInfo
import androidx.work.ListenableWorker
import androidx.work.WorkerParameters
import app.alextran.immich.MainActivity
import app.alextran.immich.R
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.SettableFuture
import io.flutter.FlutterInjector
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.embedding.engine.loader.FlutterLoader
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundWorker"

class BackgroundWorker(context: Context, params: WorkerParameters) :
  ListenableWorker(context, params), BackgroundWorkerBgHostApi {
  private val ctx: Context = context.applicationContext

  /// The Flutter loader that loads the native Flutter library and resources.
  /// This must be initialized before starting the Flutter engine.
  private var loader: FlutterLoader = FlutterInjector.instance().flutterLoader()

  /// The Flutter engine created specifically for background execution.
  /// This is a separate instance from the main Flutter engine that handles the UI.
  /// It operates in its own isolate and doesn't share memory with the main engine.
  /// Must be properly started, registered, and torn down during background execution.
  private var engine: FlutterEngine? = null

  // Used to call methods on the flutter side
  private var flutterApi: BackgroundWorkerFlutterApi? = null

  /// Result returned when the background task completes. This is used to signal
  /// to the WorkManager that the task has finished, either successfully or with failure.
  private val completionHandler: SettableFuture<Result> = SettableFuture.create()

  /// Flag to track whether the background task has completed to prevent duplicate completions
  private var isComplete = false

  private val notificationManager =
    ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private var foregroundFuture: ListenableFuture<Void>? = null

  companion object {
    private const val NOTIFICATION_CHANNEL_ID = "immich::background_worker::notif"
    private const val NOTIFICATION_ID = 100
  }

  override fun startWork(): ListenableFuture<Result> {
    Log.i(TAG, "Starting background upload worker")

    if (!loader.initialized()) {
      loader.startInitialization(ctx)
    }

    val notificationChannel = NotificationChannel(
      NOTIFICATION_CHANNEL_ID,
      NOTIFICATION_CHANNEL_ID,
      NotificationManager.IMPORTANCE_LOW
    )
    notificationManager.createNotificationChannel(notificationChannel)

    loader.ensureInitializationCompleteAsync(ctx, null, Handler(Looper.getMainLooper())) {
      engine = FlutterEngine(ctx)
      FlutterEngineCache.getInstance().remove(BackgroundEngineLock.ENGINE_CACHE_KEY);
      FlutterEngineCache.getInstance()
        .put(BackgroundEngineLock.ENGINE_CACHE_KEY, engine!!)

      // Register custom plugins
      MainActivity.registerPlugins(ctx, engine!!)
      flutterApi =
        BackgroundWorkerFlutterApi(binaryMessenger = engine!!.dartExecutor.binaryMessenger)
      BackgroundWorkerBgHostApi.setUp(
        binaryMessenger = engine!!.dartExecutor.binaryMessenger,
        api = this
      )

      engine!!.dartExecutor.executeDartEntrypoint(
        DartExecutor.DartEntrypoint(
          loader.findAppBundlePath(),
          "package:immich_mobile/domain/services/background_worker.service.dart",
          "backgroundSyncNativeEntrypoint"
        )
      )
    }

    return completionHandler
  }

  /**
   * Called by the Flutter side when it has finished initialization and is ready to receive commands.
   * Routes the appropriate task type (refresh or processing) to the corresponding Flutter method.
   * This method acts as a bridge between the native Android background task system and Flutter.
   */
  override fun onInitialized() {
    flutterApi?.onAndroidUpload { handleHostResult(it) }
  }

  // TODO: Move this to a separate NotificationManager class
  override fun showNotification(title: String, content: String) {
    val notification = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setTicker(title)
      .setContentTitle(title)
      .setContentText(content)
      .build()

    if (isIgnoringBatteryOptimizations()) {
      foregroundFuture = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        setForegroundAsync(
          ForegroundInfo(
            NOTIFICATION_ID,
            notification,
            FOREGROUND_SERVICE_TYPE_DATA_SYNC
          )
        )
      } else {
        setForegroundAsync(ForegroundInfo(NOTIFICATION_ID, notification))
      }
    } else {
      notificationManager.notify(NOTIFICATION_ID, notification)
    }
  }

  override fun close() {
    if (isComplete) {
      return
    }

    Handler(Looper.getMainLooper()).postAtFrontOfQueue {
      if (flutterApi != null) {
        flutterApi?.cancel {
          complete(Result.failure())
        }
      }
    }

    waitForForegroundPromotion()

    Handler(Looper.getMainLooper()).postDelayed({
      complete(Result.failure())
    }, 5000)
  }

  /**
   * Called when the system has to stop this worker because constraints are
   * no longer met or the system needs resources for more important tasks
   * This is also called when the worker has been explicitly cancelled or replaced
   */
  override fun onStopped() {
    Log.d(TAG, "About to stop BackupWorker")
    close()
  }

  private fun handleHostResult(result: kotlin.Result<Unit>) {
    if (isComplete) {
      return
    }

    result.fold(
      onSuccess = { _ -> complete(Result.success()) },
      onFailure = { _ -> onStopped() }
    )
  }

  /**
   * Cleans up resources by destroying the Flutter engine context and invokes the completion handler.
   * This method ensures that the background task is marked as complete, releases the Flutter engine,
   * and notifies the caller of the task's success or failure. This is the final step in the
   * background task lifecycle and should only be called once per task instance.
   *
   * - Parameter success: Indicates whether the background task completed successfully
   */
  private fun complete(success: Result) {
    Log.d(TAG, "About to complete BackupWorker with result: $success")
    isComplete = true
    engine?.destroy()
    engine = null
    FlutterEngineCache.getInstance().remove(BackgroundEngineLock.ENGINE_CACHE_KEY);
    flutterApi = null
    notificationManager.cancel(NOTIFICATION_ID)
    waitForForegroundPromotion()
    completionHandler.set(success)
  }

  /**
   * Returns `true` if the app is ignoring battery optimizations
   */
  private fun isIgnoringBatteryOptimizations(): Boolean {
    val powerManager = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(ctx.packageName)
  }

  /**
   *  Calls to setForegroundAsync() that do not complete before completion of a ListenableWorker will signal an IllegalStateException
   * https://android-review.googlesource.com/c/platform/frameworks/support/+/1262743
   * Wait for a short period of time for the foreground promotion to complete before completing the worker
   */
  private fun waitForForegroundPromotion() {
    val foregroundFuture = this.foregroundFuture
    if (foregroundFuture != null && !foregroundFuture.isCancelled && !foregroundFuture.isDone) {
      try {
        foregroundFuture.get(500, TimeUnit.MILLISECONDS)
      } catch (e: Exception) {
        // ignored, there is nothing to be done
      }
    }
  }
}
