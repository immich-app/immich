package app.alextran.immich.sync

import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.net.toUri
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.PluginRegistry

private const val TAG = "MediaTrashDelegate"

class MediaTrashDelegate(context: Context) : PluginRegistry.ActivityResultListener {
  private val ctx = context.applicationContext
  private var activityBinding: ActivityPluginBinding? = null
  private var pendingResult: ((Result<Boolean>) -> Unit)? = null

  companion object {
    private const val PERMISSION_REQUEST_CODE = 1001
    private const val TRASH_REQUEST_CODE = 1002
  }

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
    activity.startActivityForResult(intent, PERMISSION_REQUEST_CODE)
  }

  fun moveToTrash(mediaUrls: List<String>, callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || !hasManageMediaPermission()) {
      callback(Result.failure(FlutterError("PERMISSION_DENIED", "Media permission required", null)))
      return
    }

    val urisToTrash = mediaUrls.map { it.toUri() }
    if (urisToTrash.isEmpty()) {
      callback(Result.failure(FlutterError("INVALID_ARGS", "No valid URIs provided", null)))
      return
    }

    toggleTrash(urisToTrash, true, callback)
  }

  fun restoreFromTrash(
    fileName: String?,
    mediaId: String?,
    type: Long,
    callback: (Result<Boolean>) -> Unit
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || !hasManageMediaPermission()) {
      callback(Result.failure(FlutterError("PERMISSION_DENIED", "Media permission required", null)))
      return
    }

    when {
      fileName != null -> restoreFromTrashByName(fileName, type.toInt(), callback)
      mediaId != null -> restoreFromTrashById(mediaId, type.toInt(), callback)
      else -> callback(Result.failure(FlutterError("INVALID_PARAMS", "Required params are not specified", null)))
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun restoreFromTrashByName(fileName: String, type: Int, callback: (Result<Boolean>) -> Unit) {
    val uri = getTrashedFileUri(fileName, type)
    if (uri == null) {
      callback(Result.failure(FlutterError("TRASH_NOT_FOUND", "Asset URI cannot be found", null)))
      return
    }

    restoreUris(listOf(uri), callback)
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun restoreFromTrashById(mediaId: String, type: Int, callback: (Result<Boolean>) -> Unit) {
    val id = mediaId.toLongOrNull()
    if (id == null) {
      callback(
        Result.failure(
          FlutterError("INVALID_ID", "The file id is not a valid number: $mediaId", null)
        )
      )
      return
    }

    if (!isInTrash(id)) {
      callback(Result.failure(FlutterError("TRASH_NOT_FOUND", "Item with id=$id not found in trash", null)))
      return
    }

    restoreUris(listOf(ContentUris.withAppendedId(contentUriForType(type), id)), callback)
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun restoreUris(uris: List<Uri>, callback: (Result<Boolean>) -> Unit) {
    if (uris.isEmpty()) {
      callback(Result.failure(FlutterError("TRASH_ERROR", "No URIs to restore", null)))
      return
    }

    toggleTrash(uris, false, callback)
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun toggleTrash(
    contentUris: List<Uri>,
    isTrashed: Boolean,
    callback: (Result<Boolean>) -> Unit
  ) {
    val activity = activityBinding?.activity
    if (activity == null) {
      callback(Result.failure(FlutterError("NO_ACTIVITY", "Activity not available", null)))
      return
    }

    try {
      val pendingIntent = MediaStore.createTrashRequest(ctx.contentResolver, contentUris, isTrashed)
      pendingResult = callback
      activity.startIntentSenderForResult(
        pendingIntent.intentSender,
        TRASH_REQUEST_CODE,
        null,
        0,
        0,
        0
      )
    } catch (e: Exception) {
      Log.e(TAG, "Error creating or starting trash request", e)
      callback(Result.failure(FlutterError("TRASH_ERROR", "Error creating or starting trash request", null)))
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun getTrashedFileUri(fileName: String, type: Int): Uri? {
    val queryUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)
    val queryArgs = Bundle().apply {
      putString(
        ContentResolver.QUERY_ARG_SQL_SELECTION,
        "${MediaStore.Files.FileColumns.DISPLAY_NAME} = ?"
      )
      putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arrayOf(fileName))
      putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
    }

    ctx.contentResolver.query(queryUri, projection, queryArgs, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
        return ContentUris.withAppendedId(contentUriForType(type), id)
      }
    }
    return null
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun isInTrash(id: Long): Boolean {
    val filesUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val args = Bundle().apply {
      putString(ContentResolver.QUERY_ARG_SQL_SELECTION, "${MediaStore.Files.FileColumns._ID}=?")
      putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arrayOf(id.toString()))
      putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
      putInt(ContentResolver.QUERY_ARG_LIMIT, 1)
    }
    return ctx.contentResolver.query(filesUri, arrayOf(MediaStore.Files.FileColumns._ID), args, null)
      ?.use { it.moveToFirst() } == true
  }

  private fun contentUriForType(type: Int): Uri =
    when (type) {
      // Same order as AssetType from Dart.
      1 -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      2 -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      3 -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      else -> MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    }

  fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
    binding.addActivityResultListener(this)
  }

  fun onDetachedFromActivity() {
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    if (requestCode == PERMISSION_REQUEST_CODE) {
      pendingResult?.invoke(Result.success(hasManageMediaPermission()))
      pendingResult = null
      return true
    }

    if (requestCode == TRASH_REQUEST_CODE) {
      pendingResult?.invoke(Result.success(resultCode == Activity.RESULT_OK))
      pendingResult = null
      return true
    }

    return false
  }
}
