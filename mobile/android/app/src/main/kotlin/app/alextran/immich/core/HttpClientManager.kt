package app.alextran.immich.core

import android.content.Context
import app.alextran.immich.BuildConfig
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import java.io.ByteArrayInputStream
import java.io.File
import java.net.Socket
import java.security.KeyStore
import java.security.Principal
import java.security.PrivateKey
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509KeyManager
import javax.net.ssl.X509TrustManager

const val CERT_ALIAS = "client_cert"
const val USER_AGENT = "Immich_Android_${BuildConfig.VERSION_NAME}"

/**
 * Manages a shared OkHttpClient with SSL configuration support.
 */
object HttpClientManager {
  private const val CACHE_SIZE_BYTES = 100L * 1024 * 1024  // 100MiB
  private const val KEEP_ALIVE_CONNECTIONS = 10
  private const val KEEP_ALIVE_DURATION_MINUTES = 5L
  private const val MAX_REQUESTS_PER_HOST = 64

  private var initialized = false
  private val clientChangedListeners = mutableListOf<() -> Unit>()

  private lateinit var client: OkHttpClient

  private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

  val isMtls: Boolean get() = keyStore.containsAlias(CERT_ALIAS)

  fun initialize(context: Context) {
    if (initialized) return
    synchronized(this) {
      if (initialized) return

      val cacheDir = File(File(context.cacheDir, "okhttp"), "api")
      client = build(cacheDir)
      initialized = true
    }
  }

  fun setKeyEntry(clientData: ByteArray, password: CharArray) {
    synchronized(this) {
      val wasMtls = isMtls
      val tmpKeyStore = KeyStore.getInstance("PKCS12").apply {
        ByteArrayInputStream(clientData).use { stream -> load(stream, password) }
      }
      val tmpAlias = tmpKeyStore.aliases().asSequence().firstOrNull { tmpKeyStore.isKeyEntry(it) }
        ?: throw IllegalArgumentException("No private key found in PKCS12")
      val key = tmpKeyStore.getKey(tmpAlias, password)
      val chain = tmpKeyStore.getCertificateChain(tmpAlias)

      if (wasMtls) {
        keyStore.deleteEntry(CERT_ALIAS)
      }
      keyStore.setKeyEntry(CERT_ALIAS, key, null, chain)
      if (wasMtls != isMtls) {
        clientChangedListeners.forEach { it() }
      }
    }
  }

  fun deleteKeyEntry() {
    synchronized(this) {
      if (!isMtls) {
        return
      }

      keyStore.deleteEntry(CERT_ALIAS)
      clientChangedListeners.forEach { it() }
    }
  }

  @JvmStatic
  fun getClient(): OkHttpClient {
    return client
  }

  fun addClientChangedListener(listener: () -> Unit) {
    synchronized(this) { clientChangedListeners.add(listener) }
  }

  private fun build(cacheDir: File): OkHttpClient {
    val connectionPool = ConnectionPool(
      maxIdleConnections = KEEP_ALIVE_CONNECTIONS,
      keepAliveDuration = KEEP_ALIVE_DURATION_MINUTES,
      timeUnit = TimeUnit.MINUTES
    )

    val managerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    managerFactory.init(null as KeyStore?)
    val trustManager = managerFactory.trustManagers.filterIsInstance<X509TrustManager>().first()

    val sslContext = SSLContext.getInstance("TLS")
      .apply { init(arrayOf(DynamicKeyManager()), arrayOf(trustManager), null) }
    HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)

    return OkHttpClient.Builder()
      .addInterceptor { chain ->
        chain.proceed(chain.request().newBuilder().header("User-Agent", USER_AGENT).build())
      }
      .connectionPool(connectionPool)
      .dispatcher(Dispatcher().apply { maxRequestsPerHost = MAX_REQUESTS_PER_HOST })
      .cache(Cache(cacheDir.apply { mkdirs() }, CACHE_SIZE_BYTES))
      .sslSocketFactory(sslContext.socketFactory, trustManager)
      .build()
  }

  // Reads from the key store rather than taking a snapshot at initialization time
  private class DynamicKeyManager : X509KeyManager {
    override fun getClientAliases(keyType: String, issuers: Array<Principal>?): Array<String>? =
      if (isMtls) arrayOf(CERT_ALIAS) else null

    override fun chooseClientAlias(
      keyTypes: Array<String>,
      issuers: Array<Principal>?,
      socket: Socket?
    ): String? =
      if (isMtls) CERT_ALIAS else null

    override fun getCertificateChain(alias: String): Array<X509Certificate>? =
      keyStore.getCertificateChain(alias)?.map { it as X509Certificate }?.toTypedArray()

    override fun getPrivateKey(alias: String): PrivateKey? =
      keyStore.getKey(alias, null) as? PrivateKey

    override fun getServerAliases(keyType: String, issuers: Array<Principal>?): Array<String>? =
      null

    override fun chooseServerAlias(
      keyType: String,
      issuers: Array<Principal>?,
      socket: Socket?
    ): String? = null
  }
}
