package app.alextran.immich.media

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.IntentSender
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
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

@SuppressLint("NewApi", "InlinedApi")
class AssetMediaApiImpl(context: Context) : ImmichPlugin(), AssetMediaApi, ActivityAware {
  private val ctx: Context = context.applicationContext
  private var binaryMessenger: BinaryMessenger? = null
  private var activityBinding: ActivityPluginBinding? = null
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  private val supportsMediaRequest: Boolean
    get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onAttachedToEngine(binding)
    binaryMessenger = binding.binaryMessenger
    AssetMediaApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onDetachedFromEngine(binding)
    scope.cancel()
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

  override fun trash(ids: List<String>, callback: (Result<List<AssetMediaActionResult>>) -> Unit) {
    if (!supportsMediaRequest) {
      return respond(callback, "MEDIA_ACTION_ERROR") { removeAssets(ids) }
    }

    return runMediaTrashRequest(ids, MediaAction.TRASH, callback)
  }

  override fun restore(
    ids: List<String>,
    callback: (Result<List<AssetMediaActionResult>>) -> Unit
  ) {
    if (!supportsMediaRequest) {
      return respond(callback, "MEDIA_ACTION_ERROR") {
        val items = queryMediaItems(ids)
        ids.map {
          AssetMediaActionResult(
            it,
            if (it in items) {
              AssetMediaActionStatus.ALREADY_IN_STATE
            } else {
              AssetMediaActionStatus.NOT_FOUND
            }
          )
        }
      }
    }

    return runMediaTrashRequest(ids, MediaAction.RESTORE, callback)
  }


  private fun runMediaTrashRequest(
    ids: List<String>,
    action: MediaAction,
    callback: (Result<List<AssetMediaActionResult>>) -> Unit,
  ) = respond(callback, "MEDIA_ACTION_ERROR") {
    if (ids.isEmpty()) return@respond emptyList()
    val items = queryMediaItems(ids)

    val targets = ids.mapNotNull { id ->
      val item = items[id] ?: return@mapNotNull null
      val needsAction = when (action) {
        MediaAction.TRASH -> !item.isTrashed
        MediaAction.RESTORE -> item.isTrashed
      }

      if (needsAction) id to item.uri else null
    }.toMap()

    val granted =
      targets.isNotEmpty() && requestConsent(targets.values.toList()) { resolver, uris ->
        MediaStore.createTrashRequest(resolver, uris, action == MediaAction.TRASH).intentSender
      }

    ids.map { id ->
      val status = when (id) {
        in targets -> if (granted) AssetMediaActionStatus.DONE else AssetMediaActionStatus.FAILED
        !in items -> AssetMediaActionStatus.NOT_FOUND
        else -> AssetMediaActionStatus.ALREADY_IN_STATE
      }
      AssetMediaActionResult(id, status)
    }
  }

  override fun delete(ids: List<String>, callback: (Result<List<AssetMediaActionResult>>) -> Unit) =
    respond(callback, "MEDIA_ACTION_ERROR") { removeAssets(ids) }

  private suspend fun removeAssets(ids: List<String>): List<AssetMediaActionResult> {
    if (ids.isEmpty()) return emptyList()

    val items = queryMediaItems(ids)
    val targets = ids.mapNotNull { id -> items[id]?.let { id to it.uri } }.toMap()

    val deleted = if (supportsMediaRequest) {
      deleteViaConsent(targets)
    } else {
      deleteDirectly(targets)
    }

    return ids.map { id ->
      val status = when (id) {
        in deleted -> AssetMediaActionStatus.DONE
        !in items -> AssetMediaActionStatus.NOT_FOUND
        else -> AssetMediaActionStatus.FAILED
      }
      AssetMediaActionResult(id, status)
    }
  }

  private suspend fun deleteViaConsent(targets: Map<String, Uri>): Set<String> {
    if (targets.isEmpty()) {
      return emptySet()
    }

    val granted = requestConsent(targets.values.toList()) { resolver, uris ->
      MediaStore.createDeleteRequest(resolver, uris).intentSender
    }
    return if (granted) targets.keys else emptySet()
  }

  private suspend fun deleteDirectly(targets: Map<String, Uri>): Set<String> =
    withContext(Dispatchers.IO) {
      for (chunk in targets.keys.chunked(MAX_QUERY_ARGS)) {
        ensureActive()
        val placeholders = chunk.joinToString(",") { "?" }
        try {
          ctx.contentResolver.delete(
            filesUri,
            "${MediaStore.Files.FileColumns._ID} IN ($placeholders)",
            chunk.toTypedArray(),
          )
        } catch (_: SecurityException) {
          // The query below fetches the proper count on exception
        }
      }
      val remaining = queryMediaItems(targets.keys.toList()).keys
      targets.keys - remaining
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

  private suspend fun requestConsent(
    uris: List<Uri>,
    buildSender: (ContentResolver, List<Uri>) -> IntentSender,
  ): Boolean = withContext(Dispatchers.Main) {
    val activity = activityBinding?.activity as? ComponentActivity ?: return@withContext false
    val sender = buildSender(ctx.contentResolver, uris)

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
        launcher.launch(IntentSenderRequest.Builder(sender).build())
      } catch (_: Exception) {
        launcher.unregister()
        if (continuation.isActive) {
          continuation.resume(false)
        }
      }
    }
  }

  private val filesUri: Uri
    get() = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)

  private suspend fun queryMediaItems(ids: List<String>): Map<String, MediaItem> =
    withContext(Dispatchers.IO) {
      val numeric = ids.filter { it.toLongOrNull() != null }
      if (numeric.isEmpty()) {
        return@withContext emptyMap()
      }

      val columns = buildList {
        add(MediaStore.Files.FileColumns._ID)
        add(MediaStore.Files.FileColumns.MEDIA_TYPE)
        if (supportsMediaRequest) add(MediaStore.Files.FileColumns.IS_TRASHED)
      }.toTypedArray()

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
            if (supportsMediaRequest) {
              putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_INCLUDE)
            }
          }

          ctx.contentResolver.query(filesUri, columns, args, null)?.use { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
            val typeColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
            val trashedColumn = if (supportsMediaRequest) {
              cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.IS_TRASHED)
            } else {
              -1
            }
            while (cursor.moveToNext()) {
              val id = cursor.getLong(idColumn)
              val uri = mediaContentUri(cursor.getInt(typeColumn), id) ?: continue
              val isTrashed = trashedColumn >= 0 && cursor.getInt(trashedColumn) == 1
              put(id.toString(), MediaItem(uri, isTrashed))
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
