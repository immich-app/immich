package app.alextran.immich

import android.content.Context
import android.net.Uri
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

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
        when(call.method) {
            "initialize" -> { // needs to be called prior to any other method
                val args = call.arguments<ArrayList<*>>()!!
                ctx.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .edit().putLong(BackupWorker.SHARED_PREF_CALLBACK_KEY, args.get(0) as Long).apply()
                result.success(true)
            }
            "start" -> {
                val args = call.arguments<ArrayList<*>>()!!
                val immediate = args.get(0) as Boolean
                val keepExisting = args.get(1) as Boolean
                val requireUnmeteredNetwork = args.get(2) as Boolean
                val requireCharging = args.get(3) as Boolean
                val notificationTitle = args.get(4) as String
                ctx.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                    .edit().putString(BackupWorker.SHARED_PREF_NOTIFICATION_TITLE, notificationTitle).apply()
                BackupWorker.startWork(ctx, immediate, keepExisting, requireUnmeteredNetwork, requireCharging)
                result.success(true)
            }
            "stop" -> {
                BackupWorker.stopWork(ctx)
                result.success(true)
            }
            "isEnabled" -> {
                result.success(BackupWorker.isEnabled(ctx))
            }
            "isIgnoringBatteryOptimizations" -> {
                result.success(BackupWorker.isIgnoringBatteryOptimizations(ctx))
            }
            else -> result.notImplemented()
        }
    }
}

private const val TAG = "BackgroundServicePlugin"