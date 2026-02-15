package app.alextran.immich.viewintent

import android.app.Activity
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.OpenableColumns
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.PluginRegistry
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class ViewIntentPlugin : FlutterPlugin, ActivityAware, PluginRegistry.NewIntentListener, ViewIntentHostApi {
  private var context: Context? = null
  private var activity: Activity? = null
  private var pendingIntent: Intent? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    ViewIntentHostApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    ViewIntentHostApi.setUp(binding.binaryMessenger, null)
    context = null
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activity = binding.activity
    pendingIntent = binding.activity.intent
    binding.addOnNewIntentListener(this)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activity = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivity() {
    activity = null
  }

  override fun onNewIntent(intent: Intent): Boolean {
    pendingIntent = intent
    return false
  }

  override fun consumeViewIntent(callback: (Result<ViewIntentPayload?>) -> Unit) {
    val context = context ?: run {
      callback(Result.success(null))
      return
    }
    val intent = pendingIntent ?: activity?.intent

    if (intent?.action != Intent.ACTION_VIEW) {
      callback(Result.success(null))
      return
    }

    val uri = intent.data
    if (uri == null) {
      callback(Result.success(null))
      return
    }

    val mimeType = context.contentResolver.getType(uri)
    if (mimeType == null || (!mimeType.startsWith("image/") && !mimeType.startsWith("video/"))) {
      callback(Result.success(null))
      return
    }

    try {
      val tempFile = copyUriToTempFile(context, uri, mimeType)
      if (tempFile == null) {
        callback(Result.success(null))
        return
      }

      val payload = ViewIntentPayload(
        path = tempFile.absolutePath,
        type = if (mimeType.startsWith("image/")) ViewIntentType.IMAGE else ViewIntentType.VIDEO,
        mimeType = mimeType,
        localAssetId = extractLocalAssetId(context, uri, mimeType),
      )
      consumeViewIntent(intent)
      callback(Result.success(payload))
    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }

  private fun consumeViewIntent(currentIntent: Intent) {
    pendingIntent = Intent(currentIntent).apply {
      action = null
      data = null
      type = null
    }
    activity?.intent = pendingIntent
  }

  private fun extractLocalAssetId(context: Context, uri: Uri, mimeType: String): String? {
    if (uri.scheme != "content") {
      return null
    }

    try {
      if (DocumentsContract.isDocumentUri(context, uri)) {
        val docId = DocumentsContract.getDocumentId(uri)
        if (docId.startsWith("raw:")) {
          return null
        }

        if (docId.isNotBlank()) {
          val parsed = docId.substringAfter(':', docId)
          if (parsed.all(Char::isDigit)) {
            return parsed
          }
          val fromRelativePath = resolveLocalIdByRelativePath(context, parsed, mimeType)
          if (fromRelativePath != null) {
            return fromRelativePath
          }
        }
      }
    } catch (_: Exception) {
      // Ignore and continue with fallback strategy.
    }

    try {
      val parsed = ContentUris.parseId(uri)
      if (parsed >= 0) {
        return parsed.toString()
      }
    } catch (_: Exception) {
      // Ignore and continue with fallback strategy.
    }

    val segment = uri.lastPathSegment
    if (segment != null && segment.all(Char::isDigit)) {
      return segment
    }

    return resolveLocalIdByNameAndSize(context, uri, mimeType)
  }

  private fun resolveLocalIdByRelativePath(context: Context, path: String, mimeType: String): String? {
    val fileName = path.substringAfterLast('/', missingDelimiterValue = path)
    val parent = path.substringBeforeLast('/', "").let { if (it.isEmpty()) "" else "$it/" }
    if (fileName.isBlank()) return null

    val tableUri = when {
      mimeType.startsWith("image/") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      mimeType.startsWith("video/") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else -> MediaStore.Files.getContentUri("external")
    }

    val projection = arrayOf(MediaStore.MediaColumns._ID)
    val (selection, args) =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        "${MediaStore.MediaColumns.DISPLAY_NAME}=? AND ${MediaStore.MediaColumns.RELATIVE_PATH}=?" to arrayOf(fileName, parent)
      } else {
        "${MediaStore.MediaColumns.DISPLAY_NAME}=?" to arrayOf(fileName)
      }

    return try {
      context.contentResolver
        .query(tableUri, projection, selection, args, "${MediaStore.MediaColumns.DATE_MODIFIED} DESC")
        ?.use { cursor ->
          if (!cursor.moveToFirst()) return null
          val idIndex = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
          if (idIndex < 0) return null
          cursor.getLong(idIndex).toString()
        }
    } catch (_: Exception) {
      null
    }
  }

  private fun resolveLocalIdByNameAndSize(context: Context, uri: Uri, mimeType: String): String? {
    val metaProjection = arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)
    val (displayName, size) =
      try {
        context.contentResolver.query(uri, metaProjection, null, null, null)?.use { cursor ->
          if (!cursor.moveToFirst()) return null
          val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
          val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
          val name = if (nameIdx >= 0) cursor.getString(nameIdx) else null
          val bytes = if (sizeIdx >= 0) cursor.getLong(sizeIdx) else -1L
          if (name.isNullOrBlank() || bytes < 0) return null
          name to bytes
        } ?: return null
      } catch (_: Exception) {
        return null
      }

    val tableUri = when {
      mimeType.startsWith("image/") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      mimeType.startsWith("video/") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else -> MediaStore.Files.getContentUri("external")
    }
    val projection = arrayOf(MediaStore.MediaColumns._ID)
    val selection = "${MediaStore.MediaColumns.DISPLAY_NAME}=? AND ${MediaStore.MediaColumns.SIZE}=?"
    val args = arrayOf(displayName, size.toString())

    return try {
      context.contentResolver
        .query(tableUri, projection, selection, args, "${MediaStore.MediaColumns.DATE_MODIFIED} DESC")
        ?.use { cursor ->
          if (!cursor.moveToFirst()) return null
          val idIndex = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
          if (idIndex < 0) return null
          cursor.getLong(idIndex).toString()
        }
    } catch (_: Exception) {
      null
    }
  }

  private fun copyUriToTempFile(context: Context, uri: Uri, mimeType: String): File? {
    return try {
      val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
      if (inputStream == null) return null

      val extension = when {
        mimeType.startsWith("image/") -> {
          when {
            mimeType.contains("jpeg") || mimeType.contains("jpg") -> ".jpg"
            mimeType.contains("png") -> ".png"
            mimeType.contains("gif") -> ".gif"
            mimeType.contains("webp") -> ".webp"
            else -> ".jpg"
          }
        }
        mimeType.startsWith("video/") -> {
          when {
            mimeType.contains("mp4") -> ".mp4"
            mimeType.contains("webm") -> ".webm"
            mimeType.contains("3gp") -> ".3gp"
            else -> ".mp4"
          }
        }
        else -> ".tmp"
      }

      val tempFile = File.createTempFile("view_intent_", extension, context.cacheDir)
      val outputStream = FileOutputStream(tempFile)
      inputStream.copyTo(outputStream)
      inputStream.close()
      outputStream.close()
      tempFile
    } catch (_: Exception) {
      null
    }
  }
}
