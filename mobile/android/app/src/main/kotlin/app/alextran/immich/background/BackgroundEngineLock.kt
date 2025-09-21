package app.alextran.immich.background

import android.util.Log
import androidx.work.WorkManager
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.embedding.engine.plugins.FlutterPlugin
import java.util.concurrent.atomic.AtomicInteger

private const val TAG = "BackgroundEngineLock"

class BackgroundEngineLock : FlutterPlugin {
  companion object {
    const val ENGINE_CACHE_KEY = "immich::background_worker::engine"
    var engineCount = AtomicInteger(0)
  }

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    // work manager task is running while the main app is opened, cancel the worker
    if (engineCount.incrementAndGet() > 1 && FlutterEngineCache.getInstance()
        .get(ENGINE_CACHE_KEY) != null
    ) {
      WorkManager.getInstance(binding.applicationContext)
        .cancelUniqueWork(BackgroundWorkerApiImpl.BACKGROUND_WORKER_NAME)
      FlutterEngineCache.getInstance().remove(ENGINE_CACHE_KEY)
    }
    Log.i(TAG, "Flutter engine attached. Attached Engines count: $engineCount")
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    engineCount.decrementAndGet()
    Log.i(TAG, "Flutter engine detached. Attached Engines count: $engineCount")
  }
}
