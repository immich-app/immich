package app.alextran.immich.core

import android.content.Context
import android.content.SharedPreferences
import android.security.KeyChain
import androidx.annotation.OptIn
import androidx.core.content.edit
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.ResolvingDataSource
import androidx.media3.datasource.cronet.CronetDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import app.alextran.immich.BuildConfig
import app.alextran.immich.NativeBuffer
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.Credentials
import okhttp3.Dispatcher
import okhttp3.Headers
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import org.chromium.net.CronetEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.ByteArrayInputStream
import java.io.File
import java.io.IOException
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.attribute.BasicFileAttributes
import java.net.Authenticator
import java.net.CookieHandler
import java.net.PasswordAuthentication
import java.net.Socket
import java.net.URI
import java.security.KeyStore
import java.security.Principal
import java.security.PrivateKey
import java.security.cert.X509Certificate
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509KeyManager
import javax.net.ssl.X509TrustManager

const val USER_AGENT = "immich-android/${BuildConfig.VERSION_NAME}"
private const val CERT_ALIAS = "client_cert"
private const val PREFS_NAME = "immich.ssl"
private const val PREFS_CERT_ALIAS = "immich.client_cert"
private const val PREFS_HEADERS = "immich.request_headers"
private const val PREFS_SERVER_URLS = "immich.server_urls"
private const val PREFS_COOKIES = "immich.cookies"
private const val COOKIE_EXPIRY_DAYS = 400L

private enum class AuthCookie(val cookieName: String, val httpOnly: Boolean) {
  ACCESS_TOKEN("immich_access_token", httpOnly = true),
  IS_AUTHENTICATED("immich_is_authenticated", httpOnly = false),
  AUTH_TYPE("immich_auth_type", httpOnly = true);

  companion object {
    val names = entries.map { it.cookieName }.toSet()
  }
}

/**
 * Manages a shared OkHttpClient with SSL configuration support.
 */
object HttpClientManager {
  private const val CACHE_SIZE_BYTES = 100L * 1024 * 1024  // 100MiB
  const val MEDIA_CACHE_SIZE_BYTES = 1024L * 1024 * 1024  // 1GiB
  private const val KEEP_ALIVE_CONNECTIONS = 10
  private const val KEEP_ALIVE_DURATION_MINUTES = 5L
  private const val MAX_REQUESTS_PER_HOST = 64

  private var initialized = false
  private val clientChangedListeners = mutableListOf<() -> Unit>()

  private lateinit var client: OkHttpClient
  private lateinit var appContext: Context
  private lateinit var prefs: SharedPreferences

  var cronetEngine: CronetEngine? = null
    private set
  private lateinit var cronetStorageDir: File
  val cronetExecutor: ExecutorService = Executors.newFixedThreadPool(4)

  private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

  var keyChainAlias: String? = null
    private set

  var headers: Headers = Headers.headersOf()
    private set

  private val cookieJar = PersistentCookieJar()

  val isMtls: Boolean get() = keyChainAlias != null || keyStore.containsAlias(CERT_ALIAS)

  fun initialize(context: Context) {
    if (initialized) return
    synchronized(this) {
      if (initialized) return

      appContext = context.applicationContext
      prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      keyChainAlias = prefs.getString(PREFS_CERT_ALIAS, null)

      cookieJar.init(prefs)
      System.setProperty("http.agent", USER_AGENT)
      Authenticator.setDefault(object : Authenticator() {
        override fun getPasswordAuthentication(): PasswordAuthentication? {
          val url = requestingURL ?: return null
          if (url.userInfo.isNullOrEmpty()) return null
          val parts = url.userInfo.split(":", limit = 2)
          return PasswordAuthentication(parts[0], parts.getOrElse(1) { "" }.toCharArray())
        }
      })
      CookieHandler.setDefault(object : CookieHandler() {
        override fun get(uri: URI, requestHeaders: Map<String, List<String>>): Map<String, List<String>> {
          val httpUrl = uri.toString().toHttpUrlOrNull() ?: return emptyMap()
          val cookies = cookieJar.loadForRequest(httpUrl)
          if (cookies.isEmpty()) return emptyMap()
          return mapOf("Cookie" to listOf(cookies.joinToString("; ") { "${it.name}=${it.value}" }))
        }

        override fun put(uri: URI, responseHeaders: Map<String, List<String>>) {}
      })

      val savedHeaders = prefs.getString(PREFS_HEADERS, null)
      if (savedHeaders != null) {
        val map = Json.decodeFromString<Map<String, String>>(savedHeaders)
        val builder = Headers.Builder()
        for ((key, value) in map) {
          builder.add(key, value)
        }
        headers = builder.build()
      }

      val serverUrlsJson = prefs.getString(PREFS_SERVER_URLS, null)
      if (serverUrlsJson != null) {
        cookieJar.setServerUrls(Json.decodeFromString<List<String>>(serverUrlsJson))
      }

      val cacheDir = File(File(context.cacheDir, "okhttp"), "api")
      client = build(cacheDir)

      cronetStorageDir = File(context.cacheDir, "cronet").apply { mkdirs() }
      cronetEngine = buildCronetEngine()

      initialized = true
    }
  }

  fun setKeyChainAlias(alias: String) {
    synchronized(this) {
      val wasMtls = isMtls
      keyChainAlias = alias
      prefs.edit { putString(PREFS_CERT_ALIAS, alias) }

      if (wasMtls != isMtls) {
        clientChangedListeners.forEach { it() }
      }
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

      if (keyStore.containsAlias(CERT_ALIAS)) {
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
      val wasMtls = isMtls

      if (keyChainAlias != null) {
        keyChainAlias = null
        prefs.edit { remove(PREFS_CERT_ALIAS) }
      }

      keyStore.deleteEntry(CERT_ALIAS)

      if (wasMtls) {
        clientChangedListeners.forEach { it() }
      }
    }
  }

  private var clientGlobalRef: Long = 0L

  @JvmStatic
  fun getClient(): OkHttpClient {
    return client
  }

  fun getClientPointer(): Long {
    if (clientGlobalRef == 0L) {
      clientGlobalRef = NativeBuffer.createGlobalRef(client)
    }
    return clientGlobalRef
  }

  fun addClientChangedListener(listener: () -> Unit) {
    synchronized(this) { clientChangedListeners.add(listener) }
  }

  fun setRequestHeaders(headerMap: Map<String, String>, serverUrls: List<String>, token: String?) {
    synchronized(this) {
      val builder = Headers.Builder()
      headerMap.forEach { (key, value) -> builder[key] = value }
      val newHeaders = builder.build()

      val headersChanged = headers != newHeaders
      val urlsChanged = Json.encodeToString(serverUrls) != prefs.getString(PREFS_SERVER_URLS, null)

      headers = newHeaders
      cookieJar.setServerUrls(serverUrls)

      if (headersChanged || urlsChanged) {
        prefs.edit {
          putString(PREFS_HEADERS, Json.encodeToString(headerMap))
          putString(PREFS_SERVER_URLS, Json.encodeToString(serverUrls))
        }
      }

      if (token != null) {
        val url = serverUrls.firstNotNullOfOrNull { it.toHttpUrlOrNull() } ?: return
        val expiry = System.currentTimeMillis() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        val values = mapOf(
          AuthCookie.ACCESS_TOKEN to token,
          AuthCookie.IS_AUTHENTICATED to "true",
          AuthCookie.AUTH_TYPE to "password",
        )
        cookieJar.saveFromResponse(url, values.map { (cookie, value) ->
          Cookie.Builder().name(cookie.cookieName).value(value).domain(url.host).path("/").expiresAt(expiry)
            .apply {
              if (url.isHttps) secure()
              if (cookie.httpOnly) httpOnly()
            }.build()
        })
      }
    }
  }

  fun loadCookieHeader(url: String): String? {
    val httpUrl = url.toHttpUrlOrNull() ?: return null
    return cookieJar.loadForRequest(httpUrl).takeIf { it.isNotEmpty() }
      ?.joinToString("; ") { "${it.name}=${it.value}" }
  }

  fun getAuthHeaders(url: String): Map<String, String> {
    val result = mutableMapOf<String, String>()
    headers.forEach { (key, value) -> result[key] = value }
    loadCookieHeader(url)?.let { result["Cookie"] = it }
    url.toHttpUrlOrNull()?.let { httpUrl ->
      if (httpUrl.username.isNotEmpty()) {
        result["Authorization"] = Credentials.basic(httpUrl.username, httpUrl.password)
      }
    }
    return result
  }

  suspend fun rebuildCronetEngine(): Result<Long> {
    return runCatching {
      cronetEngine?.shutdown()
      val deletionResult = deleteFolderAndGetSize(cronetStoragePath.toPath())
      cronetEngine = buildCronetEngine()
      deletionResult
    }
  }

  val cronetStoragePath: File get() = cronetStorageDir

  @OptIn(UnstableApi::class)
  fun createDataSourceFactory(headers: Map<String, String>): DataSource.Factory {
    return if (isMtls) {
      OkHttpDataSource.Factory(client.newBuilder().cache(null).build())
    } else {
      ResolvingDataSource.Factory(
        CronetDataSource.Factory(cronetEngine!!, cronetExecutor)
      ) { dataSpec ->
        val newHeaders = dataSpec.httpRequestHeaders.toMutableMap()
        newHeaders.putAll(getAuthHeaders(dataSpec.uri.toString()))
        newHeaders["Cache-Control"] = "no-store"
        dataSpec.buildUpon().setHttpRequestHeaders(newHeaders).build()
      }
    }
  }

  fun buildCronetEngine(): CronetEngine {
    return CronetEngine.Builder(appContext)
      .enableHttp2(true)
      .enableQuic(true)
      .enableBrotli(true)
      .setStoragePath(cronetStorageDir.absolutePath)
      .setUserAgent(USER_AGENT)
      .enableHttpCache(CronetEngine.Builder.HTTP_CACHE_DISK, MEDIA_CACHE_SIZE_BYTES)
      .build()
  }

  private suspend fun deleteFolderAndGetSize(root: Path): Long = withContext(Dispatchers.IO) {
    var totalSize = 0L

    Files.walkFileTree(root, object : SimpleFileVisitor<Path>() {
      override fun visitFile(file: Path, attrs: BasicFileAttributes): FileVisitResult {
        totalSize += attrs.size()
        Files.delete(file)
        return FileVisitResult.CONTINUE
      }

      override fun postVisitDirectory(dir: Path, exc: IOException?): FileVisitResult {
        if (dir != root) {
          Files.delete(dir)
        }
        return FileVisitResult.CONTINUE
      }
    })

    totalSize
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
      .cookieJar(cookieJar)
      .addInterceptor {
        val request = it.request()
        val builder = request.newBuilder()
        builder.header("User-Agent", USER_AGENT)
        headers.forEach { (key, value) -> builder.header(key, value) }
        val url = request.url
        if (url.username.isNotEmpty()) {
          builder.header("Authorization", Credentials.basic(url.username, url.password))
        }
        it.proceed(builder.build())
      }
      .connectionPool(connectionPool)
      .dispatcher(Dispatcher().apply { maxRequestsPerHost = MAX_REQUESTS_PER_HOST })
      .cache(Cache(cacheDir.apply { mkdirs() }, CACHE_SIZE_BYTES))
      .sslSocketFactory(sslContext.socketFactory, trustManager)
      .build()
  }

  /**
   * Resolves client certificates dynamically at TLS handshake time.
   * Checks the system KeyChain alias first, then falls back to the app's private KeyStore.
   */
  private class DynamicKeyManager : X509KeyManager {
    override fun getClientAliases(keyType: String, issuers: Array<Principal>?): Array<String>? {
      val alias = chooseClientAlias(arrayOf(keyType), issuers, null) ?: return null
      return arrayOf(alias)
    }

    override fun chooseClientAlias(
      keyTypes: Array<String>,
      issuers: Array<Principal>?,
      socket: Socket?
    ): String? {
      keyChainAlias?.let { return it }
      if (keyStore.containsAlias(CERT_ALIAS)) return CERT_ALIAS
      return null
    }

    override fun getCertificateChain(alias: String): Array<X509Certificate>? {
      if (alias == keyChainAlias) {
        return KeyChain.getCertificateChain(appContext, alias)
      }
      return keyStore.getCertificateChain(alias)?.map { it as X509Certificate }?.toTypedArray()
    }

    override fun getPrivateKey(alias: String): PrivateKey? {
      if (alias == keyChainAlias) {
        return KeyChain.getPrivateKey(appContext, alias)
      }
      return keyStore.getKey(alias, null) as? PrivateKey
    }

    override fun getServerAliases(keyType: String, issuers: Array<Principal>?): Array<String>? =
      null

    override fun chooseServerAlias(
      keyType: String,
      issuers: Array<Principal>?,
      socket: Socket?
    ): String? = null
  }

  /**
   * Persistent CookieJar that duplicates auth cookies across equivalent server URLs.
   * When the server sets cookies for one domain, copies are created for all other known
   * server domains (for URL switching between local/remote endpoints of the same server).
   */
  private class PersistentCookieJar : CookieJar {
    private val store = mutableListOf<Cookie>()
    private var serverUrls = listOf<HttpUrl>()
    private var prefs: SharedPreferences? = null


    fun init(prefs: SharedPreferences) {
      this.prefs = prefs
      restore()
    }

    @Synchronized
    fun setServerUrls(urls: List<String>) {
      val parsed = urls.mapNotNull { it.toHttpUrlOrNull() }
      if (parsed.map { it.host } == serverUrls.map { it.host }) return
      serverUrls = parsed
      if (syncAuthCookies()) persist()
    }

    @Synchronized
    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
      val changed = cookies.any { new ->
        store.none { it.name == new.name && it.domain == new.domain && it.path == new.path && it.value == new.value }
      }
      store.removeAll { existing ->
        cookies.any { it.name == existing.name && it.domain == existing.domain && it.path == existing.path }
      }
      store.addAll(cookies)
      val synced = serverUrls.any { it.host == url.host } && syncAuthCookies()
      if (changed || synced) persist()
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
      val now = System.currentTimeMillis()
      if (store.removeAll { it.expiresAt < now }) {
        syncAuthCookies()
        persist()
      }
      return store.filter { it.matches(url) }
    }

    private fun syncAuthCookies(): Boolean {
      val serverHosts = serverUrls.map { it.host }.toSet()
      val now = System.currentTimeMillis()
      val sourceCookies = store
        .filter { it.name in AuthCookie.names && it.domain in serverHosts && it.expiresAt > now }
        .associateBy { it.name }

      if (sourceCookies.isEmpty()) {
        return store.removeAll { it.name in AuthCookie.names && it.domain in serverHosts }
      }

      var changed = false
      for (url in serverUrls) {
        for ((_, source) in sourceCookies) {
          if (store.any { it.name == source.name && it.domain == url.host && it.value == source.value }) continue
          store.removeAll { it.name == source.name && it.domain == url.host }
          store.add(rebuildCookie(source, url))
          changed = true
        }
      }
      return changed
    }

    private fun rebuildCookie(source: Cookie, url: HttpUrl): Cookie {
      return Cookie.Builder()
        .name(source.name).value(source.value)
        .domain(url.host).path("/")
        .expiresAt(source.expiresAt)
        .apply {
          if (url.isHttps) secure()
          if (source.httpOnly) httpOnly()
        }
        .build()
    }

    private fun persist() {
      val p = prefs ?: return
      p.edit { putString(PREFS_COOKIES, Json.encodeToString(store.map { SerializedCookie.from(it) })) }
    }

    private fun restore() {
      val p = prefs ?: return
      val jsonStr = p.getString(PREFS_COOKIES, null) ?: return
      try {
        store.addAll(Json.decodeFromString<List<SerializedCookie>>(jsonStr).map { it.toCookie() })
      } catch (_: Exception) {
        store.clear()
      }
    }
  }

  @Serializable
  private data class SerializedCookie(
    val name: String,
    val value: String,
    val domain: String,
    val path: String,
    val expiresAt: Long,
    val secure: Boolean,
    val httpOnly: Boolean,
    val hostOnly: Boolean,
  ) {
    fun toCookie(): Cookie = Cookie.Builder()
      .name(name).value(value).path(path).expiresAt(expiresAt)
      .apply {
        if (hostOnly) hostOnlyDomain(domain) else domain(domain)
        if (secure) secure()
        if (httpOnly) httpOnly()
      }
      .build()

    companion object {
      fun from(cookie: Cookie) = SerializedCookie(
        name = cookie.name, value = cookie.value, domain = cookie.domain,
        path = cookie.path, expiresAt = cookie.expiresAt, secure = cookie.secure,
        httpOnly = cookie.httpOnly, hostOnly = cookie.hostOnly,
      )
    }
  }
}
