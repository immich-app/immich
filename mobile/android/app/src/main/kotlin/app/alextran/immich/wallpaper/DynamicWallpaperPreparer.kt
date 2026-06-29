package app.alextran.immich.wallpaper

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.provider.MediaStore.Images
import app.alextran.immich.images.ExifBitmapUtils
import app.alextran.immich.widget.ImmichAPI
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class DynamicWallpaperPreparer(
  private val context: Context,
  private val remoteBitmapLoader: (suspend (String, Int, Int) -> Bitmap)? = null,
  private val localBitmapLoader: (suspend (String, Int, Int) -> Bitmap)? = null,
) {
  suspend fun prepare(assetRefs: List<DynamicWallpaperAssetRef>, force: Boolean): DynamicWallpaperStatus = withContext(Dispatchers.IO) {
    val normalizedAssetRefs = DynamicWallpaperRotation.deduplicateRefsPreservingOrder(assetRefs)
    if (normalizedAssetRefs.isEmpty()) {
      DynamicWallpaperConfigStore.writePreparationErrors(context, emptyMap(), null)
      return@withContext DynamicWallpaperConfigStore.status(context)
    }

    val errors = linkedMapOf<String, String>()
    val metrics = context.resources.displayMetrics
    val targetWidth = metrics.widthPixels.coerceAtLeast(1)
    val targetHeight = metrics.heightPixels.coerceAtLeast(1)

    normalizedAssetRefs.forEach { assetRef ->
      val destination = DynamicWallpaperConfigStore.preparedFile(context, assetRef.remoteId)
      if (!force && destination.isFile) {
        return@forEach
      }

      runCatching {
        val bitmap = loadSourceBitmap(assetRef, targetWidth, targetHeight)
        val prepared = resizeForDisplay(bitmap, targetWidth, targetHeight)
        try {
          writeBitmapAtomically(prepared, destination)
        } finally {
          if (prepared !== bitmap) {
            prepared.recycle()
          }
          bitmap.recycle()
        }
      }.onFailure { error ->
        errors[assetRef.remoteId] = error.message ?: error.javaClass.simpleName
      }
    }

    deleteObsoleteFiles(normalizedAssetRefs)
    DynamicWallpaperConfigStore.writePreparationErrors(
      context,
      errors,
      errors.values.firstOrNull(),
    )
    DynamicWallpaperConfigStore.status(context)
  }

  private suspend fun loadSourceBitmap(assetRef: DynamicWallpaperAssetRef, targetWidth: Int, targetHeight: Int): Bitmap {
    val localId = assetRef.localId
    if (localId != null && !assetRef.isEdited) {
      runCatching {
        localBitmapLoader?.invoke(localId, targetWidth, targetHeight) ?: loadLocalOriginal(localId, targetWidth, targetHeight)
      }.getOrNull()?.let { return it }
    }

    return remoteBitmapLoader?.invoke(assetRef.remoteId, targetWidth, targetHeight)
      ?: loadRemoteOriginal(assetRef.remoteId, targetWidth, targetHeight)
  }

  private fun loadLocalOriginal(localId: String, targetWidth: Int, targetHeight: Int): Bitmap {
    val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, localId.toLong())
    return ExifBitmapUtils.decodeSampledBitmap(context.contentResolver, uri, targetWidth, targetHeight)
      ?: throw IllegalStateException("Invalid local image data for $localId")
  }

  private suspend fun loadRemoteOriginal(remoteId: String, targetWidth: Int, targetHeight: Int): Bitmap {
    val serverConfig = ImmichAPI.getServerConfig(context) ?: throw IllegalStateException("Immich credentials are not available")
    return ImmichAPI(serverConfig).fetchOriginalImage(remoteId, targetWidth, targetHeight)
  }

  private fun resizeForDisplay(bitmap: Bitmap, targetWidth: Int, targetHeight: Int): Bitmap {
    if (bitmap.width <= targetWidth && bitmap.height <= targetHeight) {
      return bitmap
    }

    val scale = maxOf(
      targetWidth.toFloat() / bitmap.width.toFloat(),
      targetHeight.toFloat() / bitmap.height.toFloat(),
    )
    val scaledWidth = (bitmap.width * scale).toInt().coerceAtLeast(1)
    val scaledHeight = (bitmap.height * scale).toInt().coerceAtLeast(1)
    val scaled = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)
    val output = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    val left = (targetWidth - scaledWidth) / 2
    val top = (targetHeight - scaledHeight) / 2

    canvas.drawBitmap(
      scaled,
      Rect(0, 0, scaled.width, scaled.height),
      Rect(left, top, left + scaledWidth, top + scaledHeight),
      paint,
    )

    if (scaled !== bitmap) {
      scaled.recycle()
    }
    return output
  }

  private fun writeBitmapAtomically(bitmap: Bitmap, destination: File) {
    destination.parentFile?.mkdirs()
    val tmp = File(destination.parentFile, "${destination.name}.tmp")
    FileOutputStream(tmp).use { output ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 82, output)
    }

    try {
      Files.move(
        tmp.toPath(),
        destination.toPath(),
        StandardCopyOption.REPLACE_EXISTING,
        StandardCopyOption.ATOMIC_MOVE,
      )
    } catch (_: AtomicMoveNotSupportedException) {
      Files.move(tmp.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
    } finally {
      tmp.delete()
    }
  }

  private fun deleteObsoleteFiles(assetRefs: List<DynamicWallpaperAssetRef>) {
    val expected = assetRefs
      .map { DynamicWallpaperConfigStore.preparedFile(context, it.remoteId).name }
      .toSet()
    DynamicWallpaperConfigStore.preparedDirectory(context)
      .listFiles { file -> file.isFile && file.extension == "jpg" && file.name !in expected }
      ?.forEach { it.delete() }
  }
}
