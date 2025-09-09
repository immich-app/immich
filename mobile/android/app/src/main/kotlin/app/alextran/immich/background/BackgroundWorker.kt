package app.alextran.immich.background

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.work.ListenableWorker
import androidx.work.WorkerParameters
import app.alextran.immich.MainActivity
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.SettableFuture
import io.flutter.FlutterInjector
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.embedding.engine.loader.FlutterLoader

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

  init {
    if (!loader.initialized()) {
      loader.startInitialization(ctx)
    }
  }

  override fun startWork(): ListenableFuture<Result> {
    Log.i(TAG, "Starting background upload worker")

    loader.ensureInitializationCompleteAsync(ctx, null, Handler(Looper.getMainLooper())) {
      engine = FlutterEngine(ctx)

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
    flutterApi = null
    completionHandler.set(success)
  }
}
