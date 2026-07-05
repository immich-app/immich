package app.alextran.immich.background

import android.content.Context
import android.util.Log
import app.alextran.immich.core.ImmichPlugin
import io.flutter.embedding.engine.plugins.FlutterPlugin
import java.util.concurrent.atomic.AtomicInteger

private const val TAG = "BackgroundEngineLock"

class BackgroundEngineLock(context: Context) : BackgroundWorkerLockApi, ImmichPlugin() {
  private val ctx: Context = context.applicationContext

  companion object {

    private var engineCount = AtomicInteger(0)

    val connectEngines: Int
      get() = engineCount.get()

    private fun checkAndEnforceBackgroundLock(ctx: Context) {
      // work manager task is running while the main app is opened, cancel the worker
      if (BackgroundWorkerPreferences(ctx).isLocked() &&
        connectEngines > 1 &&
        BackgroundWorkerApiImpl.isBackgroundWorkerRunning()
      ) {
        Log.i(TAG, "Background worker is locked, cancelling the background worker")
        BackgroundWorkerApiImpl.cancelBackgroundWorker(ctx)
      }
    }
  }

  override fun lock() {
    BackgroundWorkerPreferences(ctx).setLocked(true)
    checkAndEnforceBackgroundLock(ctx)
    Log.i(TAG, "Background worker is locked")
  }

  override fun unlock() {
    BackgroundWorkerPreferences(ctx).setLocked(false)
    Log.i(TAG, "Background worker is unlocked")
  }

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onAttachedToEngine(binding)
    engineCount.incrementAndGet()
    checkAndEnforceBackgroundLock(binding.applicationContext)
    Log.i(TAG, "Flutter engine attached. Attached Engines count: $engineCount")
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onDetachedFromEngine(binding)
    engineCount.decrementAndGet()
    Log.i(TAG, "Flutter engine detached. Attached Engines count: $engineCount")
  }
}
