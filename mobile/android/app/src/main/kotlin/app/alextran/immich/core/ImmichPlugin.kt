package app.alextran.immich.core

import androidx.annotation.CallSuper
import io.flutter.embedding.engine.plugins.FlutterPlugin

abstract class ImmichPlugin : FlutterPlugin {
  private var detached: Boolean = false;

  @CallSuper
  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    detached = false;
  }

  fun detachFromEngine() {
    detached = true
  }

  @CallSuper
  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    detachFromEngine()
  }

  fun <T> completeWhenActive(callback: (T) -> Unit, value: T) {
    if (detached) {
      return;
    }
    callback(value);
  }
}
