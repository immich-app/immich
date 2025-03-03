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
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.KeyManager
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLEngine
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
    when (call.method) {
      "apply" -> {
        val args = call.arguments<ArrayList<*>>()!!

        var tm: Array<TrustManager>? = null
        if (args[0] as Boolean) {
          tm = arrayOf(AllowSelfSignedTrustManager(args[1] as String))
        }

        var km: Array<KeyManager>? = null
        if (args[2] != null) {
          val cert = ByteArrayInputStream(args[2] as ByteArray)
          val password = (args[3] as String).toCharArray()
          val keyStore = KeyStore.getInstance("PKCS12")
          keyStore.load(cert, password)
          val keyManagerFactory =
            KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
          keyManagerFactory.init(keyStore, null)
          km = keyManagerFactory.keyManagers
        }

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(km, tm, null)
        HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)

        result.success(true)
      }

      else -> result.notImplemented()
    }
  }

  @SuppressLint("CustomX509TrustManager")
  class AllowSelfSignedTrustManager(private val host: String?) : X509ExtendedTrustManager() {
    private val defaultTrustManager: X509ExtendedTrustManager = getDefaultTrustManager()

    override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) =
      defaultTrustManager.checkClientTrusted(chain, authType)

    override fun checkClientTrusted(
      chain: Array<out X509Certificate>?, authType: String?, socket: Socket?
    ) = defaultTrustManager.checkClientTrusted(chain, authType, socket)

    override fun checkClientTrusted(
      chain: Array<out X509Certificate>?, authType: String?, engine: SSLEngine?
    ) = defaultTrustManager.checkClientTrusted(chain, authType, engine)

    override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {
      if (host == null) return
      defaultTrustManager.checkServerTrusted(chain, authType)
    }

    override fun checkServerTrusted(
      chain: Array<out X509Certificate>?, authType: String?, socket: Socket?
    ) {
      if (host == null) return
      val socketAddress = socket?.remoteSocketAddress
      if (socketAddress is InetSocketAddress && socketAddress.hostName == host) return
      defaultTrustManager.checkServerTrusted(chain, authType, socket)
    }

    override fun checkServerTrusted(
      chain: Array<out X509Certificate>?, authType: String?, engine: SSLEngine?
    ) {
      if (host == null || engine?.peerHost == host) return
      defaultTrustManager.checkServerTrusted(chain, authType, engine)
    }

    override fun getAcceptedIssuers(): Array<X509Certificate> = defaultTrustManager.acceptedIssuers

    private fun getDefaultTrustManager(): X509ExtendedTrustManager {
      val factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
      factory.init(null as KeyStore?)
      return factory.trustManagers.filterIsInstance<X509ExtendedTrustManager>().first()
    }
  }
}
