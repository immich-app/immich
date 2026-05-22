package app.alextran.immich.permission

import android.content.Context
import app.alextran.immich.core.ImmichPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding

class PermissionApiImpl(context: Context) : ImmichPlugin(), PermissionApi, ActivityAware {
  private val manageMediaPermissionDelegate = ManageMediaPermissionDelegate(context)

  override fun hasManageMediaPermission(): Boolean =
    manageMediaPermissionDelegate.hasManageMediaPermission()

  override fun requestManageMediaPermission(callback: (Result<Boolean>) -> Unit) {
    manageMediaPermissionDelegate.requestManageMediaPermission { completeWhenActive(callback, it) }
  }

  override fun manageMediaPermission(callback: (Result<Boolean>) -> Unit) {
    manageMediaPermissionDelegate.manageMediaPermission { completeWhenActive(callback, it) }
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    manageMediaPermissionDelegate.onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    manageMediaPermissionDelegate.onDetachedFromActivity()
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    manageMediaPermissionDelegate.onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivity() {
    manageMediaPermissionDelegate.onDetachedFromActivity()
  }
}
