package app.alextran.immich

import android.annotation.SuppressLint
import android.content.Context
import android.security.KeyChain
import android.security.KeyChainException
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayInputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.security.KeyStore
import java.security.Principal
import java.security.PrivateKey
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
import javax.net.ssl.X509KeyManager

/**
 * Android plugin for Dart `HttpSSLOptions`
 */
class HttpSSLOptionsPlugin : FlutterPlugin, MethodChannel.MethodCallHandler {
  private var methodChannel: MethodChannel? = null
  private var context: Context? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onAttachedToEngine(binding.applicationContext, binding.binaryMessenger)
  }

  private fun onAttachedToEngine(ctx: Context, messenger: BinaryMessenger) {
    context = ctx
    methodChannel = MethodChannel(messenger, "immich/httpSSLOptions")
    methodChannel?.setMethodCallHandler(this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    onDetachedFromEngine()
  }

  private fun onDetachedFromEngine() {
    methodChannel?.setMethodCallHandler(null)
    methodChannel = null
    context = null
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    try {
      when (call.method) {
        "apply" -> {
          val args = call.arguments<ArrayList<*>>()!!

          var tm: Array<TrustManager>? = null
          if (args[0] as Boolean) {
            tm = arrayOf(AllowSelfSignedTrustManager(args[1] as? String))
          }

          // var km: Array<KeyManager>? = null
          // if (args[2] != null) {
          //   val cert = ByteArrayInputStream(args[2] as ByteArray)
          //   val password = (args[3] as String).toCharArray()
          //   val keyStore = KeyStore.getInstance("PKCS12")
          //   keyStore.load(cert, password)
          //   val keyManagerFactory =
          //     KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
          //   keyManagerFactory.init(keyStore, null)
          //   km = keyManagerFactory.keyManagers
          // }

          // val sslContext = SSLContext.getInstance("TLS")
          // sslContext.init(km, tm, null)
          // HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)

          // HttpsURLConnection.setDefaultHostnameVerifier(AllowSelfSignedHostnameVerifier(args[1] as? String))

          result.success(true)
        }
        
        "applyWithUserCertificates" -> {
          // val args = call.arguments<ArrayList<*>>()!!
          // val serverHost = args[0] as? String
          // val allowSelfSigned = args[1] as Boolean

          // var tm: Array<TrustManager>? = null
          // if (allowSelfSigned) {
          //   tm = arrayOf(AllowSelfSignedTrustManager(serverHost))
          // } else {
          //   // Use system trust store with user certificates
          //   tm = createSystemTrustManagers()
          // }

          // // Create key managers that can access user certificates
          // val km = createUserKeyManagers()

          // val sslContext = SSLContext.getInstance("TLS")
          // sslContext.init(km, tm, null)
          // HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)

          // HttpsURLConnection.setDefaultHostnameVerifier(AllowSelfSignedHostnameVerifier(serverHost))

          result.success(true)
        }
        
        "getAvailableCertificates" -> {
          try {
            val certificates = getAvailableUserCertificates()
            result.success(certificates)
          } catch (e: Exception) {
            result.error("CERT_ERROR", e.message, null)
          }
        }

        else -> result.notImplemented()
      }
    } catch (e: Throwable) {
      result.error("error", e.message, null)
    }
  }

  @SuppressLint("CustomX509TrustManager")
  class AllowSelfSignedTrustManager(private val serverHost: String?) : X509ExtendedTrustManager() {
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
      if (serverHost == null) return
      defaultTrustManager.checkServerTrusted(chain, authType)
    }

    override fun checkServerTrusted(
      chain: Array<out X509Certificate>?, authType: String?, socket: Socket?
    ) {
      if (serverHost == null) return
      val socketAddress = socket?.remoteSocketAddress
      if (socketAddress is InetSocketAddress && socketAddress.hostName == serverHost) return
      defaultTrustManager.checkServerTrusted(chain, authType, socket)
    }

    override fun checkServerTrusted(
      chain: Array<out X509Certificate>?, authType: String?, engine: SSLEngine?
    ) {
      if (serverHost == null || engine?.peerHost == serverHost) return
      defaultTrustManager.checkServerTrusted(chain, authType, engine)
    }

    override fun getAcceptedIssuers(): Array<X509Certificate> = defaultTrustManager.acceptedIssuers

    private fun getDefaultTrustManager(): X509ExtendedTrustManager {
      val factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
      factory.init(null as KeyStore?)
      return factory.trustManagers.filterIsInstance<X509ExtendedTrustManager>().first()
    }
  }

  class AllowSelfSignedHostnameVerifier(private val serverHost: String?) : HostnameVerifier {
    companion object {
      private val _defaultHostnameVerifier = HttpsURLConnection.getDefaultHostnameVerifier()
    }

    override fun verify(hostname: String?, session: SSLSession?): Boolean {
      if (serverHost == null || hostname == serverHost) {
        return true
      } else {
        return _defaultHostnameVerifier.verify(hostname, session)
      }
    }
  }

  /**
   * Creates trust managers that use the system trust store including user-installed certificates
   */
  private fun createSystemTrustManagers(): Array<TrustManager> {
    val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    
    // Use AndroidKeyStore which includes user-installed certificates
    val keyStore = KeyStore.getInstance("AndroidKeyStore")
    keyStore.load(null)
    
    trustManagerFactory.init(keyStore)
    return trustManagerFactory.trustManagers
  }

  /**
   * Creates key managers that can access user certificates from the Android KeyChain
   */
  private fun createUserKeyManagers(): Array<KeyManager>? {
    return try {
      val ctx = context ?: return null
      // Create a key manager that can access certificates from KeyChain
      arrayOf(UserCertificateKeyManager(ctx))
    } catch (e: Exception) {
      null
    }
  }

  /**
   * Gets available user certificates from the Android KeyChain
   */
  private fun getAvailableUserCertificates(): List<Map<String, String>> {
    val certificates = mutableListOf<Map<String, String>>()
    
    try {
      // This would require implementing certificate enumeration
      // For now, return empty list as KeyChain doesn't provide direct enumeration
      // In a real implementation, you might need to use KeyChain.choosePrivateKeyAlias
      // with a callback to let the user select certificates
    } catch (e: Exception) {
      // Log error but don't fail
    }
    
    return certificates
  }

  /**
   * Custom KeyManager that can access user certificates from Android KeyChain
   */
  private inner class UserCertificateKeyManager(private val context: Context) : X509KeyManager {
    override fun chooseClientAlias(
      keyTypes: Array<out String>?,
      issuers: Array<out Principal>?,
      socket: Socket?
    ): String? {
      // This would need to be implemented to prompt user for certificate selection
      // For now, return null to let the system handle it
      return null
    }

    override fun chooseServerAlias(
      keyType: String?,
      issuers: Array<out Principal>?,
      socket: Socket?
    ): String? {
      return null
    }

    override fun getCertificateChain(alias: String?): Array<X509Certificate>? {
      return try {
        // Retrieve certificate chain from KeyChain
        if (alias != null) {
          KeyChain.getCertificateChain(context, alias)
        } else {
          null
        }
      } catch (e: KeyChainException) {
        null
      }
    }

    override fun getPrivateKey(alias: String?): PrivateKey? {
      return try {
        // Retrieve private key from KeyChain
        if (alias != null) {
          KeyChain.getPrivateKey(context, alias)
        } else {
          null
        }
      } catch (e: KeyChainException) {
        null
      }
    }

    override fun getClientAliases(
      keyType: String?,
      issuers: Array<out Principal>?
    ): Array<String>? {
      return null
    }

    override fun getServerAliases(
      keyType: String?,
      issuers: Array<out Principal>?
    ): Array<String>? {
      return null
    }
  }
}
