package app.alextran.immich.wallpaper

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.provider.MediaStore.Images
import app.alextran.immich.images.ExifBitmapUtils
import app.alextran.immich.images.drawBitmapCenterCrop
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
  suspend fun prepare(
    assetRefs: List<DynamicWallpaperAssetRef>,
    force: Boolean,
    forcePrepareIds: Set<String> = emptySet(),
    prepareMissing: Boolean = true,
  ): DynamicWallpaperStatus = withContext(Dispatchers.IO) {
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
      val shouldPrepare = force || assetRef.remoteId in forcePrepareIds || (prepareMissing && !destination.isFile)
      if (!shouldPrepare) {
        return@forEach
      }

      runCatching {
        val bitmap = loadSourceBitmap(assetRef, targetWidth, targetHeight)
        val transformed = transformForDisplay(bitmap, assetRef.normalizedLayoutOrDefault())
        val prepared = resizeForDisplay(transformed, targetWidth, targetHeight)
        try {
          writeBitmapAtomically(prepared, destination)
        } finally {
          if (prepared !== transformed) {
            prepared.recycle()
          }
          if (transformed !== bitmap) {
            transformed.recycle()
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

    drawBitmapCenterCrop(canvas, scaled, paint)

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

  private fun transformForDisplay(bitmap: Bitmap, layout: DynamicWallpaperAssetLayout): Bitmap {
    val rotated = rotateBitmap(bitmap, layout.rotationDegrees)
    val cropped = cropBitmap(rotated, layout)
    if (cropped !== rotated && rotated !== bitmap) {
      rotated.recycle()
    }

    return cropped
  }

  private fun rotateBitmap(bitmap: Bitmap, rotationDegrees: Long): Bitmap {
    val normalizedRotation = (((rotationDegrees % 360) + 360) % 360)
    if (normalizedRotation == 0L) {
      return bitmap
    }

    val matrix = Matrix().apply { postRotate(normalizedRotation.toFloat()) }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun cropBitmap(bitmap: Bitmap, layout: DynamicWallpaperAssetLayout): Bitmap {
    val normalized = layout.normalized()
    if (
      normalized.cropLeft == 0.0 &&
      normalized.cropTop == 0.0 &&
      normalized.cropRight == 1.0 &&
      normalized.cropBottom == 1.0
    ) {
      return bitmap
    }

    val left = (normalized.cropLeft * bitmap.width).toInt().coerceIn(0, bitmap.width - 1)
    val top = (normalized.cropTop * bitmap.height).toInt().coerceIn(0, bitmap.height - 1)
    val right = (normalized.cropRight * bitmap.width).toInt().coerceIn(left + 1, bitmap.width)
    val bottom = (normalized.cropBottom * bitmap.height).toInt().coerceIn(top + 1, bitmap.height)

    return Bitmap.createBitmap(bitmap, left, top, right - left, bottom - top)
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
