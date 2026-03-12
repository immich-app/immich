package app.alextran.immich.widget

import android.content.Context
import android.os.CancellationSignal
import app.alextran.immich.NativeByteBuffer
import app.alextran.immich.core.HttpClientManager
import app.alextran.immich.images.ImageFetcherManager
import app.alextran.immich.widget.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

object ImmichAPI {
  private val gson = Gson()
  private val serverEndpoint: String
    get() = HttpClientManager.serverUrl ?: throw IllegalStateException("Not logged in")

  private fun initialize(context: Context) {
    HttpClientManager.initialize(context)
    ImageFetcherManager.initialize(context)
  }

  fun isLoggedIn(context: Context): Boolean {
    initialize(context)
    return HttpClientManager.serverUrl != null
  }

  private fun buildRequestURL(endpoint: String, params: List<Pair<String, String>> = emptyList()): String {
    val url = StringBuilder("$serverEndpoint$endpoint")

    if (params.isNotEmpty()) {
      url.append("?")
      url.append(params.joinToString("&") { (key, value) ->
        "${java.net.URLEncoder.encode(key, "UTF-8")}=${java.net.URLEncoder.encode(value, "UTF-8")}"
      })
    }

    return url.toString()
  }

  suspend fun fetchSearchResults(filters: SearchFilters): List<Asset> = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/search/random")
    val body = gson.toJson(filters).toRequestBody("application/json".toMediaType())
    val request = Request.Builder().url(url).post(body).build()

    HttpClientManager.client.newCall(request).execute().use { response ->
      val responseBody = response.body?.string() ?: throw Exception("Empty response")
      val type = object : TypeToken<List<Asset>>() {}.type
      gson.fromJson(responseBody, type)
    }
  }

  suspend fun fetchMemory(date: LocalDate): List<MemoryResult> = withContext(Dispatchers.IO) {
    val iso8601 = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
    val url = buildRequestURL("/memories", listOf("for" to iso8601))
    val request = Request.Builder().url(url).get().build()

    HttpClientManager.client.newCall(request).execute().use { response ->
      val responseBody = response.body?.string() ?: throw Exception("Empty response")
      val type = object : TypeToken<List<MemoryResult>>() {}.type
      gson.fromJson(responseBody, type)
    }
  }

  suspend fun fetchImage(asset: Asset): NativeByteBuffer = suspendCancellableCoroutine { cont ->
    val url = buildRequestURL("/assets/${asset.id}/thumbnail", listOf("size" to "preview", "edited" to "true"))
    val signal = CancellationSignal()
    cont.invokeOnCancellation { signal.cancel() }

    ImageFetcherManager.fetch(
      url,
      signal,
      onSuccess = { buffer -> cont.resume(buffer) },
      onFailure = { e -> cont.resumeWithException(e) }
    )
  }

  suspend fun fetchAlbums(): List<Album> = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/albums")
    val request = Request.Builder().url(url).get().build()

    HttpClientManager.client.newCall(request).execute().use { response ->
      val responseBody = response.body?.string() ?: throw Exception("Empty response")
      val type = object : TypeToken<List<Album>>() {}.type
      gson.fromJson(responseBody, type)
    }
  }
}
