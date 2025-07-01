package app.alextran.immich.widget

/*
 * Copyright (C) 2021 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import HomeWidgetGlanceState
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.glance.*
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.appwidget.updateAll
import androidx.glance.state.GlanceStateDefinition
import androidx.work.*
import com.google.gson.Gson
import es.antonborri.home_widget.HomeWidgetPlugin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.random.Random

class ImageDownloadWorker(
  private val context: Context,
  workerParameters: WorkerParameters
) : CoroutineWorker(context, workerParameters) {

  companion object {

    private val uniqueWorkName = ImageDownloadWorker::class.java.simpleName

    fun enqueue(context: Context, appWidgetId: Int, config: WidgetConfig) {
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
            .putString("config", Gson().toJson(config))
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

  private fun getServerConfig(): ServerConfig? {
    val prefs = HomeWidgetPlugin.getData(context)

    val serverURL = prefs.getString("widget_server_url", "") ?: ""
    val sessionKey = prefs.getString("widget_auth_token", "") ?: ""

    if (serverURL == "" || sessionKey == "") {
      return null
    }

    return ServerConfig(
      serverURL,
      sessionKey
    )
  }

  override suspend fun doWork(): Result {
    return try {
      val configString = inputData.getString("config")
      val config = Gson().fromJson(configString, WidgetConfig::class.java)
      val widgetId = inputData.getInt("widgetId", -1)

      val serverConfig = getServerConfig() ?: return Result.success()

      val newBitmap = when (config.widgetType) {
        WidgetType.RANDOM -> fetchRandom(serverConfig)
      }

      saveImage(newBitmap, widgetId)
      updateWidget(config, widgetId)

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

  private suspend fun updateWidget(config: WidgetConfig, widgetID: Int) {
    val manager = GlanceAppWidgetManager(context)
    val glanceId = manager.getGlanceIdBy(widgetID)

    RandomWidget().update(context, glanceId)

    Log.w("WIDGET_BG", "SENT THE UPDATE COMMAND: $widgetID")
  }

  private suspend fun fetchRandom(serverConfig: ServerConfig): Bitmap {
    val api = ImmichAPI(serverConfig)

    val random = api.fetchSearchResults(SearchFilters(AssetType.IMAGE, size=1))
    val image = api.fetchImage(random[0])

    return image
  }

  private suspend fun saveImage(bitmap: Bitmap, widgetId: Int) = withContext(Dispatchers.IO) {
    val file = File(context.cacheDir, "widget_image_$widgetId.jpg")
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
    }
  }
}
