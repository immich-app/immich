package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.datastore.preferences.core.Preferences
import androidx.glance.*
import androidx.glance.appwidget.AppWidgetId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.TimeUnit
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import java.time.LocalDate

class ImageDownloadWorker(
  private val context: Context,
  workerParameters: WorkerParameters
) : CoroutineWorker(context, workerParameters) {

  companion object {

    private val uniqueWorkName = ImageDownloadWorker::class.java.simpleName

    private fun buildConstraints(): Constraints {
      return Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
    }

    private fun buildInputData(appWidgetId: Int, widgetType: WidgetType): Data {
      return Data.Builder()
        .putString(kWorkerWidgetType, widgetType.toString())
        .putInt(kWorkerWidgetID, appWidgetId)
        .build()
    }

    fun enqueuePeriodic(context: Context, appWidgetId: Int, widgetType: WidgetType) {
      val manager = WorkManager.getInstance(context)

      val workRequest = PeriodicWorkRequestBuilder<ImageDownloadWorker>(
        20, TimeUnit.MINUTES
      )
        .setConstraints(buildConstraints())
        .setInputData(buildInputData(appWidgetId, widgetType))
        .addTag(appWidgetId.toString())
        .build()

      manager.enqueueUniquePeriodicWork(
        "$uniqueWorkName-$appWidgetId",
        ExistingPeriodicWorkPolicy.UPDATE,
        workRequest
      )
    }

    fun singleShot(context: Context, appWidgetId: Int, widgetType: WidgetType) {
      val manager = WorkManager.getInstance(context)

      val workRequest = OneTimeWorkRequestBuilder<ImageDownloadWorker>()
        .setConstraints(buildConstraints())
        .setInputData(buildInputData(appWidgetId, widgetType))
        .addTag(appWidgetId.toString())
        .build()

      manager.enqueueUniqueWork(
        "$uniqueWorkName-$appWidgetId",
        ExistingWorkPolicy.REPLACE,
        workRequest
      )
    }

    suspend fun cancel(context: Context, appWidgetId: Int) {
      WorkManager.getInstance(context).cancelAllWorkByTag("$uniqueWorkName-$appWidgetId")

      // delete cached image
      val glanceId = GlanceAppWidgetManager(context).getGlanceIdBy(appWidgetId)
      val widgetConfig = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
      val currentImgUUID = widgetConfig[kImageUUID]

      if (!currentImgUUID.isNullOrEmpty()) {
        val file = File(context.cacheDir, imageFilename(currentImgUUID))
        file.delete()
      }
    }
  }

  override suspend fun doWork(): Result {
    return try {
      val widgetType = WidgetType.valueOf(inputData.getString(kWorkerWidgetType) ?: "")
      val widgetId = inputData.getInt(kWorkerWidgetID, -1)
      val glanceId = GlanceAppWidgetManager(context).getGlanceIdBy(widgetId)
      val widgetConfig = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
      val currentImgUUID = widgetConfig[kImageUUID]

      val serverConfig = ImmichAPI.getServerConfig(context)

      // clear any image caches and go to "login" state if no credentials
      if (serverConfig == null) {
        if (!currentImgUUID.isNullOrEmpty()) {
          deleteImage(currentImgUUID)
          updateWidget(
            glanceId,
            "",
            "",
            "immich://",
            WidgetState.LOG_IN
          )
        }

        return Result.success()
      }

      // fetch new image
      val entry = when (widgetType) {
        WidgetType.RANDOM -> fetchRandom(serverConfig, widgetConfig)
        WidgetType.MEMORIES -> fetchMemory(serverConfig)
      }

      // clear current image if it exists
      if (!currentImgUUID.isNullOrEmpty()) {
        deleteImage(currentImgUUID)
      }

      // save a new image
      val imgUUID = UUID.randomUUID().toString()
      saveImage(entry.image, imgUUID)

      // trigger the update routine with new image uuid
      updateWidget(glanceId, imgUUID, entry.subtitle, entry.deeplink)

      Result.success()
    } catch (e: Exception) {
      Log.e(uniqueWorkName, "Error while loading image", e)
      if (runAttemptCount < 10) {
        Result.retry()
      } else {
        Result.failure()
      }
    }
  }

  private suspend fun updateWidget(
    glanceId: GlanceId,
    imageUUID: String,
    subtitle: String?,
    deeplink: String?,
    widgetState: WidgetState = WidgetState.SUCCESS
  ) {
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs[kNow] = System.currentTimeMillis()
      prefs[kImageUUID] = imageUUID
      prefs[kWidgetState] = widgetState.toString()
      prefs[kSubtitleText] = subtitle ?: ""
      prefs[kDeeplinkURL] = deeplink ?: ""
    }

    PhotoWidget().update(context,glanceId)
  }

  private suspend fun fetchRandom(
    serverConfig: ServerConfig,
    widgetConfig: Preferences
  ): WidgetEntry {
    val api = ImmichAPI(serverConfig)

    val filters = SearchFilters(AssetType.IMAGE)
    val albumId = widgetConfig[kSelectedAlbum]
    val showSubtitle = widgetConfig[kShowAlbumName]
    val albumName = widgetConfig[kSelectedAlbumName]
    var subtitle: String? = if (showSubtitle == true) albumName else ""

    if (albumId != null) {
      filters.albumIds = listOf(albumId)
    }

    var randomSearch = api.fetchSearchResults(filters)

    // handle an empty album, fallback to random
    if (randomSearch.isEmpty() && albumId != null) {
      randomSearch = api.fetchSearchResults(SearchFilters(AssetType.IMAGE))
      subtitle = ""
    }

    val random = randomSearch.first()
    val image = api.fetchImage(random)

    return WidgetEntry(
      image,
      subtitle,
      assetDeeplink(random)
    )
  }

  private suspend fun fetchMemory(
    serverConfig: ServerConfig
  ): WidgetEntry {
    val api = ImmichAPI(serverConfig)

    val today = LocalDate.now()
    val memories = api.fetchMemory(today)
    val asset: Asset
    var subtitle: String? = null

    if (memories.isNotEmpty()) {
      // pick a random asset from a random memory
      val memory = memories.random()
      asset = memory.assets.random()

      val yearDiff = today.year - memory.data.year
      subtitle = "$yearDiff ${if (yearDiff == 1) "year" else "years"} ago"
    } else {
      val filters = SearchFilters(AssetType.IMAGE, size=1)
      asset = api.fetchSearchResults(filters).first()
    }

    val image = api.fetchImage(asset)
    return WidgetEntry(
      image,
      subtitle,
      assetDeeplink(asset)
    )
  }

  private suspend fun deleteImage(uuid: String) = withContext(Dispatchers.IO) {
    val file = File(context.cacheDir, imageFilename(uuid))
    file.delete()
  }

  private suspend fun saveImage(bitmap: Bitmap, uuid: String) = withContext(Dispatchers.IO) {
    val file = File(context.cacheDir, imageFilename(uuid))
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
    }
  }
}
