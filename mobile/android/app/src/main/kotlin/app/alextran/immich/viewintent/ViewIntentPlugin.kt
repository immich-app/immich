package app.alextran.immich.viewintent

import android.app.Activity
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import android.util.Log
import android.webkit.MimeTypeMap
import app.alextran.immich.media.MediaStoreUtils
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.PluginRegistry
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

private const val TAG = "ViewIntentPlugin"

class ViewIntentPlugin : FlutterPlugin, ActivityAware, PluginRegistry.NewIntentListener, ViewIntentHostApi {
  private var context: Context? = null
  private var activity: Activity? = null
  private var pendingIntent: Intent? = null
  private val ioScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    ViewIntentHostApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    ViewIntentHostApi.setUp(binding.binaryMessenger, null)
    ioScope.cancel()
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

    ioScope.launch {
      try {
        val mimeType = MediaStoreUtils.resolveMimeType(context, uri, intent.type)
        if (mimeType == null || (!mimeType.startsWith("image/") && !mimeType.startsWith("video/"))) {
          callback(Result.success(null))
          return@launch
        }

        val localAssetId = extractLocalAssetId(context, uri, mimeType)
        val tempFilePath = if (localAssetId == null) {
          copyUriToTempFile(context, uri, mimeType)?.absolutePath ?: run {
            callback(Result.success(null))
            return@launch
          }
        } else {
          null
        }
        val payload = ViewIntentPayload(
          path = tempFilePath,
          mimeType = mimeType,
          localAssetId = localAssetId,
        )
        consumeViewIntent(intent)
        callback(Result.success(payload))
      } catch (e: Exception) {
        callback(Result.failure(e))
      }
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

    val fromDocumentUri = tryExtractDocumentLocalAssetId(context, uri, mimeType)
    if (fromDocumentUri != null) {
      return fromDocumentUri
    }

    val fromContentUri = tryParseContentUriId(uri)
    if (fromContentUri != null) {
      return fromContentUri
    }

    val fromPathSegment = tryParseLastPathSegmentId(uri)
    if (fromPathSegment != null) {
      return fromPathSegment
    }

    return MediaStoreUtils.resolveLocalIdByNameAndSize(context, uri, mimeType)
  }

  private fun tryExtractDocumentLocalAssetId(context: Context, uri: Uri, mimeType: String): String? {
    try {
      if (!DocumentsContract.isDocumentUri(context, uri)) {
        return null
      }

      val docId = DocumentsContract.getDocumentId(uri)
      if (docId.startsWith("raw:")) {
        return null
      }

      if (docId.isBlank()) {
        return null
      }

      val parsed = docId.substringAfter(':', docId)
      if (parsed.all(Char::isDigit)) {
        return parsed
      }

      return MediaStoreUtils.resolveLocalIdByRelativePath(context, parsed, mimeType)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to resolve local asset id from document URI: $uri", e)
      return null
    }
  }

  private fun tryParseContentUriId(uri: Uri): String? {
    return try {
      val parsed = ContentUris.parseId(uri)
      if (parsed >= 0) parsed.toString() else null
    } catch (e: Exception) {
      Log.w(TAG, "Failed to parse local asset id from content URI: $uri", e)
      null
    }
  }

  private fun tryParseLastPathSegmentId(uri: Uri): String? {
    val segment = uri.lastPathSegment ?: return null
    return if (segment.all(Char::isDigit)) segment else null
  }

  private fun copyUriToTempFile(context: Context, uri: Uri, mimeType: String): File? {
    return try {
      val normalizedMimeType = mimeType.substringBefore(';').lowercase()
      val mimeTypeExtension = MimeTypeMap
        .getSingleton()
        .getExtensionFromMimeType(normalizedMimeType)
        ?.let { ".$it" }

      val extension = when {
        normalizedMimeType.startsWith("image/") -> {
          when {
            normalizedMimeType.contains("jpeg") || normalizedMimeType.contains("jpg") -> ".jpg"
            normalizedMimeType.contains("png") -> ".png"
            normalizedMimeType.contains("gif") -> ".gif"
            normalizedMimeType.contains("webp") -> ".webp"
            else -> mimeTypeExtension ?: ".jpg"
          }
        }
        normalizedMimeType.startsWith("video/") -> {
          when {
            normalizedMimeType.contains("mp4") -> ".mp4"
            normalizedMimeType.contains("webm") -> ".webm"
            normalizedMimeType.contains("3gp") -> ".3gp"
            else -> mimeTypeExtension ?: ".mp4"
          }
        }
        else -> mimeTypeExtension ?: ".tmp"
      }

      val tempFile = File.createTempFile("view_intent_", extension, context.cacheDir)
      context.contentResolver.openInputStream(uri)?.use { inputStream ->
        FileOutputStream(tempFile).use { outputStream ->
          inputStream.copyTo(outputStream)
        }
      } ?: return null
      tempFile
    } catch (_: Exception) {
      null
    }
  }
}
