package app.alextran.immich.images

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.provider.MediaStore.Images
import android.provider.MediaStore.Video
import android.util.Size
import java.nio.ByteBuffer
import kotlin.math.*
import java.util.concurrent.Executors
import com.bumptech.glide.Glide
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DecodeFormat
import kotlin.time.TimeSource

class ThumbnailsImpl(context: Context) : ThumbnailApi {
    private val ctx: Context = context.applicationContext
    private val contentResolver: ContentResolver = ctx.contentResolver
    private val threadPool =
        Executors.newFixedThreadPool(max(4, Runtime.getRuntime().availableProcessors()))

    companion object {
        val PROJECTION = arrayOf(
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.Files.FileColumns.MEDIA_TYPE,
        )
        const val SELECTION = "${MediaStore.MediaColumns._ID} = ?"
        val URI: Uri = MediaStore.Files.getContentUri("external")

        const val MEDIA_TYPE_IMAGE = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
        const val MEDIA_TYPE_VIDEO = MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO

        init {
            System.loadLibrary("native_buffer")
        }

        @JvmStatic
        external fun allocateNative(size: Int): Long

        @JvmStatic
        external fun freeNative(pointer: Long)

        @JvmStatic
        external fun wrapAsBuffer(address: Long, capacity: Int): ByteBuffer
    }

    override fun setThumbnailToBuffer(
        assetId: String, width: Long, height: Long, callback: (Result<Map<String, Long>>) -> Unit
    ) {
        threadPool.execute {
            try {
                setThumbnailToBufferInternal(assetId, width, height, callback)
            } catch (e: Exception) {
                callback(Result.failure(e))
            }
        }
    }

    private fun setThumbnailToBufferInternal(
        assetId: String, width: Long, height: Long, callback: (Result<Map<String, Long>>) -> Unit
    ) {
        val targetWidth = width.toInt()
        val targetHeight = height.toInt()

        val cursor = contentResolver.query(URI, PROJECTION, SELECTION, arrayOf(assetId), null)
            ?: return callback(Result.failure(RuntimeException("Asset not found")))

        cursor.use { c ->
            if (!c.moveToNext()) {
                return callback(Result.failure(RuntimeException("Asset not found")))
            }

            val mediaType = c.getInt(1)
            val bitmap = when (mediaType) {
                MEDIA_TYPE_IMAGE -> decodeImage(assetId, targetWidth, targetHeight)
                MEDIA_TYPE_VIDEO -> decodeVideoThumbnail(assetId, targetWidth, targetHeight)
                else -> return callback(Result.failure(RuntimeException("Unsupported media type")))
            }

            val actualWidth = bitmap.width
            val actualHeight = bitmap.height

            val size = actualWidth * actualHeight * 4
            val pointer = allocateNative(size)
            try {
                val buffer = wrapAsBuffer(pointer, size)
                bitmap.copyPixelsToBuffer(buffer)
                bitmap.recycle()
                callback(
                    Result.success(
                        mapOf(
                            "pointer" to pointer,
                            "width" to actualWidth.toLong(),
                            "height" to actualHeight.toLong()
                        )
                    )
                )
            } catch (e: Exception) {
                freeNative(pointer)
                callback(Result.failure(e))
            }
        }
    }

    private fun decodeImage(assetId: String, targetWidth: Int, targetHeight: Int): Bitmap {
        val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, assetId.toLong())

        if (targetHeight <= 768 && targetWidth <= 768) {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentResolver.loadThumbnail(uri, Size(targetWidth, targetHeight), null)
            } else {
                Images.Thumbnails.getThumbnail(
                    contentResolver,
                    assetId.toLong(),
                    Images.Thumbnails.MINI_KIND,
                    BitmapFactory.Options().apply {
                        inPreferredConfig = Bitmap.Config.ARGB_8888
                    }
                )
            }
        }

        return decodeSource(uri, targetWidth, targetHeight)
    }

    private fun decodeVideoThumbnail(assetId: String, targetWidth: Int, targetHeight: Int): Bitmap {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val uri = ContentUris.withAppendedId(Video.Media.EXTERNAL_CONTENT_URI, assetId.toLong())
            contentResolver.loadThumbnail(uri, Size(targetWidth, targetHeight), null)
        } else {
            Video.Thumbnails.getThumbnail(
                contentResolver,
                assetId.toLong(),
                Video.Thumbnails.MINI_KIND,
                BitmapFactory.Options().apply {
                    inPreferredConfig = Bitmap.Config.ARGB_8888
                }
            )
        }
    }

    private fun decodeSource(uri: Uri, targetWidth: Int, targetHeight: Int): Bitmap {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val source = ImageDecoder.createSource(contentResolver, uri)

            ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                val sampleSize =
                    getSampleSize(info.size.width, info.size.height, targetWidth, targetHeight)
                decoder.setTargetSampleSize(sampleSize)
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
            }
        } else {
            Glide.with(ctx)
                .asBitmap()
                .priority(Priority.IMMEDIATE)
                .load(uri)
                .disallowHardwareConfig()
                .format(DecodeFormat.PREFER_ARGB_8888)
                .submit(targetWidth, targetHeight).get()
        }
    }

    private fun getSampleSize(fullWidth: Int, fullHeight: Int, reqWidth: Int, reqHeight: Int): Int {
        return 1 shl max(
            0, floor(
                min(
                    log2(fullWidth / (2.0 * reqWidth)),
                    log2(fullHeight / (2.0 * reqHeight)),
                )
            ).toInt()
        )
    }
}
