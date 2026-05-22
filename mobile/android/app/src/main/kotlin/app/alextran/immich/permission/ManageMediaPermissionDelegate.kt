package app.alextran.immich.permission

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.MediaStore
import android.provider.Settings
import androidx.core.net.toUri
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.PluginRegistry

class ManageMediaPermissionDelegate(
  context: Context,
  private val requestCode: Int = 1003,
) : PluginRegistry.ActivityResultListener {
  private val ctx = context.applicationContext
  private var activityBinding: ActivityPluginBinding? = null
  private var pendingResult: ((Result<Boolean>) -> Unit)? = null

  fun hasManageMediaPermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaStore.canManageMedia(ctx)
    } else {
      false
    }
  }

  fun requestManageMediaPermission(callback: (Result<Boolean>) -> Unit) {
    if (hasManageMediaPermission()) {
      callback(Result.success(true))
      return
    }

    openManageMediaPermissionSettings(callback)
  }

  fun manageMediaPermission(callback: (Result<Boolean>) -> Unit) {
    openManageMediaPermissionSettings(callback)
  }

  private fun openManageMediaPermissionSettings(callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      callback(Result.success(false))
      return
    }

    val activity = activityBinding?.activity
    if (activity == null) {
      callback(Result.failure(FlutterError("NO_ACTIVITY", "Activity not available", null)))
      return
    }

    pendingResult = callback
    val intent = Intent(Settings.ACTION_REQUEST_MANAGE_MEDIA).apply {
      data = "package:${activity.packageName}".toUri()
    }
    try {
      activity.startActivityForResult(intent, requestCode)
    } catch (e: Exception) {
      pendingResult = null
      callback(
        Result.failure(
          FlutterError("ACTIVITY_LAUNCH_FAILED", "Failed to launch MANAGE_MEDIA settings", e.toString())
        )
      )
    }
  }

  fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
    binding.addActivityResultListener(this)
  }

  fun onDetachedFromActivity() {
    failPending("ACTIVITY_DETACHED", "Activity detached before MANAGE_MEDIA result")
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    if (requestCode == this.requestCode) {
      val callback = pendingResult
      pendingResult = null
      callback?.invoke(Result.success(hasManageMediaPermission()))
      return true
    }

    return false
  }

  private fun failPending(code: String, message: String) {
    val callback = pendingResult ?: return
    pendingResult = null
    callback(Result.failure(FlutterError(code, message, null)))
  }
}
