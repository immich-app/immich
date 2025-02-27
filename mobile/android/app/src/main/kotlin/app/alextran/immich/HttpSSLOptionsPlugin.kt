package app.alextran.immich

import android.content.Context
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayInputStream
import java.security.KeyStore
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.KeyManager
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext

/**
 * Android plugin for Dart `HttpSSLOptions`
 */
class HttpSSLOptionsPlugin : FlutterPlugin, MethodChannel.MethodCallHandler {

  private var methodChannel: MethodChannel? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onAttachedToEngine(binding.applicationContext, binding.binaryMessenger)
  }

  private fun onAttachedToEngine(ctx: Context, messenger: BinaryMessenger) {
    methodChannel = MethodChannel(messenger, "immich/httpSSLOptions")
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
    when (call.method) {
      "apply" -> {
        var km: Array<KeyManager>? = null
        val args = call.arguments<ArrayList<*>>()!!
        if (args[0] != null) {
          val cert = ByteArrayInputStream(args[0] as ByteArray)
          val password = (args[1] as String).toCharArray()
          val keyStore = KeyStore.getInstance("PKCS12")
          keyStore.load(cert, password)
          val keyManagerFactory =
            KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
          keyManagerFactory.init(keyStore, null)
          km = keyManagerFactory.keyManagers
        }

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(km, null, null)
        HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)

        result.success(true)
      }

      else -> result.notImplemented()
    }
  }
}
