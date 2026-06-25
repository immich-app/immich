package app.alextran.immich.wallpaper

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import app.alextran.immich.widget.ImmichAPI
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class DynamicWallpaperPreparer(private val context: Context) {
  suspend fun prepare(assetIds: List<String>, force: Boolean): DynamicWallpaperStatus = withContext(Dispatchers.IO) {
    val normalizedAssetIds = DynamicWallpaperRotation.deduplicatePreservingOrder(assetIds)
    if (normalizedAssetIds.isEmpty()) {
      DynamicWallpaperConfigStore.writePreparationErrors(context, emptyMap(), null)
      return@withContext DynamicWallpaperConfigStore.status(context)
    }

    val serverConfig = ImmichAPI.getServerConfig(context)
    if (serverConfig == null) {
      val error = "Immich credentials are not available"
      DynamicWallpaperConfigStore.writePreparationErrors(context, emptyMap(), error)
      return@withContext DynamicWallpaperConfigStore.status(context)
    }

    val api = ImmichAPI(serverConfig)
    val errors = linkedMapOf<String, String>()

    normalizedAssetIds.forEach { assetId ->
      val destination = DynamicWallpaperConfigStore.preparedFile(context, assetId)
      if (!force && destination.isFile) {
        return@forEach
      }

      runCatching {
        val bitmap = api.fetchImage(assetId)
        val prepared = resizeForDisplay(bitmap)
        try {
          writeBitmapAtomically(prepared, destination)
        } finally {
          if (prepared !== bitmap) {
            prepared.recycle()
          }
          bitmap.recycle()
        }
      }.onFailure { error ->
        errors[assetId] = error.message ?: error.javaClass.simpleName
      }
    }

    deleteObsoleteFiles(normalizedAssetIds)
    DynamicWallpaperConfigStore.writePreparationErrors(
      context,
      errors,
      errors.values.firstOrNull(),
    )
    DynamicWallpaperConfigStore.status(context)
  }

  private fun resizeForDisplay(bitmap: Bitmap): Bitmap {
    val metrics = context.resources.displayMetrics
    val targetWidth = metrics.widthPixels.coerceAtLeast(1)
    val targetHeight = metrics.heightPixels.coerceAtLeast(1)

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

  private fun deleteObsoleteFiles(assetIds: List<String>) {
    val expected = assetIds
      .map { DynamicWallpaperConfigStore.preparedFile(context, it).name }
      .toSet()
    DynamicWallpaperConfigStore.preparedDirectory(context)
      .listFiles { file -> file.isFile && file.extension == "jpg" && file.name !in expected }
      ?.forEach { it.delete() }
  }
}
