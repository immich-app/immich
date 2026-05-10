package app.alextran.immich.localfiles

import android.app.Activity
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.PluginRegistry

class LocalFilesManagerPlugin : FlutterPlugin, ActivityAware, MethodChannel.MethodCallHandler,
  PluginRegistry.ActivityResultListener {
  private var channel: MethodChannel? = null
  private var context: Context? = null
  private var activityBinding: ActivityPluginBinding? = null
  private var activity: Activity? = null
  private var pendingPermissionResult: MethodChannel.Result? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    channel = MethodChannel(binding.binaryMessenger, CHANNEL_NAME).also {
      it.setMethodCallHandler(this)
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel?.setMethodCallHandler(null)
    channel = null
    context = null
    pendingPermissionResult = null
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
    activity = binding.activity
    binding.addActivityResultListener(this)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
    activity = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activityBinding = binding
    activity = binding.activity
    binding.addActivityResultListener(this)
  }

  override fun onDetachedFromActivity() {
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
    activity = null
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    when (call.method) {
      "hasManageMediaPermission" -> result.success(hasManageMediaPermission())
      "requestManageMediaPermission", "manageMediaPermission" -> requestManageMediaPermission(result)
      "moveToTrash" -> moveToTrash(call.argument<List<String>>("mediaUrls"), result)
      "restoreFromTrash" -> restoreFromTrash(call, result)
      else -> result.notImplemented()
    }
  }

  private fun hasManageMediaPermission(): Boolean {
    val ctx = context ?: return false
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && MediaStore.canManageMedia(ctx)
  }

  private fun requestManageMediaPermission(result: MethodChannel.Result) {
    if (hasManageMediaPermission()) {
      result.success(true)
      return
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      result.success(false)
      return
    }

    val currentActivity = activity
    if (currentActivity == null) {
      result.success(false)
      return
    }

    if (pendingPermissionResult != null) {
      result.error("PERMISSION_REQUEST_IN_PROGRESS", "A media permission request is already in progress.", null)
      return
    }

    pendingPermissionResult = result
    val intent = Intent(Settings.ACTION_REQUEST_MANAGE_MEDIA).apply {
      data = Uri.parse("package:${currentActivity.packageName}")
    }
    try {
      currentActivity.startActivityForResult(intent, MANAGE_MEDIA_REQUEST_CODE)
    } catch (e: Exception) {
      pendingPermissionResult = null
      Log.e(TAG, "Error opening media management settings", e)
      result.success(false)
    }
  }

  private fun moveToTrash(mediaUrls: List<String>?, result: MethodChannel.Result) {
    if (mediaUrls == null) {
      result.error("INVALID_ARGS", "mediaUrls is required.", null)
      return
    }

    if (mediaUrls.isEmpty()) {
      result.success(true)
      return
    }

    if (!hasManageMediaPermission()) {
      result.success(false)
      return
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      result.success(false)
      return
    }

    val uris = mediaUrls.mapNotNull { runCatching { Uri.parse(it) }.getOrNull() }
    result.success(setTrashed(uris, true))
  }

  private fun restoreFromTrash(call: MethodCall, result: MethodChannel.Result) {
    if (!hasManageMediaPermission()) {
      result.success(false)
      return
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      result.success(false)
      return
    }

    val type = call.argument<Int>("type") ?: 0
    val mediaId = call.argument<String>("mediaId")
    val uri = mediaId?.let { mediaUriForId(it, type) }
      ?: call.argument<String>("fileName")?.let { findTrashedMediaUriByName(it, type) }

    if (uri == null) {
      result.success(false)
      return
    }

    result.success(setTrashed(listOf(uri), false))
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun setTrashed(uris: Collection<Uri>, isTrashed: Boolean): Boolean {
    val resolver = context?.contentResolver ?: return false
    if (uris.isEmpty()) {
      return true
    }

    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.IS_TRASHED, if (isTrashed) 1 else 0)
    }

    return try {
      uris.all { uri -> resolver.update(uri, values, null, null) > 0 }
    } catch (e: Exception) {
      Log.e(TAG, "Error updating trash state", e)
      false
    }
  }

  private fun mediaUriForId(mediaId: String, type: Int): Uri? {
    val id = mediaId.toLongOrNull() ?: return null
    return ContentUris.withAppendedId(contentUriForType(type), id)
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun findTrashedMediaUriByName(fileName: String, type: Int): Uri? {
    val resolver = context?.contentResolver ?: return null
    val queryUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)
    val selection = "${MediaStore.Files.FileColumns.DISPLAY_NAME} = ?"
    val selectionArgs = arrayOf(fileName)

    resolver.query(
      queryUri,
      projection,
      android.os.Bundle().apply {
        putString(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
        putStringArray(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs)
        putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
      },
      null
    )?.use { cursor ->
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
        return ContentUris.withAppendedId(contentUriForType(type), id)
      }
    }

    return null
  }

  private fun contentUriForType(type: Int): Uri {
    return when (type) {
      ASSET_TYPE_IMAGE -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      ASSET_TYPE_VIDEO -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      ASSET_TYPE_AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      else -> MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    if (requestCode != MANAGE_MEDIA_REQUEST_CODE) {
      return false
    }

    pendingPermissionResult?.success(hasManageMediaPermission())
    pendingPermissionResult = null
    return true
  }

  private companion object {
    const val CHANNEL_NAME = "file_trash"
    const val TAG = "LocalFilesManager"
    const val MANAGE_MEDIA_REQUEST_CODE = 1001
    const val ASSET_TYPE_IMAGE = 1
    const val ASSET_TYPE_VIDEO = 2
    const val ASSET_TYPE_AUDIO = 3
  }
}
