package app.alextran.immich.mediasave

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import io.flutter.embedding.engine.plugins.FlutterPlugin
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MediaSavePlugin : FlutterPlugin, MediaSaveApi {
  private var context: Context? = null
  private val ioScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    MediaSaveApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    MediaSaveApi.setUp(binding.binaryMessenger, null)
    ioScope.cancel()
    context = null
  }

  override fun saveToDownloads(
    filePath: String,
    title: String,
    relativePath: String?,
    callback: (Result<String?>) -> Unit,
  ) {
    val context = context ?: run {
      callback(Result.success(null))
      return
    }

    ioScope.launch {
      try {
        callback(Result.success(insertIntoFiles(context, filePath, title, relativePath)))
      } catch (e: Exception) {
        callback(Result.failure(e))
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
