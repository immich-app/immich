package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import app.alextran.immich.widget.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import es.antonborri.home_widget.HomeWidgetPlugin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class ImmichAPI(cfg: ServerConfig) {

  companion object {
    fun getServerConfig(context: Context): ServerConfig? {
      val prefs = HomeWidgetPlugin.getData(context)

      val serverURL = prefs.getString("widget_server_url", "") ?: ""
      val sessionKey = prefs.getString("widget_auth_token", "") ?: ""
      val customHeadersJSON = prefs.getString("widget_custom_headers", "") ?: ""

      if (serverURL.isBlank() || sessionKey.isBlank()) {
        return null
      }

      var customHeaders: Map<String, String> = HashMap<String, String>()

      if (customHeadersJSON.isNotBlank()) {
        val stringMapType = object : TypeToken<Map<String, String>>() {}.type
        customHeaders = Gson().fromJson(customHeadersJSON, stringMapType)
      }

      return ServerConfig(
        serverURL,
        sessionKey,
        customHeaders
      )
    }
  }


  private val gson = Gson()
  private val serverConfig = cfg

  private fun buildRequestURL(endpoint: String, params: List<Pair<String, String>> = emptyList()): URL {
    val urlString = StringBuilder("${serverConfig.serverEndpoint}$endpoint?sessionKey=${serverConfig.sessionKey}")

    for ((key, value) in params) {
      urlString.append("&${URLEncoder.encode(key, "UTF-8")}=${URLEncoder.encode(value, "UTF-8")}")
    }

    return URL(urlString.toString())
  }

  private fun HttpURLConnection.applyCustomHeaders() {
    serverConfig.customHeaders.forEach { (key, value) ->
      setRequestProperty(key, value)
    }
  }

  suspend fun fetchSearchResults(filters: SearchFilters): List<Asset> = withContext(Dispatchers.IO) {
    val url = buildRequestURL("/search/random")
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      setRequestProperty("Content-Type", "application/json")
      applyCustomHeaders()

      doOutput = true
    }

    connection.outputStream.use {
      OutputStreamWriter(it).use { writer ->
        writer.write(gson.toJson(filters))
        writer.flush()
      }
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<Asset>>() {}.type
    gson.fromJson(response, type)
  }

  suspend fun fetchMemory(date: LocalDate): List<MemoryResult> = withContext(Dispatchers.IO) {
    val iso8601 = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
    val url = buildRequestURL("/memories", listOf("for" to iso8601))
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
      applyCustomHeaders()
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<MemoryResult>>() {}.type
    gson.fromJson(response, type)
  }

  suspend fun fetchImage(asset: Asset): Bitmap = withContext(Dispatchers.IO) {
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
      applyCustomHeaders()
    }

    val response = connection.inputStream.bufferedReader().readText()
    val type = object : TypeToken<List<Album>>() {}.type
    gson.fromJson(response, type)
  }
}
