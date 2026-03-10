package app.alextran.immich.cloudprovider

import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.database.MatrixCursor
import android.graphics.Point
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.DocumentsContract
import android.provider.DocumentsProvider
import android.util.Log
import app.alextran.immich.R

private const val TAG = "ImmichDocProvider"
private const val ROOT_ID = "immich"
private const val ROOT_DOC_ID = "root"
private const val ALL_PHOTOS_DOC_ID = "all_photos"
private const val ALBUMS_DOC_ID = "albums"
private const val PEOPLE_DOC_ID = "people"
private const val ALBUM_PREFIX = "album:"
private const val PERSON_PREFIX = "person:"
private const val ASSET_PREFIX = "asset:"

class ImmichDocumentProvider : DocumentsProvider() {

  override fun onCreate(): Boolean {
    val ctx = context ?: return false
    ImmichCloudRepository.initialize(ctx)
    return true
  }

  override fun queryRoots(projection: Array<out String>?): Cursor {
    val result = MatrixCursor(resolveRootProjection(projection))

    if (!ImmichCloudRepository.isConfigured) {
      return result
    }

    result.newRow().apply {
      add(DocumentsContract.Root.COLUMN_ROOT_ID, ROOT_ID)
      add(DocumentsContract.Root.COLUMN_DOCUMENT_ID, ROOT_DOC_ID)
      add(DocumentsContract.Root.COLUMN_TITLE, "Immich")
      add(DocumentsContract.Root.COLUMN_SUMMARY, ImmichCloudRepository.getAccountName() ?: "Cloud Photos")
      add(DocumentsContract.Root.COLUMN_ICON, R.mipmap.ic_launcher)
      add(
        DocumentsContract.Root.COLUMN_FLAGS,
        DocumentsContract.Root.FLAG_SUPPORTS_SEARCH or
          DocumentsContract.Root.FLAG_SUPPORTS_IS_CHILD
      )
      add(DocumentsContract.Root.COLUMN_MIME_TYPES, "image/* video/*")
    }

    return result
  }

  override fun queryDocument(documentId: String, projection: Array<out String>?): Cursor {
    val result = MatrixCursor(resolveDocumentProjection(projection))

    when {
      documentId == ROOT_DOC_ID -> {
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, ROOT_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "Immich")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
      }
      documentId == ALL_PHOTOS_DOC_ID -> {
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, ALL_PHOTOS_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "All Photos")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
      }
      documentId == ALBUMS_DOC_ID -> {
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, ALBUMS_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "Albums")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
      }
      documentId == PEOPLE_DOC_ID -> {
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, PEOPLE_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "People")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
      }
      documentId.startsWith(ALBUM_PREFIX) -> {
        val albumId = documentId.removePrefix(ALBUM_PREFIX)
        val albums = ImmichCloudRepository.queryAlbums()
        val album = albums.find { it.id == albumId }
        if (album != null) {
          result.newRow().apply {
            add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, documentId)
            add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, album.displayName)
            add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
            add(DocumentsContract.Document.COLUMN_FLAGS, 0)
            add(DocumentsContract.Document.COLUMN_SIZE, null)
            add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, album.dateTakenMillis)
          }
        }
      }
      documentId.startsWith(PERSON_PREFIX) -> {
        val personId = documentId.removePrefix(PERSON_PREFIX)
        val people = ImmichCloudRepository.queryPeople()
        val person = people.find { it.id == personId }
        if (person != null) {
          result.newRow().apply {
            add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, documentId)
            add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, person.name)
            add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
            add(DocumentsContract.Document.COLUMN_FLAGS, 0)
            add(DocumentsContract.Document.COLUMN_SIZE, null)
            add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
          }
        }
      }
      documentId.startsWith(ASSET_PREFIX) -> {
        val assetId = documentId.removePrefix(ASSET_PREFIX)
        val asset = ImmichCloudRepository.getAssetById(assetId)
        if (asset != null) {
          addAssetRow(result, asset)
        }
      }
    }

    return result
  }

  override fun queryChildDocuments(
    parentDocumentId: String,
    projection: Array<out String>?,
    sortOrder: String?
  ): Cursor {
    val result = MatrixCursor(resolveDocumentProjection(projection))

    when (parentDocumentId) {
      ROOT_DOC_ID -> {
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, ALL_PHOTOS_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "All Photos")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, ALBUMS_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "Albums")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
        result.newRow().apply {
          add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, PEOPLE_DOC_ID)
          add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, "People")
          add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
          add(DocumentsContract.Document.COLUMN_FLAGS, 0)
          add(DocumentsContract.Document.COLUMN_SIZE, null)
          add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
        }
      }
      ALL_PHOTOS_DOC_ID -> {
        val queryResult = ImmichCloudRepository.queryAllAssets(pageSize = 500)
        for (asset in queryResult.assets) {
          addAssetRow(result, asset)
        }
      }
      ALBUMS_DOC_ID -> {
        val albums = ImmichCloudRepository.queryAlbums()
        for (album in albums) {
          result.newRow().apply {
            add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, "$ALBUM_PREFIX${album.id}")
            add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, album.displayName)
            add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
            add(DocumentsContract.Document.COLUMN_FLAGS, 0)
            add(DocumentsContract.Document.COLUMN_SIZE, null)
            add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, album.dateTakenMillis)
          }
        }
      }
      PEOPLE_DOC_ID -> {
        val people = ImmichCloudRepository.queryPeople()
        for (person in people) {
          result.newRow().apply {
            add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, "$PERSON_PREFIX${person.id}")
            add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, person.name)
            add(DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.MIME_TYPE_DIR)
            add(DocumentsContract.Document.COLUMN_FLAGS, 0)
            add(DocumentsContract.Document.COLUMN_SIZE, null)
            add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
          }
        }
      }
      else -> {
        if (parentDocumentId.startsWith(ALBUM_PREFIX)) {
          val albumId = parentDocumentId.removePrefix(ALBUM_PREFIX)
          val queryResult = ImmichCloudRepository.queryAlbumAssets(albumId = albumId, pageSize = 500)
          for (asset in queryResult.assets) {
            addAssetRow(result, asset)
          }
        } else if (parentDocumentId.startsWith(PERSON_PREFIX)) {
          val personId = parentDocumentId.removePrefix(PERSON_PREFIX)
          val queryResult = ImmichCloudRepository.queryPersonAssets(personId = personId, pageSize = 500)
          for (asset in queryResult.assets) {
            addAssetRow(result, asset)
          }
        }
      }
    }

    return result
  }

  override fun openDocument(
    documentId: String,
    mode: String,
    signal: CancellationSignal?
  ): ParcelFileDescriptor? {
    if (!documentId.startsWith(ASSET_PREFIX)) return null
    val assetId = documentId.removePrefix(ASSET_PREFIX)
    return ImmichCloudRepository.openMedia(assetId)
  }

  override fun openDocumentThumbnail(
    documentId: String,
    sizeHint: Point,
    signal: CancellationSignal?
  ): AssetFileDescriptor? {
    if (!documentId.startsWith(ASSET_PREFIX)) return null
    val assetId = documentId.removePrefix(ASSET_PREFIX)
    val fd = ImmichCloudRepository.openPreview(assetId, sizeHint) ?: return null
    return AssetFileDescriptor(fd, 0, AssetFileDescriptor.UNKNOWN_LENGTH)
  }

  override fun querySearchDocuments(
    rootId: String,
    query: String,
    projection: Array<out String>?
  ): Cursor {
    val result = MatrixCursor(resolveDocumentProjection(projection))
    val queryResult = ImmichCloudRepository.queryAllAssets(pageSize = 100)
    for (asset in queryResult.assets) {
      if (asset.mimeType.contains(query, ignoreCase = true) ||
        asset.id.contains(query, ignoreCase = true)
      ) {
        addAssetRow(result, asset)
      }
    }
    return result
  }

  override fun isChildDocument(parentDocumentId: String, documentId: String): Boolean {
    return when {
      parentDocumentId == ROOT_DOC_ID -> {
        documentId == ALL_PHOTOS_DOC_ID || documentId == ALBUMS_DOC_ID || documentId == PEOPLE_DOC_ID
      }
      parentDocumentId == ALL_PHOTOS_DOC_ID -> documentId.startsWith(ASSET_PREFIX)
      parentDocumentId == ALBUMS_DOC_ID -> documentId.startsWith(ALBUM_PREFIX)
      parentDocumentId == PEOPLE_DOC_ID -> documentId.startsWith(PERSON_PREFIX)
      parentDocumentId.startsWith(ALBUM_PREFIX) -> documentId.startsWith(ASSET_PREFIX)
      parentDocumentId.startsWith(PERSON_PREFIX) -> documentId.startsWith(ASSET_PREFIX)
      else -> false
    }
  }

  private fun addAssetRow(cursor: MatrixCursor, asset: ImmichAsset) {
    val extension = mimeTypeToExtension(asset.mimeType)
    val timestamp = java.time.Instant.ofEpochMilli(asset.dateTakenMillis)
      .atZone(java.time.ZoneId.systemDefault())
      .toLocalDateTime()
    val displayName = "${if (asset.isImage) "IMG" else "VID"}_${
      timestamp.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
    }.$extension"

    var flags = DocumentsContract.Document.FLAG_SUPPORTS_THUMBNAIL
    cursor.newRow().apply {
      add(DocumentsContract.Document.COLUMN_DOCUMENT_ID, "$ASSET_PREFIX${asset.id}")
      add(DocumentsContract.Document.COLUMN_DISPLAY_NAME, displayName)
      add(DocumentsContract.Document.COLUMN_MIME_TYPE, asset.mimeType)
      add(DocumentsContract.Document.COLUMN_FLAGS, flags)
      add(DocumentsContract.Document.COLUMN_SIZE, if (asset.sizeBytes > 0) asset.sizeBytes else null)
      add(DocumentsContract.Document.COLUMN_LAST_MODIFIED, asset.dateTakenMillis)
    }
  }

  private fun mimeTypeToExtension(mimeType: String): String {
    return when (mimeType) {
      "image/jpeg" -> "jpg"
      "image/png" -> "png"
      "image/gif" -> "gif"
      "image/webp" -> "webp"
      "image/heic" -> "heic"
      "image/heif" -> "heif"
      "image/avif" -> "avif"
      "image/tiff" -> "tiff"
      "image/bmp" -> "bmp"
      "image/svg+xml" -> "svg"
      "video/mp4" -> "mp4"
      "video/quicktime" -> "mov"
      "video/x-msvideo" -> "avi"
      "video/x-matroska" -> "mkv"
      "video/webm" -> "webm"
      "video/3gpp" -> "3gp"
      else -> mimeType.substringAfterLast("/", "bin")
    }
  }

  companion object {
    private val DEFAULT_ROOT_PROJECTION = arrayOf(
      DocumentsContract.Root.COLUMN_ROOT_ID,
      DocumentsContract.Root.COLUMN_DOCUMENT_ID,
      DocumentsContract.Root.COLUMN_TITLE,
      DocumentsContract.Root.COLUMN_SUMMARY,
      DocumentsContract.Root.COLUMN_ICON,
      DocumentsContract.Root.COLUMN_FLAGS,
      DocumentsContract.Root.COLUMN_MIME_TYPES
    )

    private val DEFAULT_DOCUMENT_PROJECTION = arrayOf(
      DocumentsContract.Document.COLUMN_DOCUMENT_ID,
      DocumentsContract.Document.COLUMN_DISPLAY_NAME,
      DocumentsContract.Document.COLUMN_MIME_TYPE,
      DocumentsContract.Document.COLUMN_FLAGS,
      DocumentsContract.Document.COLUMN_SIZE,
      DocumentsContract.Document.COLUMN_LAST_MODIFIED
    )

    private fun resolveRootProjection(projection: Array<out String>?): Array<out String> {
      return projection ?: DEFAULT_ROOT_PROJECTION
    }

    private fun resolveDocumentProjection(projection: Array<out String>?): Array<out String> {
      return projection ?: DEFAULT_DOCUMENT_PROJECTION
    }
  }
}
