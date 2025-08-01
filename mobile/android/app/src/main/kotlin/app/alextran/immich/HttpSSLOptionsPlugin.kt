package app.alextran.immich

import android.annotation.SuppressLint
import android.content.Context
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayInputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.security.KeyStore
import java.security.cert.X509Certificate
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.KeyManager
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLEngine
import javax.net.ssl.SSLSession
import javax.net.ssl.TrustManager
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509ExtendedTrustManager

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
    try {
      when (call.method) {
        "apply" -> {
          val args = call.arguments<ArrayList<*>>()!!

          var km: Array<KeyManager>? = null
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
    } catch (e: Throwable) {
      result.error("error", e.message, null)
    }
  }
}
