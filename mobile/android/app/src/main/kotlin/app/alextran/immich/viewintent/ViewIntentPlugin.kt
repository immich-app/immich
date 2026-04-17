package app.alextran.immich.viewintent

import android.app.Activity
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import app.alextran.immich.media.MediaStoreUtils
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
          val fromRelativePath = MediaStoreUtils.resolveLocalIdByRelativePath(context, parsed, mimeType)
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

    return MediaStoreUtils.resolveLocalIdByNameAndSize(context, uri, mimeType)
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
