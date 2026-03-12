package app.alextran.immich.widget

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.Preferences
import androidx.glance.*
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.work.*
import java.util.concurrent.TimeUnit
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import app.alextran.immich.widget.model.*
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
        "$uniqueWorkName-$appWidgetId-singleShot",
        ExistingWorkPolicy.REPLACE,
        workRequest
      )
    }

    fun cancel(context: Context, appWidgetId: Int) {
      WorkManager.getInstance(context).cancelAllWorkByTag("$uniqueWorkName-$appWidgetId")
    }
  }

  override suspend fun doWork(): Result {
    return try {
      val widgetType = WidgetType.valueOf(inputData.getString(kWorkerWidgetType) ?: "")
      val widgetId = inputData.getInt(kWorkerWidgetID, -1)
      val glanceId = GlanceAppWidgetManager(context).getGlanceIdBy(widgetId)
      val widgetConfig = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
      // clear state and go to "login" if no credentials
      if (!ImmichAPI.isLoggedIn(context)) {
        val currentAssetId = widgetConfig[kAssetId]
        if (!currentAssetId.isNullOrEmpty()) {
          updateWidget(glanceId, "", "", "immich://", WidgetState.LOG_IN)
        }

        return Result.success()
      }

      val entry = when (widgetType) {
        WidgetType.RANDOM -> fetchRandom(widgetConfig)
        WidgetType.MEMORIES -> fetchMemory()
      }

      updateWidget(glanceId, entry.assetId, entry.subtitle, entry.deeplink)

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
    assetId: String,
    subtitle: String?,
    deeplink: String?,
    widgetState: WidgetState = WidgetState.SUCCESS
  ) {
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs[kNow] = System.currentTimeMillis()
      prefs[kAssetId] = assetId
      prefs[kWidgetState] = widgetState.toString()
      prefs[kSubtitleText] = subtitle ?: ""
      prefs[kDeeplinkURL] = deeplink ?: ""
    }

    PhotoWidget().update(context, glanceId)
  }

  private suspend fun fetchRandom(
    widgetConfig: Preferences
  ): WidgetEntry {
    val filters = SearchFilters()
    val albumId = widgetConfig[kSelectedAlbum]
    val showSubtitle = widgetConfig[kShowAlbumName]
    val albumName = widgetConfig[kSelectedAlbumName]
    var subtitle: String? = if (showSubtitle == true) albumName else ""


    if (albumId == "FAVORITES") {
      filters.isFavorite = true
    } else if (albumId != null) {
      filters.albumIds = listOf(albumId)
    }

    var randomSearch = ImmichAPI.fetchSearchResults(filters)

    // handle an empty album, fallback to random
    if (randomSearch.isEmpty() && albumId != null) {
      randomSearch = ImmichAPI.fetchSearchResults(SearchFilters())
      subtitle = ""
    }

    val random = randomSearch.first()
    ImmichAPI.fetchImage(random).free() // warm the HTTP disk cache

    return WidgetEntry(
      random.id,
      subtitle,
      assetDeeplink(random)
    )
  }

  private suspend fun fetchMemory(): WidgetEntry {
    val today = LocalDate.now()
    val memories = ImmichAPI.fetchMemory(today)
    val asset: Asset
    var subtitle: String? = null

    if (memories.isNotEmpty()) {
      // pick a random asset from a random memory
      val memory = memories.random()
      asset = memory.assets.random()

      val yearDiff = today.year - memory.data.year
      subtitle = "$yearDiff ${if (yearDiff == 1) "year" else "years"} ago"
    } else {
      val filters = SearchFilters(size=1)
      asset = ImmichAPI.fetchSearchResults(filters).first()
    }

    ImmichAPI.fetchImage(asset).free() // warm the HTTP disk cache
    return WidgetEntry(
      asset.id,
      subtitle,
      assetDeeplink(asset)
    )
  }

}
