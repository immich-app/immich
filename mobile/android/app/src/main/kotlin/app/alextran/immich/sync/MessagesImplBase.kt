package app.alextran.immich.sync

import android.annotation.SuppressLint
import android.content.Context
import android.provider.MediaStore
import java.io.File

sealed class AssetResult {
    data class ValidAsset(val asset: ImAsset, val albumId: String) : AssetResult()
    data class InvalidAsset(val assetId: String) : AssetResult()
}

open class NativeSyncApiImplBase(context: Context) {
    private val ctx: Context = context.applicationContext

    companion object {
        const val MEDIA_SELECTION =
            "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"
        val MEDIA_SELECTION_ARGS = arrayOf(
            MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
            MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
        )
    }

    protected fun getAssets(
        volume: String,
        selection: String,
        selectionArgs: Array<String>,
    ): Sequence<AssetResult> {
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DATA,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.DATE_TAKEN,
            MediaStore.MediaColumns.DATE_ADDED,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.Files.FileColumns.MEDIA_TYPE,
            MediaStore.MediaColumns.BUCKET_ID,
            MediaStore.MediaColumns.DURATION
        )

        return sequence {
            ctx.contentResolver.query(
                MediaStore.Files.getContentUri(volume),
                projection,
                selection,
                selectionArgs,
                null
            )?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
                val dataColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA)
                val nameColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
                val dateTakenColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_TAKEN)
                val dateAddedColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
                val dateModifiedColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)
                val mediaTypeColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
                val bucketIdColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_ID)
                val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idColumn).toString()
                    val path = cursor.getString(dataColumn)
                    if (path.isNullOrBlank() || !File(path).exists()) {
                        yield(AssetResult.InvalidAsset(id))
                        continue
                    }

                    val mediaType = cursor.getInt(mediaTypeColumn)
                    val name = cursor.getString(nameColumn)
                    // Date taken is milliseconds since epoch, Date added is seconds since epoch
                    val createdAt = (cursor.getLong(dateTakenColumn).takeIf { it > 0 }?.div(1000))
                        ?: cursor.getLong(dateAddedColumn)
                    // Date modified is seconds since epoch
                    val modifiedAt = cursor.getLong(dateModifiedColumn)
                    // Duration is milliseconds
                    val duration = if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) 0
                    else cursor.getLong(durationColumn) / 1000
                    val bucketId = cursor.getString(bucketIdColumn)

                    yield(
                        AssetResult.ValidAsset(
                            ImAsset(id, name, mediaType.toLong(), createdAt, modifiedAt, duration),
                            bucketId
                        )
                    )
                }
            }
        }
    }

    @SuppressLint("InlinedApi")
    fun getAlbums(): List<ImAlbum> {
        val albums = mutableListOf<ImAlbum>()
        val albumsCount = mutableMapOf<String, Int>()

        val projection = arrayOf(
            MediaStore.Files.FileColumns.BUCKET_ID,
            MediaStore.Files.FileColumns.BUCKET_DISPLAY_NAME,
            MediaStore.Files.FileColumns.DATE_MODIFIED,
        )
        val selection =
            "(${MediaStore.Files.FileColumns.BUCKET_ID} IS NOT NULL) AND $MEDIA_SELECTION"

        ctx.contentResolver.query(
            MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL),
            projection,
            selection,
            MEDIA_SELECTION_ARGS,
            "${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC"
        )?.use { cursor ->
            val bucketIdColumn =
                cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_ID)
            val bucketNameColumn =
                cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_DISPLAY_NAME)
            val dateModified =
                cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_MODIFIED)

            while (cursor.moveToNext()) {
                val id = cursor.getString(bucketIdColumn)
                val count = albumsCount.getOrDefault(id, 0)
                if (count != 0) {
                    albumsCount[id] = count + 1
                    continue
                }

                val name = cursor.getString(bucketNameColumn)
                val updatedAt = cursor.getLong(dateModified)
                albums.add(ImAlbum(id, name, updatedAt, false, 0))
                albumsCount[id] = 1
            }
        }

        return albums.map { album ->
            val count = albumsCount[album.id] ?: 0
            album.copy(assetCount = count.toLong())
        }
    }
}
