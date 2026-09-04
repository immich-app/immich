package app.alextran.immich.mediasave

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import app.alextran.immich.core.ImmichPlugin
import io.flutter.embedding.engine.plugins.FlutterPlugin
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MediaSavePlugin : ImmichPlugin(), MediaSaveApi {
  private val lock = Any()
  private var context: Context? = null
  private lateinit var ioScope: CoroutineScope

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    synchronized(lock) {
      super.onAttachedToEngine(binding)
      ioScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
      context = binding.applicationContext
      MediaSaveApi.setUp(binding.binaryMessenger, this)
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    synchronized(lock) {
      super.onDetachedFromEngine(binding)
      MediaSaveApi.setUp(binding.binaryMessenger, null)
      context = null
      ioScope.cancel()
    }
  }

  override fun saveToDownloads(
    filePath: String,
    title: String,
    relativePath: String?,
    callback: (Result<String?>) -> Unit,
  ) {
    val (context, scope) = synchronized(lock) {
      val context = context ?: run {
        completeWhenActive(callback, Result.success(null))
        return
      }
      context to ioScope
    }

    scope.launch {
      val result = try {
        Result.success(insertIntoFiles(context, filePath, title, relativePath))
      } catch (e: Exception) {
        Result.failure(e)
      }
      synchronized(lock) {
        if (scope === ioScope && isActive) {
          completeWhenActive(callback, result)
        }
      }
    }
  }

  // Uses the Files collection, not Images: Images only accepts MIME types the
  // platform knows and rejects raw formats like CR3, while Files accepts any
  // type. The file lands under [relativePath] (Download/Immich), not the gallery.
  private fun insertIntoFiles(
    context: Context,
    filePath: String,
    title: String,
    relativePath: String?,
  ): String? {
    val resolver = context.contentResolver
    val collection = MediaStore.Files.getContentUri("external")
    val source = File(filePath)
    // Anything reaching this fallback is a format the platform can't type, so
    // store it as a generic binary. The file saves and stays openable.
    val mimeType = "application/octet-stream"

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, title)
        put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
        relativePath?.let { put(MediaStore.MediaColumns.RELATIVE_PATH, it) }
        put(MediaStore.MediaColumns.IS_PENDING, 1)
      }
      val uri = resolver.insert(collection, values) ?: return null

      try {
        val out = resolver.openOutputStream(uri)
        if (out == null) {
          resolver.delete(uri, null, null)
          return null
        }
        out.use { source.inputStream().use { input -> input.copyTo(it) } }
        resolver.update(uri, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
        return uri.lastPathSegment
      } catch (e: Exception) {
        resolver.delete(uri, null, null)
        throw e
      }
    }

    val dir = File(Environment.getExternalStorageDirectory(), relativePath ?: Environment.DIRECTORY_DCIM).apply { mkdirs() }
    val target = File(dir, title)
    source.inputStream().use { input -> target.outputStream().use { input.copyTo(it) } }
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, title)
      put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
      @Suppress("DEPRECATION")
      put(MediaStore.MediaColumns.DATA, target.absolutePath)
    }
    return resolver.insert(collection, values)?.lastPathSegment
  }
}
