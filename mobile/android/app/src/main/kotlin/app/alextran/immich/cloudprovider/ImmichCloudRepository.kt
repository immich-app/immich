package app.alextran.immich.cloudprovider

import android.content.Context
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.graphics.Point
import android.os.ParcelFileDescriptor
import android.util.Log
import app.alextran.immich.core.HttpClientManager
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

private const val TAG = "ImmichCloudRepo"
private const val SYNC_PREFS_NAME = "immich.cloud_provider"

data class ImmichAsset(
  val id: String,
  val mimeType: String,
  val dateTakenMillis: Long,
  val width: Int,
  val height: Int,
  val sizeBytes: Long,
  val durationMillis: Long,
  val isFavorite: Boolean,
  val orientation: Int,
  val isImage: Boolean
)

data class ImmichAlbum(
  val id: String,
  val displayName: String,
  val mediaCount: Int,
  val coverAssetId: String?,
  val dateTakenMillis: Long
)

data class ImmichPerson(
  val id: String,
  val name: String,
  val coverAssetId: String?
)

data class QueryResult(
  val assets: List<ImmichAsset>,
  val nextPageToken: String?
)

object ImmichCloudRepository {
  private lateinit var appContext: Context
  private lateinit var syncPrefs: SharedPreferences

  private var cachedPeople: List<ImmichPerson>? = null
  private var peopleCacheTime: Long = 0
  private val PEOPLE_CACHE_TTL_MS = 5 * 60 * 1000L

  fun initialize(context: Context) {
    appContext = context.applicationContext
    syncPrefs = appContext.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
    HttpClientManager.initialize(appContext)
    Log.d(TAG, "initialize: dbExists=${getDatabaseFile()?.exists()}")
  }

  val isConfigured: Boolean
    get() = getServerUrl() != null

  private fun getServerUrl(): String? = HttpClientManager.getServerUrl()

  private fun getClient(): OkHttpClient = HttpClientManager.getClient()

  private fun buildUrl(path: String): okhttp3.HttpUrl? {
    val base = getServerUrl() ?: return null
    val baseWithoutTrailingApi = base.removeSuffix("/api").removeSuffix("/")
    return "$baseWithoutTrailingApi/api$path".toHttpUrlOrNull()
  }

  private fun getDatabaseFile(): File? {
    val dbFile = File(appContext.dataDir, "app_flutter/immich.sqlite")
    return if (dbFile.exists()) dbFile else null
  }

  private fun openDatabase(): SQLiteDatabase? {
    val dbFile = getDatabaseFile() ?: run {
      Log.w(TAG, "Database file not found — app may not have synced yet")
      return null
    }
    return try {
      SQLiteDatabase.openDatabase(
        dbFile.absolutePath,
        null,
        SQLiteDatabase.OPEN_READONLY or SQLiteDatabase.NO_LOCALIZED_COLLATORS
      )
    } catch (e: Exception) {
      Log.e(TAG, "Failed to open database", e)
      null
    }
  }

  private fun getTimelineUserIds(db: SQLiteDatabase): List<String> {
    val userId = getCurrentUserId(db) ?: return emptyList()
    val userIds = mutableListOf(userId)
    try {
      val cursor = db.rawQuery(
        "SELECT shared_by_id FROM partner_entity WHERE shared_with_id = ? AND in_timeline = 1",
        arrayOf(userId)
      )
      cursor.use {
        while (it.moveToNext()) {
          userIds.add(it.getString(0))
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "getTimelineUserIds error", e)
    }
    return userIds
  }

  private fun getCurrentUserId(db: SQLiteDatabase): String? {
    return try {
      val cursor = db.rawQuery("SELECT id FROM auth_user_entity LIMIT 1", null)
      cursor.use {
        if (it.moveToFirst()) it.getString(0) else null
      }
    } catch (e: Exception) {
      Log.e(TAG, "getCurrentUserId error", e)
      null
    }
  }

  private fun buildOwnerPlaceholders(userIds: List<String>): String {
    return userIds.joinToString(",") { "?" }
  }

  fun getAccountName(): String {
    val cached = syncPrefs.getString("account_name", null)
    if (cached != null) return cached

    val dbName = getAccountNameFromDb()
    if (dbName != null) {
      syncPrefs.edit().putString("account_name", dbName).apply()
      return dbName
    }

    return try {
      val url = buildUrl("/users/me") ?: return (getServerUrl() ?: "Immich")
      val request = Request.Builder().url(url).get().build()
      val response = getClient().newCall(request).execute()
      if (response.isSuccessful) {
        val json = JSONObject(response.body?.string() ?: "")
        val email = json.optString("email", "")
        val name = json.optString("name", "")
        val accountName = when {
          name.isNotBlank() && email.isNotBlank() -> "$name ($email)"
          email.isNotBlank() -> email
          name.isNotBlank() -> name
          else -> getServerUrl() ?: "Immich"
        }
        syncPrefs.edit().putString("account_name", accountName).apply()
        accountName
      } else {
        getServerUrl() ?: "Immich"
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to fetch account name", e)
      getServerUrl() ?: "Immich"
    }
  }

  private fun getAccountNameFromDb(): String? {
    val db = openDatabase() ?: return null
    return try {
      val cursor = db.rawQuery(
        "SELECT name, email FROM auth_user_entity LIMIT 1",
        null
      )
      cursor.use {
        if (it.moveToFirst()) {
          val name = it.getString(0) ?: ""
          val email = it.getString(1) ?: ""
          when {
            name.isNotBlank() && email.isNotBlank() -> "$name ($email)"
            email.isNotBlank() -> email
            name.isNotBlank() -> name
            else -> null
          }
        } else null
      }
    } catch (e: Exception) {
      Log.e(TAG, "getAccountNameFromDb error", e)
      null
    } finally {
      db.close()
    }
  }

  fun queryAllAssets(
    pageSize: Int = 1000,
    pageToken: String? = null
  ): QueryResult {
    Log.d(TAG, "queryAllAssets: pageSize=$pageSize, pageToken=$pageToken")
    val db = openDatabase() ?: return QueryResult(emptyList(), null)
    return try {
      val userIds = getTimelineUserIds(db)
      if (userIds.isEmpty()) return QueryResult(emptyList(), null)

      val offset = pageToken?.toLongOrNull() ?: 0L
      val placeholders = buildOwnerPlaceholders(userIds)

      val args = userIds.toMutableList()
      args.add(pageSize.toString())
      args.add(offset.toString())

      val cursor = db.rawQuery(
        """
        SELECT r.id, r.type, r.created_at, r.width, r.height,
               r.duration_in_seconds, r.is_favorite,
               COALESCE(e.file_size, 1) AS file_size,
               COALESCE(e.orientation, '0') AS orientation
        FROM remote_asset_entity r
        LEFT JOIN remote_exif_entity e ON e.asset_id = r.id
        WHERE r.visibility = 0 AND r.deleted_at IS NULL
          AND r.owner_id IN ($placeholders)
        ORDER BY COALESCE(r.local_date_time, r.created_at) DESC
        LIMIT ? OFFSET ?
        """,
        args.toTypedArray()
      )

      val assets = mutableListOf<ImmichAsset>()
      cursor.use {
        while (it.moveToNext()) {
          assets.add(assetFromCursor(it))
        }
      }

      val nextToken = if (assets.size == pageSize) {
        (offset + pageSize).toString()
      } else null

      Log.d(TAG, "queryAllAssets: returning ${assets.size} assets, nextToken=$nextToken")
      QueryResult(assets, nextToken)
    } catch (e: Exception) {
      Log.e(TAG, "queryAllAssets error", e)
      QueryResult(emptyList(), null)
    } finally {
      db.close()
    }
  }

  fun queryAlbumAssets(
    albumId: String,
    pageSize: Int = 1000,
    pageToken: String? = null
  ): QueryResult {
    Log.d(TAG, "queryAlbumAssets: albumId=$albumId, pageSize=$pageSize, pageToken=$pageToken")
    return try {
      val url = buildUrl("/albums/$albumId") ?: return QueryResult(emptyList(), null)
      val request = Request.Builder().url(url).get().build()
      val response = getClient().newCall(request).execute()
      if (!response.isSuccessful) {
        Log.e(TAG, "queryAlbumAssets API failed: ${response.code}")
        response.close()
        return QueryResult(emptyList(), null)
      }
      val body = response.body?.string() ?: "{}"
      response.close()
      val obj = JSONObject(body)
      val assetsArr = obj.optJSONArray("assets") ?: return QueryResult(emptyList(), null)

      val offset = pageToken?.toIntOrNull() ?: 0
      val end = minOf(offset + pageSize, assetsArr.length())
      val assets = mutableListOf<ImmichAsset>()

      for (i in offset until end) {
        val a = assetsArr.getJSONObject(i)
        assets.add(assetFromApiJson(a))
      }

      val nextToken = if (end < assetsArr.length()) end.toString() else null
      Log.d(TAG, "queryAlbumAssets: returning ${assets.size} assets, nextToken=$nextToken")
      QueryResult(assets, nextToken)
    } catch (e: Exception) {
      Log.e(TAG, "queryAlbumAssets error", e)
      QueryResult(emptyList(), null)
    }
  }

  private fun parseDuration(duration: String): Long {
    if (duration.isBlank() || duration == "0:00:00.00000") return 0
    return try {
      val parts = duration.split(":")
      if (parts.size == 3) {
        val hours = parts[0].toLong()
        val minutes = parts[1].toLong()
        val seconds = parts[2].toDouble()
        (hours * 3600 + minutes * 60 + seconds.toLong()) * 1000
      } else 0
    } catch (_: Exception) { 0 }
  }

  private fun assetFromCursor(c: android.database.Cursor): ImmichAsset {
    val id = c.getString(0)
    val typeInt = c.getInt(1)
    val createdAtStr = c.getString(2)
    val width = if (c.isNull(3)) 0 else c.getInt(3)
    val height = if (c.isNull(4)) 0 else c.getInt(4)
    val durationSec = if (c.isNull(5)) 0 else c.getInt(5)
    val isFavorite = c.getInt(6) != 0
    val fileSize = c.getLong(7)
    val orientationStr = c.getString(8)

    val isImage = typeInt == 1
    val orientation = orientationStr.toIntOrNull() ?: 0
    val sizeBytes = if (fileSize > 0) fileSize else 1L

    val dateTakenMillis = try {
      java.time.Instant.parse(createdAtStr).toEpochMilli()
    } catch (_: Exception) {
      try {
        java.time.LocalDateTime.parse(createdAtStr)
          .atZone(java.time.ZoneOffset.UTC)
          .toInstant()
          .toEpochMilli()
      } catch (_: Exception) {
        System.currentTimeMillis()
      }
    }

    return ImmichAsset(
      id = id,
      mimeType = if (isImage) "image/jpeg" else "video/mp4",
      dateTakenMillis = dateTakenMillis,
      width = width,
      height = height,
      sizeBytes = sizeBytes,
      durationMillis = durationSec.toLong() * 1000,
      isFavorite = isFavorite,
      orientation = orientation,
      isImage = isImage
    )
  }

  fun getAssetById(assetId: String): ImmichAsset? {
    val db = openDatabase() ?: return null
    return try {
      val cursor = db.rawQuery(
        """
        SELECT r.id, r.type, r.created_at, r.width, r.height,
               r.duration_in_seconds, r.is_favorite,
               COALESCE(e.file_size, 1) AS file_size,
               COALESCE(e.orientation, '0') AS orientation
        FROM remote_asset_entity r
        LEFT JOIN remote_exif_entity e ON e.asset_id = r.id
        WHERE r.id = ? LIMIT 1
        """,
        arrayOf(assetId)
      )
      cursor.use {
        if (it.moveToFirst()) assetFromCursor(it) else null
      }
    } catch (e: Exception) {
      Log.e(TAG, "getAssetById error", e)
      null
    } finally {
      db.close()
    }
  }

  fun queryAlbums(): List<ImmichAlbum> {
    return try {
      val url = buildUrl("/albums") ?: return emptyList()
      val request = Request.Builder().url(url).get().build()
      val response = getClient().newCall(request).execute()
      if (!response.isSuccessful) {
        Log.e(TAG, "queryAlbums API failed: ${response.code}")
        response.close()
        return emptyList()
      }
      val body = response.body?.string() ?: "[]"
      response.close()
      val arr = JSONArray(body)
      val albums = mutableListOf<ImmichAlbum>()
      for (i in 0 until arr.length()) {
        val obj = arr.getJSONObject(i)
        val assetCount = obj.optInt("assetCount", 0)
        if (assetCount == 0) continue
        val updatedAt = obj.optString("updatedAt", "")
        val dateTakenMillis = parseIso8601(updatedAt)
        val thumbId = obj.optString("albumThumbnailAssetId", "")
        val coverAssetId = if (thumbId.isNotEmpty() && thumbId != "null") thumbId else null
        albums.add(
          ImmichAlbum(
            id = obj.getString("id"),
            displayName = obj.getString("albumName"),
            coverAssetId = coverAssetId,
            dateTakenMillis = dateTakenMillis,
            mediaCount = assetCount
          )
        )
      }
      Log.d(TAG, "queryAlbums: returning ${albums.size} albums from API")
      albums
    } catch (e: Exception) {
      Log.e(TAG, "queryAlbums error", e)
      emptyList()
    }
  }

  fun queryPeople(): List<ImmichPerson> {
    val now = System.currentTimeMillis()
    cachedPeople?.let { cached ->
      if (now - peopleCacheTime < PEOPLE_CACHE_TTL_MS) return cached
    }

    val db = openDatabase()
    if (db == null) {
      Log.w(TAG, "queryPeople: DB not available")
      return emptyList()
    }
    return try {
      val people = mutableListOf<ImmichPerson>()
      db.rawQuery(
        """
        SELECT id, name
        FROM person_entity
        WHERE is_hidden = 0 AND name != ''
        ORDER BY name COLLATE NOCASE
        """.trimIndent(),
        null
      ).use { cursor ->
        while (cursor.moveToNext()) {
          val personId = cursor.getString(0)
          people.add(
            ImmichPerson(
              id = personId,
              name = cursor.getString(1),
              coverAssetId = "person:$personId"
            )
          )
        }
      }
      cachedPeople = people
      peopleCacheTime = now
      Log.d(TAG, "queryPeople: returning ${people.size} people from local DB")
      people
    } catch (e: Exception) {
      Log.e(TAG, "queryPeople error", e)
      emptyList()
    } finally {
      db.close()
    }
  }

  fun queryPersonAssets(
    personId: String,
    pageSize: Int = 1000,
    pageToken: String? = null
  ): QueryResult {
    Log.d(TAG, "queryPersonAssets: personId=$personId, pageSize=$pageSize, pageToken=$pageToken")
    return try {
      val page = pageToken?.toIntOrNull() ?: 1
      val url = buildUrl("/search/metadata") ?: return QueryResult(emptyList(), null)
      val jsonBody = JSONObject().apply {
        put("personIds", org.json.JSONArray().put(personId))
        put("page", page)
        put("size", pageSize)
      }
      val mediaType = "application/json".toMediaType()
      val requestBody = jsonBody.toString().toRequestBody(mediaType)
      val request = Request.Builder().url(url).post(requestBody).build()
      val response = getClient().newCall(request).execute()
      if (!response.isSuccessful) {
        Log.e(TAG, "queryPersonAssets API failed: ${response.code}")
        response.close()
        return QueryResult(emptyList(), null)
      }
      val body = response.body?.string() ?: "{}"
      response.close()
      val result = JSONObject(body)
      val assetsObj = result.optJSONObject("assets") ?: return QueryResult(emptyList(), null)
      val items = assetsObj.optJSONArray("items") ?: return QueryResult(emptyList(), null)
      val total = assetsObj.optInt("total", 0)

      val assets = mutableListOf<ImmichAsset>()
      for (i in 0 until items.length()) {
        val a = items.getJSONObject(i)
        assets.add(assetFromApiJson(a))
      }

      val fetched = (page - 1) * pageSize + assets.size
      val nextToken = if (fetched < total) (page + 1).toString() else null
      Log.d(TAG, "queryPersonAssets: returning ${assets.size} assets, nextToken=$nextToken")
      QueryResult(assets, nextToken)
    } catch (e: Exception) {
      Log.e(TAG, "queryPersonAssets error", e)
      QueryResult(emptyList(), null)
    }
  }

  private fun assetFromApiJson(a: JSONObject): ImmichAsset {
    val id = a.getString("id")
    val type = a.optString("type", "IMAGE")
    val isImage = type == "IMAGE"
    val createdAt = a.optString("fileCreatedAt", a.optString("createdAt", ""))
    val exifInfo = a.optJSONObject("exifInfo")
    val fileSize = exifInfo?.optLong("fileSizeInByte", 1) ?: 1L
    val orientation = exifInfo?.optString("orientation", "0")?.toIntOrNull() ?: 0
    val width = exifInfo?.optInt("exifImageWidth", 0) ?: 0
    val height = exifInfo?.optInt("exifImageHeight", 0) ?: 0
    val duration = a.optString("duration", "")
    val durationMillis = parseDuration(duration)

    return ImmichAsset(
      id = id,
      mimeType = if (isImage) "image/jpeg" else "video/mp4",
      dateTakenMillis = parseIso8601(createdAt),
      width = width,
      height = height,
      sizeBytes = if (fileSize > 0) fileSize else 1L,
      durationMillis = durationMillis,
      isFavorite = a.optBoolean("isFavorite", false),
      orientation = orientation,
      isImage = isImage
    )
  }

  private fun parseIso8601(dateStr: String): Long {
    return try {
      java.time.Instant.parse(dateStr).toEpochMilli()
    } catch (_: Exception) {
      try {
        java.time.LocalDateTime.parse(dateStr)
          .atZone(java.time.ZoneOffset.UTC)
          .toInstant()
          .toEpochMilli()
      } catch (_: Exception) {
        System.currentTimeMillis()
      }
    }
  }

  fun openMedia(assetId: String): ParcelFileDescriptor? {
    if (assetId.startsWith("person:")) {
      val personId = assetId.removePrefix("person:")
      val url = buildUrl("/people/$personId/thumbnail") ?: return null
      val request = Request.Builder().url(url).get().build()
      return downloadToTempFile(request, "person_thumb_$personId")
    }
    val url = buildUrl("/assets/$assetId/original") ?: return null
    val request = Request.Builder().url(url).get().build()
    return downloadToTempFile(request, "media_$assetId")
  }

  private fun downloadToTempFile(request: Request, prefix: String): ParcelFileDescriptor? {
    return try {
      val response = getClient().newCall(request).execute()
      if (!response.isSuccessful) {
        Log.e(TAG, "Download to temp failed: ${response.code}")
        response.close()
        return null
      }
      val tempFile = java.io.File.createTempFile(prefix, null, appContext.cacheDir)
      response.body?.byteStream()?.use { input ->
        tempFile.outputStream().use { output ->
          input.copyTo(output, bufferSize = 65536)
        }
      }
      response.close()
      ParcelFileDescriptor.open(tempFile, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: Exception) {
      Log.e(TAG, "downloadToTempFile error", e)
      null
    }
  }

  fun openPreview(assetId: String, size: Point): ParcelFileDescriptor? {
    if (assetId.startsWith("person:")) {
      val personId = assetId.removePrefix("person:")
      val url = buildUrl("/people/$personId/thumbnail") ?: return null
      val request = Request.Builder().url(url).get().build()
      return downloadToTempFile(request, "person_thumb_$personId")
    }
    val sizeParam = if (size.x <= 250 && size.y <= 250) "thumbnail" else "preview"
    val url = buildUrl("/assets/$assetId/thumbnail") ?: return null
    val urlWithParams = url.newBuilder()
      .addQueryParameter("size", sizeParam)
      .build()
    val request = Request.Builder().url(urlWithParams).get().build()
    return downloadToTempFile(request, "preview_${assetId}_$sizeParam")
  }
}
