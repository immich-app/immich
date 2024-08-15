package app.alextran.immich

import android.content.Context
import android.util.Log
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.security.MessageDigest
import java.io.FileInputStream
import kotlinx.coroutines.*

/**
 * Android plugin for Dart `BackgroundService`
 *
 * Receives messages/method calls from the foreground Dart side to manage
 * the background service, e.g. start (enqueue), stop (cancel)
 */
class BackgroundServicePlugin : FlutterPlugin, MethodChannel.MethodCallHandler {

  private var methodChannel: MethodChannel? = null
  private var context: Context? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onAttachedToEngine(binding.applicationContext, binding.binaryMessenger)
  }

  private fun onAttachedToEngine(ctx: Context, messenger: BinaryMessenger) {
    context = ctx
    methodChannel = MethodChannel(messenger, "immich/foregroundChannel")
    methodChannel?.setMethodCallHandler(this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onDetachedFromEngine()
  }

  private fun onDetachedFromEngine() {
    methodChannel?.setMethodCallHandler(null)
    methodChannel = null
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    val ctx = context!!
    when (call.method) {
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

      else -> result.notImplemented()
    }
  }
}

private const val TAG = "BackgroundServicePlugin"
private const val BUFFER_SIZE = 2 * 1024 * 1024;
