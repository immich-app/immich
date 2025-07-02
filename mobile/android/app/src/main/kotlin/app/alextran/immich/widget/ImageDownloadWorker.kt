package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.datastore.preferences.core.Preferences
import androidx.glance.*
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

    fun cancel(context: Context, glanceId: GlanceId) {
      val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(glanceId)
      WorkManager.getInstance(context).cancelAllWorkByTag(appWidgetId.toString())
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
          updateWidget(glanceId, "", "", WidgetState.LOG_IN)
        }

        return Result.success()
      }

      // fetch new image
      val (newBitmap, subtitle) = when (widgetType) {
        WidgetType.RANDOM -> fetchRandom(serverConfig, widgetConfig)
        WidgetType.MEMORIES -> fetchMemory(serverConfig)
      }

      // clear current image if it exists
      if (!currentImgUUID.isNullOrEmpty()) {
        deleteImage(currentImgUUID)
      }

      // save a new image
      val imgUUID = UUID.randomUUID().toString()
      saveImage(newBitmap, imgUUID)

      // trigger the update routine with new image uuid
      updateWidget(glanceId, imgUUID, subtitle)

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
    widgetState: WidgetState = WidgetState.SUCCESS
  ) {
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs[kNow] = System.currentTimeMillis()
      prefs[kImageUUID] = imageUUID
      prefs[kWidgetState] = widgetState.toString()
      prefs[kSubtitleText] = subtitle ?: ""
    }

    PhotoWidget().update(context,glanceId)
  }

  private suspend fun fetchRandom(
    serverConfig: ServerConfig,
    widgetConfig: Preferences
  ): Pair<Bitmap, String?> {
    val api = ImmichAPI(serverConfig)

    val filters = SearchFilters(AssetType.IMAGE, size=1)
    val albumId = widgetConfig[kSelectedAlbum]
    val albumName = widgetConfig[kSelectedAlbumName]

    if (albumId != null) {
      filters.albumIds = listOf(albumId)
    }

    val random = api.fetchSearchResults(filters).first()
    val image = api.fetchImage(random)

    return Pair(image, albumName)
  }

  private suspend fun fetchMemory(
    serverConfig: ServerConfig
  ): Pair<Bitmap, String?> {
    val api = ImmichAPI(serverConfig)

    val today = LocalDate.now()
    val memories = api.fetchMemory(today)
    val asset: SearchResult
    var subtitle: String? = null

    if (memories.isNotEmpty()) {
      // pick a random asset from a random memory
      val memory = memories.random()
      asset = memory.assets.random()

      subtitle = "${today.year-memory.data.year} years ago"
    } else {
      val filters = SearchFilters(AssetType.IMAGE, size=1)
      asset = api.fetchSearchResults(filters).first()
    }

    val image = api.fetchImage(asset)
    return Pair(image, subtitle)
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
