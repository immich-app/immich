package app.alextran.immich.widget

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.*


class ImmichAPI(cfg: ServerConfig) {

  private val gson = Gson()
  private val serverConfig = cfg

  private fun buildRequestURL(endpoint: String, params: List<Pair<String, String>> = emptyList()): URL {
    val baseUrl = URL(serverConfig.serverEndpoint)
    val urlString = StringBuilder("${baseUrl.protocol}://${baseUrl.host}:${baseUrl.port}$endpoint?sessionKey=${URLEncoder.encode(serverConfig.sessionKey, "UTF-8")}")

    for ((key, value) in params) {
      urlString.append("&${URLEncoder.encode(key, "UTF-8")}=${URLEncoder.encode(value, "UTF-8")}")
    }

    return URL(urlString.toString())
  }

  suspend fun fetchSearchResults(filters: SearchFilters): List<SearchResult> = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/search/random")
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      setRequestProperty("Content-Type", "application/json")
      doOutput = true
    }

    connection.outputStream.use {
      OutputStreamWriter(it).use { writer ->
        writer.write(gson.toJson(filters))
        writer.flush()
      }
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<SearchResult>>() {}.type
    gson.fromJson(response, type)
  }

  suspend fun fetchMemory(date: Date): List<MemoryResult> = withContext(Dispatchers.IO) {
    val iso8601 = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).format(date)
    val url = buildRequestURL("/memories", listOf("for" to iso8601))
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<MemoryResult>>() {}.type
    gson.fromJson(response, type)
  }

  suspend fun fetchImage(asset: SearchResult): Bitmap = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/assets/${asset.id}/thumbnail", listOf("size" to "preview"))
    val connection = url.openConnection()
    val data = connection.getInputStream().readBytes()
    BitmapFactory.decodeByteArray(data, 0, data.size)
      ?: throw Exception("Invalid image data")
  }

  suspend fun fetchAlbums(): List<Album> = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/albums")
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<Album>>() {}.type
    gson.fromJson(response, type)
  }
}
