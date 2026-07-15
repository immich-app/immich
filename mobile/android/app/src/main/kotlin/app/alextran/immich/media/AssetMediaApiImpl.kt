package app.alextran.immich.media

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import app.alextran.immich.core.ImmichPlugin
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.BinaryMessenger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.UUID
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume

private enum class MediaAction { TRASH, RESTORE }

private data class MediaItem(val uri: Uri, val isTrashed: Boolean)

private const val MAX_QUERY_ARGS = 900

private const val MAX_CONSENT_URIS = 500

@SuppressLint("NewApi", "InlinedApi")
class AssetMediaApiImpl(context: Context) : ImmichPlugin(), AssetMediaApi, ActivityAware {
  private val ctx: Context = context.applicationContext
  private var binaryMessenger: BinaryMessenger? = null
  private var activityBinding: ActivityPluginBinding? = null

  private val supportsMediaRequest: Boolean
    get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onAttachedToEngine(binding)
    binaryMessenger = binding.binaryMessenger
    AssetMediaApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onDetachedFromEngine(binding)
    binaryMessenger?.let { AssetMediaApi.setUp(it, null) }
    binaryMessenger = null
    activityBinding = null
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activityBinding = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activityBinding = binding
  }

  override fun onDetachedFromActivity() {
    activityBinding = null
  }

  override fun trash(ids: List<String>, callback: (Result<List<AssetMediaActionResult>>) -> Unit) =
    runAction(ids, MediaAction.TRASH, callback)

  override fun restore(
    ids: List<String>,
    callback: (Result<List<AssetMediaActionResult>>) -> Unit
  ) =
    runAction(ids, MediaAction.RESTORE, callback)

  override fun trashedAmong(ids: List<String>, callback: (Result<List<String>>) -> Unit) =
    respond(callback, "TRASHED_AMONG_ERROR") {
      if (!supportsMediaRequest) return@respond emptyList()
      val items = queryMediaItems(ids)
      ids.filter { items[it]?.isTrashed == true }
    }

  private fun runAction(
    ids: List<String>,
    action: MediaAction,
    callback: (Result<List<AssetMediaActionResult>>) -> Unit,
  ) = respond(callback, "MEDIA_ACTION_ERROR") {
    if (ids.isEmpty()) return@respond emptyList()
    if (!supportsMediaRequest) {
      return@respond ids.map { AssetMediaActionResult(it, AssetMediaActionStatus.FAILED) }
    }

    val items = queryMediaItems(ids)

    val targets = ids.mapNotNull { id ->
      val item = items[id] ?: return@mapNotNull null
      val needsAction = when (action) {
        MediaAction.TRASH -> !item.isTrashed
        MediaAction.RESTORE -> item.isTrashed
      }

      if (needsAction) id to item.uri else null
    }.toMap()

    val applied = buildMap {
      for (batch in targets.entries.chunked(MAX_CONSENT_URIS)) {
        val result = if (requestConsent(action, batch.map { it.value })) {
          AssetMediaActionStatus.DONE
        } else {
          AssetMediaActionStatus.FAILED
        }
        batch.forEach { put(it.key, result) }
      }
    }

    ids.map { id ->
      val status = when (id) {
        in applied -> applied.getValue(id)
        !in items -> AssetMediaActionStatus.NOT_FOUND
        else -> AssetMediaActionStatus.ALREADY_IN_STATE
      }
      AssetMediaActionResult(id, status)
    }
  }


  private fun <T> respond(callback: (Result<T>) -> Unit, errorCode: String, work: suspend () -> T) {
    scope.launch {
      try {
        completeWhenActive(callback, Result.success(work()))
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        completeWhenActive(callback, Result.failure(FlutterError(errorCode, e.message, null)))
      }
    }
  }

  private suspend fun requestConsent(action: MediaAction, uris: List<Uri>): Boolean =
    withContext(Dispatchers.Main) {
      val activity = activityBinding?.activity as? ComponentActivity ?: return@withContext false
      val resolver = ctx.contentResolver
      val request = when (action) {
        MediaAction.TRASH -> MediaStore.createTrashRequest(resolver, uris, true)
        MediaAction.RESTORE -> MediaStore.createTrashRequest(resolver, uris, false)
      }

      suspendCancellableCoroutine { continuation ->
        val key = "immich_asset_media_api_${UUID.randomUUID()}"
        var launcher: ActivityResultLauncher<IntentSenderRequest>? = null
        launcher = activity.activityResultRegistry.register(
          key,
          ActivityResultContracts.StartIntentSenderForResult()
        ) { result ->
          launcher?.unregister()
          if (continuation.isActive) {
            continuation.resume(result.resultCode == Activity.RESULT_OK)
          }
        }
        continuation.invokeOnCancellation { launcher.unregister() }
        try {
          launcher.launch(IntentSenderRequest.Builder(request.intentSender).build())
        } catch (_: Exception) {
          launcher.unregister()
          if (continuation.isActive) {
            continuation.resume(false)
          }
        }
      }
    }

  private suspend fun queryMediaItems(ids: List<String>): Map<String, MediaItem> =
    withContext(Dispatchers.IO) {
      val numeric = ids.filter { it.toLongOrNull() != null }
      if (numeric.isEmpty()) {
        return@withContext emptyMap()
      }

      buildMap {
        for (chunk in numeric.chunked(MAX_QUERY_ARGS)) {
          ensureActive()
          val placeholders = chunk.joinToString(",") { "?" }
          val args = Bundle().apply {
            putString(
              ContentResolver.QUERY_ARG_SQL_SELECTION,
              "${MediaStore.Files.FileColumns._ID} IN ($placeholders)"
            )
            putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, chunk.toTypedArray())
            putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_INCLUDE)
          }

          ctx.contentResolver.query(
            MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL),
            arrayOf(
              MediaStore.Files.FileColumns._ID,
              MediaStore.Files.FileColumns.MEDIA_TYPE,
              MediaStore.Files.FileColumns.IS_TRASHED,
            ),
            args,
            null,
          )?.use { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
            val typeColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
            val trashedColumn =
              cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.IS_TRASHED)
            while (cursor.moveToNext()) {
              val id = cursor.getLong(idColumn)
              val uri = mediaContentUri(cursor.getInt(typeColumn), id) ?: continue
              put(id.toString(), MediaItem(uri, cursor.getInt(trashedColumn) == 1))
            }
          }
        }
      }
    }

  private fun mediaContentUri(mediaType: Int, id: Long): Uri? = when (mediaType) {
    MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE ->
      ContentUris.withAppendedId(
        MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id
      )

    MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO ->
      ContentUris.withAppendedId(
        MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL),
        id
      )

    else -> null
  }
}
