package app.alextran.immich.wallpaper

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import java.security.MessageDigest

const val kDynamicWallpaperPrefsName = "dynamic_wallpaper"
const val kDynamicWallpaperDirectoryName = "dynamic_wallpaper"
const val kDynamicWallpaperConfigVersion = 4

private const val kEnabled = "enabled"
private const val kAssetIds = "assetIds"
private const val kAssetRefs = "assetRefs"
private const val kActiveIndex = "activeIndex"
private const val kConfigVersion = "configVersion"
private const val kPreparationErrors = "preparationErrors"
private const val kLastPreparationError = "lastPreparationError"

data class DynamicWallpaperConfig(
  val enabled: Boolean,
  val assetRefs: List<DynamicWallpaperAssetRef>,
  val activeIndex: Int,
  val configVersion: Int,
) {
  val assetIds: List<String>
    get() = assetRefs.map { it.remoteId }
}

private data class StoredDynamicWallpaperAssetRef(
  val remoteId: String = "",
  val localId: String? = null,
  val isEdited: Boolean = false,
)

object DynamicWallpaperRotation {
  fun refsFromAssetIds(assetIds: Iterable<String>): List<DynamicWallpaperAssetRef> {
    return deduplicateRefsPreservingOrder(assetIds.map { DynamicWallpaperAssetRef(remoteId = it, isEdited = false) })
  }

  fun deduplicatePreservingOrder(assetIds: Iterable<String>): List<String> {
    return refsFromAssetIds(assetIds).map { it.remoteId }
  }

  fun deduplicateRefsPreservingOrder(assetRefs: Iterable<DynamicWallpaperAssetRef>): List<DynamicWallpaperAssetRef> {
    val seen = linkedSetOf<String>()
    val result = mutableListOf<DynamicWallpaperAssetRef>()
    assetRefs.forEach { assetRef ->
      val remoteId = assetRef.remoteId.trim()
      if (remoteId.isNotBlank() && seen.add(remoteId)) {
        result.add(
          DynamicWallpaperAssetRef(
            remoteId = remoteId,
            localId = assetRef.localId?.takeIf { it.isNotBlank() },
            isEdited = assetRef.isEdited,
          )
        )
      }
    }
    return result
  }

  fun normalizeActiveIndex(activeIndex: Int, assetCount: Int): Int {
    if (assetCount <= 0) {
      return 0
    }
    return activeIndex.floorMod(assetCount)
  }

  fun nextAvailableIndex(config: DynamicWallpaperConfig, exists: (String) -> Boolean): Int? {
    return availableIndexFrom(config, config.activeIndex + 1, exists)
  }

  fun currentOrFirstAvailableIndex(config: DynamicWallpaperConfig, exists: (String) -> Boolean): Int? {
    if (config.assetIds.isEmpty()) {
      return null
    }

    val activeIndex = normalizeActiveIndex(config.activeIndex, config.assetIds.size)
    if (exists(config.assetIds[activeIndex])) {
      return activeIndex
    }

    return availableIndexFrom(config, activeIndex + 1, exists)
  }

  private fun availableIndexFrom(config: DynamicWallpaperConfig, startIndex: Int, exists: (String) -> Boolean): Int? {
    val assetIds = config.assetIds
    if (assetIds.isEmpty()) {
      return null
    }

    val normalizedStart = normalizeActiveIndex(startIndex, assetIds.size)
    for (offset in assetIds.indices) {
      val index = (normalizedStart + offset).floorMod(assetIds.size)
      if (exists(assetIds[index])) {
        return index
      }
    }

    return null
  }

  private fun Int.floorMod(modulus: Int): Int = ((this % modulus) + modulus) % modulus
}

object DynamicWallpaperConfigStore {
  private val gson = Gson()
  private val listType = object : TypeToken<List<String>>() {}.type
  private val refListType = object : TypeToken<List<StoredDynamicWallpaperAssetRef>>() {}.type
  private val errorMapType = object : TypeToken<Map<String, String>>() {}.type

  fun read(context: Context): DynamicWallpaperConfig {
    val prefs = prefs(context)
    val assetRefs = readAssetRefs(prefs)
    val activeIndex = DynamicWallpaperRotation.normalizeActiveIndex(
      prefs.getInt(kActiveIndex, 0),
      assetRefs.size,
    )
    val configVersion = prefs.getInt(kConfigVersion, 0)
    if (configVersion < kDynamicWallpaperConfigVersion) {
      preparedDirectory(context).deleteRecursively()
    }
    if (configVersion < kDynamicWallpaperConfigVersion || !prefs.contains(kAssetRefs)) {
      prefs.edit()
        .putString(kAssetRefs, gson.toJson(assetRefs.map { it.toStored() }))
        .putString(kAssetIds, gson.toJson(assetRefs.map { it.remoteId }))
        .putInt(kConfigVersion, kDynamicWallpaperConfigVersion)
        .putInt(kActiveIndex, activeIndex)
        .apply()
    }

    return DynamicWallpaperConfig(
      enabled = prefs.getBoolean(kEnabled, assetRefs.isNotEmpty()),
      assetRefs = assetRefs,
      activeIndex = activeIndex,
      configVersion = kDynamicWallpaperConfigVersion,
    )
  }

  fun writeSelection(context: Context, assetRefs: List<DynamicWallpaperAssetRef>, resetActiveIndex: Boolean = true) {
    val normalizedAssetRefs = DynamicWallpaperRotation.deduplicateRefsPreservingOrder(assetRefs)
    val prefs = prefs(context)
    if (prefs.getInt(kConfigVersion, 0) < kDynamicWallpaperConfigVersion) {
      preparedDirectory(context).deleteRecursively()
    }
    val activeIndex = if (resetActiveIndex) {
      0
    } else {
      DynamicWallpaperRotation.normalizeActiveIndex(prefs.getInt(kActiveIndex, 0), normalizedAssetRefs.size)
    }

    prefs.edit()
      .putBoolean(kEnabled, normalizedAssetRefs.isNotEmpty())
      .putString(kAssetRefs, gson.toJson(normalizedAssetRefs.map { it.toStored() }))
      .putString(kAssetIds, gson.toJson(normalizedAssetRefs.map { it.remoteId }))
      .putInt(kActiveIndex, activeIndex)
      .putInt(kConfigVersion, kDynamicWallpaperConfigVersion)
      .remove(kPreparationErrors)
      .remove(kLastPreparationError)
      .apply()
  }

  fun writeActiveIndex(context: Context, activeIndex: Int) {
    prefs(context).edit()
      .putInt(kActiveIndex, activeIndex.coerceAtLeast(0))
      .putInt(kConfigVersion, kDynamicWallpaperConfigVersion)
      .apply()
  }

  fun writePreparationErrors(context: Context, errors: Map<String, String>, lastError: String?) {
    prefs(context).edit()
      .putString(kPreparationErrors, gson.toJson(errors))
      .putString(kLastPreparationError, lastError)
      .putInt(kConfigVersion, kDynamicWallpaperConfigVersion)
      .apply()
  }

  fun readPreparationErrors(context: Context): Map<String, String> {
    val raw = prefs(context).getString(kPreparationErrors, "{}") ?: "{}"
    return runCatching {
      gson.fromJson<Map<String, String>>(raw, errorMapType) ?: emptyMap()
    }.getOrDefault(emptyMap())
  }

  fun readLastPreparationError(context: Context): String? {
    return prefs(context).getString(kLastPreparationError, null)
  }

  fun preparedDirectory(context: Context): File {
    return File(context.filesDir, kDynamicWallpaperDirectoryName).apply { mkdirs() }
  }

  fun preparedFile(context: Context, assetId: String): File {
    return File(preparedDirectory(context), "${stableFileStem(assetId)}.jpg")
  }

  fun hasPreparedFile(context: Context, assetId: String): Boolean {
    return preparedFile(context, assetId).isFile
  }

  fun status(context: Context): DynamicWallpaperStatus {
    val config = read(context)
    val errors = readPreparationErrors(context).filterKeys { it in config.assetIds }
    val preparedCount = config.assetIds.count { hasPreparedFile(context, it) }

    return DynamicWallpaperStatus(
      enabled = config.enabled,
      selectedCount = config.assetIds.size.toLong(),
      preparedCount = preparedCount.toLong(),
      missingCount = (config.assetIds.size - preparedCount).coerceAtLeast(0).toLong(),
      failedCount = errors.size.toLong(),
      lastError = readLastPreparationError(context),
    )
  }

  private fun prefs(context: Context): SharedPreferences {
    return context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE)
  }

  private fun readAssetIds(prefs: SharedPreferences): List<String> {
    val raw = prefs.getString(kAssetIds, "[]") ?: "[]"
    return runCatching {
      val decoded = gson.fromJson<List<String>>(raw, listType) ?: emptyList()
      DynamicWallpaperRotation.deduplicatePreservingOrder(decoded)
    }.getOrDefault(emptyList())
  }

  private fun readAssetRefs(prefs: SharedPreferences): List<DynamicWallpaperAssetRef> {
    val raw = prefs.getString(kAssetRefs, null)
    if (raw != null) {
      val refs = runCatching {
        gson.fromJson<List<StoredDynamicWallpaperAssetRef>>(raw, refListType)
          ?.map { it.toRef() }
          .orEmpty()
      }.getOrDefault(emptyList())

      return DynamicWallpaperRotation.deduplicateRefsPreservingOrder(refs)
    }

    return DynamicWallpaperRotation.refsFromAssetIds(readAssetIds(prefs))
  }

  private fun DynamicWallpaperAssetRef.toStored(): StoredDynamicWallpaperAssetRef {
    return StoredDynamicWallpaperAssetRef(remoteId = remoteId, localId = localId, isEdited = isEdited)
  }

  private fun StoredDynamicWallpaperAssetRef.toRef(): DynamicWallpaperAssetRef {
    return DynamicWallpaperAssetRef(remoteId = remoteId, localId = localId, isEdited = isEdited)
  }

  private fun stableFileStem(assetId: String): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest(assetId.toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
  }
}
