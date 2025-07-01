package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
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
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition

class ImageDownloadWorker(
  private val context: Context,
  workerParameters: WorkerParameters
) : CoroutineWorker(context, workerParameters) {

  companion object {

    private val uniqueWorkName = ImageDownloadWorker::class.java.simpleName

    fun enqueue(context: Context, appWidgetId: Int, widgetType: WidgetType) {
      val manager = WorkManager.getInstance(context)

      val workRequest = PeriodicWorkRequestBuilder<ImageDownloadWorker>(
        20, TimeUnit.MINUTES
      )
        .setConstraints(
          Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        )
        .setInputData(
          Data.Builder()
            .putString("widgetType", widgetType.toString())
            .putInt("widgetId", appWidgetId)
            .build()
        )
        .addTag(appWidgetId.toString())
        .build()

      manager.enqueueUniquePeriodicWork(
        "$uniqueWorkName-$appWidgetId",
        ExistingPeriodicWorkPolicy.UPDATE,
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
      val widgetType = WidgetType.valueOf(inputData.getString("config") ?: "")
      val widgetId = inputData.getInt("widgetId", -1)
      val glanceId = GlanceAppWidgetManager(context).getGlanceIdBy(widgetId)
      val currentState = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
      val currentImgUUID = currentState[stringPreferencesKey("uuid")]

      val serverConfig = ImmichAPI.getServerConfig(context)

      // clear any image caches and go to "login" state if no credentials
      if (serverConfig == null) {
        if (!currentImgUUID.isNullOrEmpty()) {
          deleteImage(currentImgUUID)
          updateWidget(widgetType, glanceId, "", WidgetState.LOG_IN)
        }

        return Result.success()
      }

      // fetch new image
      val newBitmap = when (widgetType) {
        WidgetType.RANDOM -> fetchRandom(serverConfig, currentState)
      }

      // clear current image if it exists
      if (!currentImgUUID.isNullOrEmpty()) {
        deleteImage(currentImgUUID)
      }

      // save a new image
      val imgUUID = saveImage(newBitmap)

      // trigger the update routine with new image uuid
      updateWidget(widgetType, glanceId, imgUUID)

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

  private suspend fun updateWidget(type: WidgetType, glanceId: GlanceId, imageUUID: String, widgetState: WidgetState = WidgetState.SUCCESS) {
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs[longPreferencesKey("now")] = System.currentTimeMillis()
      prefs[stringPreferencesKey("uuid")] = imageUUID
      prefs[stringPreferencesKey("state")] = widgetState.toString()
    }

    when (type) {
      WidgetType.RANDOM -> RandomWidget().update(context,glanceId)
    }
  }

  private suspend fun fetchRandom(serverConfig: ServerConfig, widgetData: Preferences): Bitmap {
    val api = ImmichAPI(serverConfig)

    val filters = SearchFilters(AssetType.IMAGE, size=1)
    val albumId = widgetData[stringPreferencesKey("albumID")]

    if (albumId != null) {
      filters.albumIds = listOf(albumId)
    }

    val random = api.fetchSearchResults(filters)
    val image = api.fetchImage(random[0])

    return image
  }

  private suspend fun deleteImage(uuid: String) = withContext(Dispatchers.IO) {
    val file = File(context.cacheDir, "widget_image_$uuid.jpg")
    file.delete()
  }

  private suspend fun saveImage(bitmap: Bitmap): String = withContext(Dispatchers.IO) {
    val uuid = UUID.randomUUID().toString()
    val file = File(context.cacheDir, "widget_image_$uuid.jpg")
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
    }

    uuid
  }
}
