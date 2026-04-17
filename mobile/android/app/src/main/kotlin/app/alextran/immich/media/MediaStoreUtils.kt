package app.alextran.immich.media

import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.provider.OpenableColumns

object MediaStoreUtils {
  private fun externalFilesUri(): Uri =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    } else {
      MediaStore.Files.getContentUri("external")
    }

  fun contentUriForMimeType(mimeType: String): Uri =
    when {
      mimeType.startsWith("image/") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      mimeType.startsWith("video/") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      mimeType.startsWith("audio/") -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      else -> externalFilesUri()
    }

  fun contentUriForAssetType(type: Int): Uri =
    when (type) {
      // same order as AssetType from dart
      1 -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      2 -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      3 -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      else -> externalFilesUri()
    }

  fun resolveLocalIdByRelativePath(context: Context, path: String, mimeType: String): String? {
    val fileName = path.substringAfterLast('/', missingDelimiterValue = path)
    val parent = path.substringBeforeLast('/', "").let { if (it.isEmpty()) "" else "$it/" }
    if (fileName.isBlank()) return null

    val (selection, args) =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        "${MediaStore.MediaColumns.DISPLAY_NAME}=? AND ${MediaStore.MediaColumns.RELATIVE_PATH}=?" to arrayOf(fileName, parent)
      } else {
        "${MediaStore.MediaColumns.DISPLAY_NAME}=?" to arrayOf(fileName)
      }

    return queryLatestId(
      context = context,
      tableUri = contentUriForMimeType(mimeType),
      selection = selection,
      selectionArgs = args,
    )
  }

  fun resolveLocalIdByNameAndSize(context: Context, uri: Uri, mimeType: String): String? {
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

    return queryLatestId(
      context = context,
      tableUri = contentUriForMimeType(mimeType),
      selection = "${MediaStore.MediaColumns.DISPLAY_NAME}=? AND ${MediaStore.MediaColumns.SIZE}=?",
      selectionArgs = arrayOf(displayName, size.toString()),
    )
  }

  private fun queryLatestId(
    context: Context,
    tableUri: Uri,
    selection: String,
    selectionArgs: Array<String>,
  ): String? {
    return try {
      context.contentResolver
        .query(
          tableUri,
          arrayOf(MediaStore.MediaColumns._ID),
          selection,
          selectionArgs,
          "${MediaStore.MediaColumns.DATE_MODIFIED} DESC",
        )?.use { cursor ->
          if (!cursor.moveToFirst()) return null
          val idIndex = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
          if (idIndex < 0) return null
          cursor.getLong(idIndex).toString()
        }
    } catch (_: Exception) {
      null
    }
  }
}
