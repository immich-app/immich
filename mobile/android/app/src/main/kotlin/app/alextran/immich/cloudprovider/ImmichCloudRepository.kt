package app.alextran.immich.cloudprovider

import android.content.Context
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.graphics.Point
import android.os.ParcelFileDescriptor
import android.util.Log
import android.webkit.MimeTypeMap
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
  val originalFileName: String,
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

  private fun getServerUrls(): List<String> = HttpClientManager.getServerUrls()

  private fun getClient(): OkHttpClient = HttpClientManager.getClient()

  private fun buildUrl(base: String, path: String): okhttp3.HttpUrl? {
    val baseWithoutTrailingApi = base.removeSuffix("/api").removeSuffix("/")
    return "$baseWithoutTrailingApi/api$path".toHttpUrlOrNull()
  }

  private fun buildUrls(path: String): List<okhttp3.HttpUrl> {
    return getServerUrls().mapNotNull { buildUrl(it, path) }
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
      val response = executeFirstSuccessful("/users/me") { Request.Builder().url(it).get().build() }
        ?: return getServerUrl() ?: "Immich"
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
        response.close()
        accountName
      } else {
        response.close()
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
        SELECT DISTINCT r.id, r.type, r.created_at, r.width, r.height,
               r.duration_in_seconds, r.is_favorite, r.name,
               e.file_size,
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
      val offset = pageToken?.toLongOrNull() ?: 0L
      val assets = queryAssetsFromDb(
        """
        JOIN remote_album_asset_entity aa ON aa.asset_id = r.id
        WHERE aa.album_id = ? AND r.visibility = 0 AND r.deleted_at IS NULL
        """,
        arrayOf(albumId),
        pageSize,
        offset
      )
      val nextToken = if (assets.size == pageSize) (offset + pageSize).toString() else null
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
    val originalFileName = c.getString(7)
    val fileSize = if (c.isNull(8)) 0L else c.getLong(8)
    val orientationStr = c.getString(9)

    val isImage = typeInt == 1
    val orientation = orientationStr.toIntOrNull() ?: 0
    val sizeBytes = fileSize.coerceAtLeast(0L)

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
      originalFileName = originalFileName,
      mimeType = inferMimeType(originalFileName, isImage),
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
               r.duration_in_seconds, r.is_favorite, r.name,
               e.file_size,
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
    val db = openDatabase()
    if (db != null) {
      try {
        val albums = mutableListOf<ImmichAlbum>()
        db.rawQuery(
          """
          SELECT a.id, a.name, COUNT(aa.asset_id) AS media_count,
                 a.thumbnail_asset_id, a.updated_at
          FROM remote_album_entity a
          JOIN remote_album_asset_entity aa ON aa.album_id = a.id
          GROUP BY a.id, a.name, a.thumbnail_asset_id, a.updated_at
          HAVING media_count > 0
          ORDER BY a.name COLLATE NOCASE
          """.trimIndent(),
          null
        ).use { cursor ->
          while (cursor.moveToNext()) {
            albums.add(albumFromCursor(cursor))
          }
        }
        Log.d(TAG, "queryAlbums: returning ${albums.size} albums from local DB")
        return albums
      } catch (e: Exception) {
        Log.e(TAG, "queryAlbums DB error", e)
      } finally {
        db.close()
      }
    }

    return try {
      val response = executeFirstSuccessful("/albums") { Request.Builder().url(it).get().build() }
        ?: return emptyList()
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

  fun getAlbumById(albumId: String): ImmichAlbum? {
    val db = openDatabase() ?: return null
    return try {
      db.rawQuery(
        """
        SELECT a.id, a.name, COUNT(aa.asset_id) AS media_count,
               a.thumbnail_asset_id, a.updated_at
        FROM remote_album_entity a
        LEFT JOIN remote_album_asset_entity aa ON aa.album_id = a.id
        WHERE a.id = ?
        GROUP BY a.id, a.name, a.thumbnail_asset_id, a.updated_at
        LIMIT 1
        """.trimIndent(),
        arrayOf(albumId)
      ).use { cursor ->
        if (cursor.moveToFirst()) albumFromCursor(cursor) else null
      }
    } catch (e: Exception) {
      Log.e(TAG, "getAlbumById error", e)
      null
    } finally {
      db.close()
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

  fun getPersonById(personId: String): ImmichPerson? {
    val db = openDatabase() ?: return null
    return try {
      db.rawQuery(
        """
        SELECT id, name
        FROM person_entity
        WHERE id = ? AND is_hidden = 0
        LIMIT 1
        """.trimIndent(),
        arrayOf(personId)
      ).use { cursor ->
        if (cursor.moveToFirst()) {
          ImmichPerson(
            id = cursor.getString(0),
            name = cursor.getString(1),
            coverAssetId = "person:$personId"
          )
        } else null
      }
    } catch (e: Exception) {
      Log.e(TAG, "getPersonById error", e)
      null
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
      val offset = pageToken?.toLongOrNull() ?: 0L
      val assets = queryAssetsFromDb(
        """
        JOIN asset_face_entity af ON af.asset_id = r.id
        WHERE af.person_id = ? AND r.visibility = 0 AND r.deleted_at IS NULL
        """,
        arrayOf(personId),
        pageSize,
        offset
      )
      val nextToken = if (assets.size == pageSize) (offset + pageSize).toString() else null
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
    val fileSize = exifInfo?.optLong("fileSizeInByte", 0) ?: 0L
    val orientation = exifInfo?.optString("orientation", "0")?.toIntOrNull() ?: 0
    val width = exifInfo?.optInt("exifImageWidth", 0) ?: 0
    val height = exifInfo?.optInt("exifImageHeight", 0) ?: 0
    val duration = a.optString("duration", "")
    val durationMillis = parseDuration(duration)

    return ImmichAsset(
      id = id,
      originalFileName = a.optString("originalFileName", id),
      mimeType = inferMimeType(a.optString("originalFileName", ""), isImage),
      dateTakenMillis = parseIso8601(createdAt),
      width = width,
      height = height,
      sizeBytes = fileSize.coerceAtLeast(0L),
      durationMillis = durationMillis,
      isFavorite = a.optBoolean("isFavorite", false),
      orientation = orientation,
      isImage = isImage
    )
  }

  fun searchAssets(query: String, pageSize: Int = 100): QueryResult {
    if (query.isBlank()) return QueryResult(emptyList(), null)
    return try {
      val response = executeFirstSuccessful("/search/smart") { url ->
        val body = JSONObject().apply {
          put("query", query)
          put("page", 1)
          put("size", pageSize)
          put("visibility", "timeline")
        }.toString().toRequestBody("application/json".toMediaType())
        Request.Builder().url(url).post(body).build()
      } ?: return QueryResult(emptyList(), null)

      val result = JSONObject(response.body?.string() ?: "{}")
      response.close()
      val assetsObj = result.optJSONObject("assets") ?: return QueryResult(emptyList(), null)
      val items = assetsObj.optJSONArray("items") ?: return QueryResult(emptyList(), null)
      val assets = mutableListOf<ImmichAsset>()
      for (i in 0 until items.length()) {
        assets.add(assetFromApiJson(items.getJSONObject(i)))
      }
      QueryResult(assets, null)
    } catch (e: Exception) {
      Log.e(TAG, "searchAssets error", e)
      QueryResult(emptyList(), null)
    }
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
      return downloadToTempFile("/people/$personId/thumbnail", "person_thumb_$personId")
    }
    return downloadToTempFile("/assets/$assetId/original", "media_$assetId")
  }

  private fun downloadToTempFile(path: String, prefix: String): ParcelFileDescriptor? {
    return try {
      val response = executeFirstSuccessful(path) { Request.Builder().url(it).get().build() } ?: return null
      val tempFile = java.io.File.createTempFile(prefix, null, appContext.cacheDir)
      response.body?.byteStream()?.use { input ->
        tempFile.outputStream().use { output ->
          input.copyTo(output, bufferSize = 65536)
        }
      }
      response.close()
      val fd = ParcelFileDescriptor.open(tempFile, ParcelFileDescriptor.MODE_READ_ONLY)
      if (!tempFile.delete()) {
        Log.w(TAG, "Failed to unlink temp file: ${tempFile.absolutePath}")
      }
      fd
    } catch (e: Exception) {
      Log.e(TAG, "downloadToTempFile error", e)
      null
    }
  }

  fun openPreview(assetId: String, size: Point): ParcelFileDescriptor? {
    if (assetId.startsWith("person:")) {
      val personId = assetId.removePrefix("person:")
      return downloadToTempFile("/people/$personId/thumbnail", "person_thumb_$personId")
    }
    val sizeParam = if (size.x <= 250 && size.y <= 250) "thumbnail" else "preview"
    return downloadToTempFile("/assets/$assetId/thumbnail?size=$sizeParam", "preview_${assetId}_$sizeParam")
  }

  private fun queryAssetsFromDb(
    joinAndWhere: String,
    whereArgs: Array<String>,
    pageSize: Int,
    offset: Long
  ): List<ImmichAsset> {
    val db = openDatabase() ?: return emptyList()
    return try {
      val args = whereArgs.toMutableList()
      args.add(pageSize.toString())
      args.add(offset.toString())
      val cursor = db.rawQuery(
        """
        SELECT r.id, r.type, r.created_at, r.width, r.height,
               r.duration_in_seconds, r.is_favorite, r.name,
               e.file_size,
               COALESCE(e.orientation, '0') AS orientation
        FROM remote_asset_entity r
        LEFT JOIN remote_exif_entity e ON e.asset_id = r.id
        $joinAndWhere
        ORDER BY COALESCE(r.local_date_time, r.created_at) DESC
        LIMIT ? OFFSET ?
        """.trimIndent(),
        args.toTypedArray()
      )
      val assets = mutableListOf<ImmichAsset>()
      cursor.use {
        while (it.moveToNext()) assets.add(assetFromCursor(it))
      }
      assets
    } catch (e: Exception) {
      Log.e(TAG, "queryAssetsFromDb error", e)
      emptyList()
    } finally {
      db.close()
    }
  }

  private fun albumFromCursor(cursor: android.database.Cursor): ImmichAlbum {
    return ImmichAlbum(
      id = cursor.getString(0),
      displayName = cursor.getString(1),
      mediaCount = cursor.getInt(2),
      coverAssetId = if (cursor.isNull(3)) null else cursor.getString(3),
      dateTakenMillis = parseIso8601(cursor.getString(4))
    )
  }

  private fun inferMimeType(fileName: String, isImage: Boolean): String {
    val extension = fileName.substringAfterLast('.', "").lowercase()
    val mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
    if (mimeType != null) return mimeType
    return if (isImage) "image/jpeg" else "video/mp4"
  }

  private fun executeFirstSuccessful(path: String, requestBuilder: (okhttp3.HttpUrl) -> Request): okhttp3.Response? {
    for (url in buildUrls(path)) {
      try {
        val response = getClient().newCall(requestBuilder(url)).execute()
        if (response.isSuccessful) return response
        Log.e(TAG, "Request failed for ${url.host}: ${response.code}")
        response.close()
      } catch (e: Exception) {
        Log.e(TAG, "Request failed for ${url.host}", e)
      }
    }
    return null
  }
}
