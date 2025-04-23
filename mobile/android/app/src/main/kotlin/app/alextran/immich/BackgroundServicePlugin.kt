package app.alextran.immich

import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
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
  private val trashRequestCode = 1002
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
        val mediaUrls = call.argument<List<String>>("mediaUrls")
        if (mediaUrls != null) {
          if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) && hasManageMediaPermission()) {
              moveToTrash(mediaUrls, result)
          } else {
            result.error("PERMISSION_DENIED", "Media permission required", null)
          }
        } else {
          result.error("INVALID_NAME", "The mediaUrls is not specified.", null)
        }
      }

      "restoreFromTrash" -> {
        val fileName = call.argument<String>("fileName")
        val type = call.argument<Int>("type")
        if (fileName != null && type != null) {
          if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) && hasManageMediaPermission()) {
            restoreFromTrash(fileName, type, result)
          } else {
            result.error("PERMISSION_DENIED", "Media permission required", null)
          }
        } else {
          result.error("INVALID_NAME", "The file name is not specified.", null)
        }
      }

      "requestManageMediaPermission" -> {
        if (!hasManageMediaPermission()) {
          requestManageMediaPermission(result)
        } else {
          Log.e("Manage storage permission", "Permission already granted")
          result.success(true)
        }
      }

      else -> result.notImplemented()
    }
  }

  private fun hasManageMediaPermission(): Boolean {
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

  @RequiresApi(Build.VERSION_CODES.R)
  private fun moveToTrash(mediaUrls: List<String>, result: Result) {
    val urisToTrash = mediaUrls.map { it.toUri() }
    if (urisToTrash.isEmpty()) {
      result.error("INVALID_ARGS", "No valid URIs provided", null)
      return
    }

    toggleTrash(urisToTrash, true, result);
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun restoreFromTrash(name: String, type: Int, result: Result) {
    val uri = getTrashedFileUri(name, type)
    if (uri == null) {
      Log.e("TrashError", "Asset Uri cannot be found obtained")
      result.error("TrashError", "Asset Uri cannot be found obtained", null)
      return
    }
    Log.e("FILE_URI", uri.toString())
    uri.let { toggleTrash(listOf(it), false, result) }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun toggleTrash(contentUris: List<Uri>, isTrashed: Boolean, result: Result) {
      val activity = activityBinding?.activity
      val contentResolver = context?.contentResolver
      if (activity == null || contentResolver == null) {
        result.error("TrashError", "Activity or ContentResolver not available", null)
        return
      }

      try {
        val pendingIntent = MediaStore.createTrashRequest(contentResolver, contentUris, isTrashed)
        pendingResult = result // Store for onActivityResult
        activity.startIntentSenderForResult(
          pendingIntent.intentSender,
          trashRequestCode,
          null, 0, 0, 0
        )
      } catch (e: Exception) {
        Log.e("TrashError", "Error creating or starting trash request", e)
        result.error("TrashError", "Error creating or starting trash request", null)
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun getTrashedFileUri(fileName: String, type: Int): Uri? {
    val contentResolver = context?.contentResolver ?: return null
    val queryUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)

    val queryArgs = Bundle().apply {
      putString(
        ContentResolver.QUERY_ARG_SQL_SELECTION,
        "${MediaStore.Files.FileColumns.DISPLAY_NAME} = ?"
      )
      putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arrayOf(fileName))
      putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
    }

    contentResolver.query(queryUri, projection, queryArgs, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
        // same order as AssetType from dart
        val contentUri = when (type) {
          1 -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
          2 -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
          3 -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
          else -> queryUri
        }
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
      val granted = hasManageMediaPermission()
      pendingResult?.success(granted)
      pendingResult = null
      return true
    }

    if (requestCode == trashRequestCode) {
      val approved = resultCode == Activity.RESULT_OK
      pendingResult?.success(approved)
      pendingResult = null
      return true
    }
    return false
  }
}

private const val TAG = "BackgroundServicePlugin"
private const val BUFFER_SIZE = 2 * 1024 * 1024
