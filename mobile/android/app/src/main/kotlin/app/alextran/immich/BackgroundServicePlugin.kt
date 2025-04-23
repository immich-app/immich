package app.alextran.immich

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.PluginRegistry
import java.security.MessageDigest
import java.io.FileInputStream
import kotlinx.coroutines.*
import androidx.core.net.toUri

/**
 * Android plugin for Dart `BackgroundService` and file trash operations
 */
class BackgroundServicePlugin : FlutterPlugin, MethodChannel.MethodCallHandler, ActivityAware, PluginRegistry.ActivityResultListener {

  private var methodChannel: MethodChannel? = null
  private var fileTrashChannel: MethodChannel? = null
  private var context: Context? = null
  private var pendingResult: Result? = null
  private val permissionRequestCode = 1001
  private var activityBinding: ActivityPluginBinding? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onAttachedToEngine(binding.applicationContext, binding.binaryMessenger)
  }

  private fun onAttachedToEngine(ctx: Context, messenger: BinaryMessenger) {
    context = ctx
    methodChannel = MethodChannel(messenger, "immich/foregroundChannel")
    methodChannel?.setMethodCallHandler(this)

    // Add file trash channel
    fileTrashChannel = MethodChannel(messenger, "file_trash")
    fileTrashChannel?.setMethodCallHandler(this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onDetachedFromEngine()
  }

  private fun onDetachedFromEngine() {
    methodChannel?.setMethodCallHandler(null)
    methodChannel = null
    fileTrashChannel?.setMethodCallHandler(null)
    fileTrashChannel = null
  }

  override fun onMethodCall(call: MethodCall, result: Result) {
    val ctx = context!!
    when (call.method) {
      // Existing BackgroundService methods
      "enable" -> {
        val args = call.arguments<ArrayList<*>>()!!
        ctx.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
          .edit()
          .putBoolean(ContentObserverWorker.SHARED_PREF_SERVICE_ENABLED, true)
          .putLong(BackupWorker.SHARED_PREF_CALLBACK_KEY, args[0] as Long)
          .putString(BackupWorker.SHARED_PREF_NOTIFICATION_TITLE, args[1] as String)
          .apply()
        ContentObserverWorker.enable(ctx, immediate = args[2] as Boolean)
        result.success(true)
      }

      "configure" -> {
        val args = call.arguments<ArrayList<*>>()!!
        val requireUnmeteredNetwork = args[0] as Boolean
        val requireCharging = args[1] as Boolean
        val triggerUpdateDelay = (args[2] as Number).toLong()
        val triggerMaxDelay = (args[3] as Number).toLong()
        ContentObserverWorker.configureWork(
          ctx,
          requireUnmeteredNetwork,
          requireCharging,
          triggerUpdateDelay,
          triggerMaxDelay
        )
        result.success(true)
      }

      "disable" -> {
        ContentObserverWorker.disable(ctx)
        BackupWorker.stopWork(ctx)
        result.success(true)
      }

      "isEnabled" -> {
        result.success(ContentObserverWorker.isEnabled(ctx))
      }

      "isIgnoringBatteryOptimizations" -> {
        result.success(BackupWorker.isIgnoringBatteryOptimizations(ctx))
      }

      "digestFiles" -> {
        val args = call.arguments<ArrayList<String>>()!!
        GlobalScope.launch(Dispatchers.IO) {
          val buf = ByteArray(BUFFER_SIZE)
          val digest: MessageDigest = MessageDigest.getInstance("SHA-1")
          val hashes = arrayOfNulls<ByteArray>(args.size)
          for (i in args.indices) {
            val path = args[i]
            var len = 0
            try {
              val file = FileInputStream(path)
              file.use { assetFile ->
                while (true) {
                  len = assetFile.read(buf)
                  if (len != BUFFER_SIZE) break
                  digest.update(buf)
                }
              }
              digest.update(buf, 0, len)
              hashes[i] = digest.digest()
            } catch (e: Exception) {
              // skip this file
              Log.w(TAG, "Failed to hash file ${args[i]}: $e")
            }
          }
          result.success(hashes.asList())
        }
      }

      // File Trash methods moved from MainActivity
      "moveToTrash" -> {
        val fileName = call.argument<String>("fileName")
        if (fileName != null) {
          if (hasManageStoragePermission()) {
            val success = moveToTrash(fileName)
            result.success(success)
          } else {
            result.error("PERMISSION_DENIED", "Media permission required", null)
          }
        } else {
          result.error("INVALID_NAME", "The file name is not specified.", null)
        }
      }

      "restoreFromTrash" -> {
        val fileName = call.argument<String>("fileName")
        if (fileName != null) {
          if (hasManageStoragePermission()) {
            val success = unTrashImage(fileName)
            result.success(success)
          } else {
            result.error("PERMISSION_DENIED", "Media permission required", null)
          }
        } else {
          result.error("INVALID_NAME", "The file name is not specified.", null)
        }
      }

      "requestManageStoragePermission" -> {
        if (!hasManageStoragePermission()) {
          requestManageMediaPermission(result)
        } else {
          Log.e("Manage storage permission", "Permission already granted")
          result.success(true)
        }
      }

      else -> result.notImplemented()
    }
  }

  private fun hasManageStoragePermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaStore.canManageMedia(context!!);
    } else  {
      false
    }
  }

  private fun requestManageMediaPermission(result: Result) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      pendingResult = result // Store the result callback
      val activity = activityBinding?.activity ?: return

      val intent = Intent(Settings.ACTION_REQUEST_MANAGE_MEDIA)
      intent.data = "package:${activity.packageName}".toUri()
      activity.startActivityForResult(intent, permissionRequestCode)
    } else {
      result.success(false)
    }
  }

  private fun moveToTrash(fileName: String): Boolean {
    val uri = getFileUri(fileName)
    Log.e("FILE_URI", uri.toString())
    return uri?.let { moveToTrash(it) } == true
  }

  private fun moveToTrash(contentUri: Uri): Boolean {
    val contentResolver = context?.contentResolver ?: return false
    return try {
      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.IS_TRASHED, 1) // Move to trash
      }
      val updated = contentResolver.update(contentUri, values, null, null)
      updated > 0
    } catch (e: Exception) {
      Log.e("TrashError", "Error moving to trash", e)
      false
    }
  }

  private fun getFileUri(fileName: String): Uri? {
    val contentResolver = context?.contentResolver ?: return null
    val contentUri = MediaStore.Files.getContentUri("external")
    val projection = arrayOf(MediaStore.Images.Media._ID)
    val selection = "${MediaStore.Images.Media.DISPLAY_NAME} = ?"
    val selectionArgs = arrayOf(fileName)
    var fileUri: Uri? = null

    contentResolver.query(contentUri, projection, selection, selectionArgs, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID))
        fileUri = ContentUris.withAppendedId(contentUri, id)
      }
    }
    return fileUri
  }

  private fun unTrashImage(name: String): Boolean {
    val uri = getTrashedFileUri(name)
    Log.e("FILE_URI", uri.toString())
    return uri?.let { unTrashImage(it) } == true
  }

  private fun unTrashImage(contentUri: Uri): Boolean {
    val contentResolver = context?.contentResolver ?: return false
    return try {
      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.IS_TRASHED, 0) // Restore file
      }
      val updated = contentResolver.update(contentUri, values, null, null)
      updated > 0
    } catch (e: Exception) {
      Log.e("TrashError", "Error restoring file", e)
      false
    }
  }

  private fun getTrashedFileUri(fileName: String): Uri? {
    val contentResolver = context?.contentResolver ?:  return null
    val contentUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)

    val queryArgs = Bundle().apply {
      putString(ContentResolver.QUERY_ARG_SQL_SELECTION, "${MediaStore.Files.FileColumns.DISPLAY_NAME} = ?")
      putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arrayOf(fileName))
      putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
    }

    contentResolver.query(contentUri, projection, queryArgs, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
        return ContentUris.withAppendedId(contentUri, id)
      }
    }
    return null
  }

  // ActivityAware implementation
  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
    binding.addActivityResultListener(this)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activityBinding = binding
    binding.addActivityResultListener(this)
  }

  override fun onDetachedFromActivity() {
    activityBinding?.removeActivityResultListener(this)
    activityBinding = null
  }

  // ActivityResultListener implementation
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    if (requestCode == permissionRequestCode) {
      val granted = hasManageStoragePermission()
      pendingResult?.success(granted)
      pendingResult = null
      return true
    }
    return false
  }
}

private const val TAG = "BackgroundServicePlugin"
private const val BUFFER_SIZE = 2 * 1024 * 1024
