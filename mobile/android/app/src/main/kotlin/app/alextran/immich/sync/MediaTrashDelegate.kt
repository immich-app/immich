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
import androidx.annotation.RequiresApi
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.PluginRegistry

class MediaTrashDelegate(
  context: Context,
  private val trashRequestCode: Int = 1002,
) : PluginRegistry.ActivityResultListener {
  private val ctx = context.applicationContext
  private var activityBinding: ActivityPluginBinding? = null
  private var pendingResult: ((Result<Boolean>) -> Unit)? = null

  private fun hasManageMediaPermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaStore.canManageMedia(ctx)
    } else {
      false
    }
  }

  fun restoreFromTrashById(mediaId: String, type: Long, callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || !hasManageMediaPermission()) {
      callback(Result.failure(FlutterError("PERMISSION_DENIED", "Media permission required", null)))
      return
    }

    val id = mediaId.toLongOrNull()
    if (id == null) {
      callback(Result.failure(FlutterError("INVALID_ID", "The file id is not a valid number: $mediaId", null)))
      return
    }

    if (!isInTrash(id)) {
      callback(Result.failure(FlutterError("TRASH_NOT_FOUND", "Item with id=$id not found in trash", null)))
      return
    }

    restoreUri(ContentUris.withAppendedId(contentUriForType(type.toInt()), id), callback)
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun restoreUri(
    contentUri: Uri,
    callback: (Result<Boolean>) -> Unit,
  ) {
    val activity = activityBinding?.activity
    if (activity == null) {
      callback(Result.failure(FlutterError("NO_ACTIVITY", "Activity not available", null)))
      return
    }

    try {
      val pendingIntent = MediaStore.createTrashRequest(ctx.contentResolver, listOf(contentUri), false)
      pendingResult = callback
      activity.startIntentSenderForResult(
        pendingIntent.intentSender,
        trashRequestCode,
        null,
        0,
        0,
        0,
      )
    } catch (e: Exception) {
      pendingResult = null
      callback(
        Result.failure(
          FlutterError("TRASH_ERROR", "Error creating or starting trash request", e.toString())
        )
      )
    }
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
    failPending("ACTIVITY_DETACHED", "Activity detached before trash result")
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    if (requestCode == trashRequestCode) {
      val callback = pendingResult
      pendingResult = null
      callback?.invoke(Result.success(resultCode == Activity.RESULT_OK))
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
