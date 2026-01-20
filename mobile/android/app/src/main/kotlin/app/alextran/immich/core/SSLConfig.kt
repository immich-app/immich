package app.alextran.immich.core

import java.security.KeyStore
import javax.net.ssl.KeyManager
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManager
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

/**
 * Shared SSL configuration for OkHttp and HttpsURLConnection.
 * Stores the SSLSocketFactory and X509TrustManager configured by HttpSSLOptionsPlugin.
 */
object SSLConfig {
  var sslSocketFactory: SSLSocketFactory? = null
    private set

  var trustManager: X509TrustManager? = null
    private set

  var requiresCustomSSL: Boolean = false
    private set

  private val listeners = mutableListOf<() -> Unit>()
  private var configHash: Int = 0

  fun addListener(listener: () -> Unit) {
    listeners.add(listener)
  }

  fun apply(
    keyManagers: Array<KeyManager>?,
    trustManagers: Array<TrustManager>?,
    allowSelfSigned: Boolean,
    serverHost: String?,
    clientCertHash: Int
  ) {
    synchronized(this) {
      val newHash = computeHash(allowSelfSigned, serverHost, clientCertHash)
      val newRequiresCustomSSL = allowSelfSigned || keyManagers != null
      if (newHash == configHash && sslSocketFactory != null && requiresCustomSSL == newRequiresCustomSSL) {
        return  // Config unchanged, skip
      }

      val sslContext = SSLContext.getInstance("TLS")
      sslContext.init(keyManagers, trustManagers, null)
      sslSocketFactory = sslContext.socketFactory
      trustManager = trustManagers?.filterIsInstance<X509TrustManager>()?.firstOrNull()
        ?: getDefaultTrustManager()
      requiresCustomSSL = newRequiresCustomSSL
      configHash = newHash
      notifyListeners()
    }
  }

  private fun computeHash(allowSelfSigned: Boolean, serverHost: String?, clientCertHash: Int): Int {
    var result = allowSelfSigned.hashCode()
    result = 31 * result + (serverHost?.hashCode() ?: 0)
    result = 31 * result + clientCertHash
    return result
  }

  private fun notifyListeners() {
    listeners.forEach { it() }
  }

  private fun getDefaultTrustManager(): X509TrustManager {
    val factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    factory.init(null as KeyStore?)
    return factory.trustManagers.filterIsInstance<X509TrustManager>().first()
  }
}
