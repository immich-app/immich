package app.alextran.immich

import android.content.Context
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
        when (call.method) {
            "enable" -> {
                val args = call.arguments<ArrayList<*>>()!!
                ctx.getSharedPreferences(BackupWorker.SHARED_PREF_NAME, Context.MODE_PRIVATE)
                        .edit()
                        .putBoolean(ContentObserverWorker.SHARED_PREF_SERVICE_ENABLED, true)
                        .putLong(BackupWorker.SHARED_PREF_CALLBACK_KEY, args.get(0) as Long)
                        .putString(BackupWorker.SHARED_PREF_NOTIFICATION_TITLE, args.get(1) as String)
                        .apply()
                ContentObserverWorker.enable(ctx, immediate = args.get(2) as Boolean)
                result.success(true)
            }
            "configure" -> {
                val args = call.arguments<ArrayList<*>>()!!
                val requireUnmeteredNetwork = args.get(0) as Boolean
                val requireCharging = args.get(1) as Boolean
                val triggerUpdateDelay = (args.get(2) as Number).toLong()
                val triggerMaxDelay = (args.get(3) as Number).toLong()
                ContentObserverWorker.configureWork(ctx, requireUnmeteredNetwork, requireCharging, triggerUpdateDelay, triggerMaxDelay)
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
            else -> result.notImplemented()
        }
    }
}

private const val TAG = "BackgroundServicePlugin"