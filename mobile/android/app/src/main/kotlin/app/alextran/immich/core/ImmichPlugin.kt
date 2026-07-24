package app.alextran.immich.core

import androidx.annotation.CallSuper
import io.flutter.embedding.engine.plugins.FlutterPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive

abstract class ImmichPlugin : FlutterPlugin {
  private var detached: Boolean = false

  private var supervisor = SupervisorJob()
  protected var scope = CoroutineScope(supervisor + Dispatchers.Default)
    private set

  @CallSuper
  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    detached = false
    if (!scope.isActive) {
      supervisor = SupervisorJob()
      scope = CoroutineScope(supervisor + Dispatchers.Default)
    }
  }

  fun detachFromEngine() {
    detached = true
    supervisor.cancel()
  }

  @CallSuper
  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    detachFromEngine()
  }

  fun <T> completeWhenActive(callback: (T) -> Unit, value: T) {
    if (detached) {
      return
    }

    callback(value)
  }
}
