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

import android.content.Context
import android.content.Intent
import android.content.Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
import android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.util.Log
import androidx.core.content.FileProvider.getUriForFile
import androidx.glance.*
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import androidx.work.*
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.random.Random

class ImageDownloadWorker(
  private val context: Context,
  workerParameters: WorkerParameters
) : CoroutineWorker(context, workerParameters) {

  companion object {

    private val uniqueWorkName = ImageDownloadWorker::class.java.simpleName

    fun enqueue(context: Context, glanceId: GlanceId, config: WidgetConfig) {
      val manager = WorkManager.getInstance(context)
      val requestBuilder = OneTimeWorkRequestBuilder<ImageDownloadWorker>().apply {
        addTag(glanceId.toString())
        setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
        setInputData(
          Data.Builder()
            .putString("config", Gson().toJson(config))
            .putInt("glanceId", glanceId.hashCode())
            .build()
        )
      }

      manager.enqueueUniqueWork(
        uniqueWorkName + glanceId.hashCode(),
        ExistingWorkPolicy.KEEP,
        requestBuilder.build()
      )
    }

    /**
     * Cancel any ongoing worker
     */
    fun cancel(context: Context, glanceId: GlanceId) {
      WorkManager.getInstance(context).cancelAllWorkByTag(glanceId.toString())
    }
  }

  override suspend fun doWork(): Result {
    return try {
      val configString = inputData.getString("config")
      val config = Gson().fromJson(configString, WidgetConfig::class.java)
      val glanceId = inputData.getInt("glanceId", -1)

      if (glanceId == -1) {
        Result.failure()
      }

      fetchImage(config, glanceId)
      updateWidget(config, glanceId)

      Result.success()
    } catch (e: Exception) {
      Log.e(uniqueWorkName, "Error while loading image", e)
      if (runAttemptCount < 10) {
        // Exponential backoff strategy will avoid the request to repeat
        // too fast in case of failures.
        Result.retry()
      } else {
        Result.failure()
      }
    }
  }

  private suspend fun updateWidget(config: WidgetConfig, glanceId: Int) {
    val manager = GlanceAppWidgetManager(context)
    val glanceIds = manager.getGlanceIds(config.widgetType.widgetClass)

    for (id in glanceIds) {
      if (id.hashCode() == glanceId) {
        config.widgetType.widgetClass.getDeclaredConstructor().newInstance().updateAll(context)
        break
      }
    }
  }

  private suspend fun fetchImage(config: WidgetConfig, glanceId: Int) {
    val api = ImmichAPI(config.credentials)

    val random = api.fetchSearchResults(SearchFilters(AssetType.IMAGE, size=1))
    val image = api.fetchImage(random[0])

    saveImage(image, glanceId)
  }

  private suspend fun saveImage(bitmap: Bitmap, glanceId: Int) = withContext(Dispatchers.IO) {
    val file = File(context.cacheDir, "widget_image_$glanceId.jpg")
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
    }
  }
}
