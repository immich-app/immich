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
import android.util.Log
import androidx.compose.ui.unit.DpSize
import androidx.core.content.FileProvider.getUriForFile
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import coil.annotation.ExperimentalCoilApi
import coil.imageLoader
import coil.memory.MemoryCache
import coil.request.ErrorResult
import coil.request.ImageRequest
import com.example.android.appwidget.glance.toPx
import java.time.Duration
import kotlin.math.roundToInt


class ImageDownloadWorker(
  private val context: Context,
  workerParameters: WorkerParameters
) : CoroutineWorker(context, workerParameters) {

  companion object {

    private val uniqueWorkName = ImageDownloadWorker::class.java.simpleName

    fun enqueue(context: Context, size: DpSize, glanceId: GlanceId, force: Boolean = false) {
      val manager = WorkManager.getInstance(context)
      val requestBuilder = OneTimeWorkRequestBuilder<ImageDownloadWorker>().apply {
        addTag(glanceId.toString())
        setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
        setInputData(
          Data.Builder()
            .putFloat("width", size.width.value.toPx)
            .putFloat("height", size.height.value.toPx)
            .putBoolean("force", force)
            .build()
        )
      }
      val workPolicy = if (force) {
        ExistingWorkPolicy.REPLACE
      } else {
        ExistingWorkPolicy.KEEP
      }

      manager.enqueueUniqueWork(
        uniqueWorkName + size.width + size.height,
        workPolicy,
        requestBuilder.build()
      )

      // Temporary workaround to avoid WM provider to disable itself and trigger an
      // app widget update
      manager.enqueueUniqueWork(
        "$uniqueWorkName-workaround",
        ExistingWorkPolicy.KEEP,
        OneTimeWorkRequestBuilder<ImageWorker>().apply {
          setInitialDelay(Duration.ofDays(365))
        }.build()
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
      val width = inputData.getFloat("width", 0f)
      val height = inputData.getFloat("height", 0f)
      val force = inputData.getBoolean("force", false)
      val uri = getRandomImage(width, height, force)
      updateImageWidget(width, height, uri)
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

  private suspend fun updateImageWidget(width: Float, height: Float, uri: String) {
    val manager = GlanceAppWidgetManager(context)
    val glanceIds = manager.getGlanceIds(ImageGlanceWidget::class.java)
    glanceIds.forEach { glanceId ->
      updateAppWidgetState(context, glanceId) { prefs ->
        prefs[ImageGlanceWidget.getImageKey(width, height)] = uri
        prefs[ImageGlanceWidget.sourceKey] = "Picsum Photos"
        prefs[ImageGlanceWidget.sourceUrlKey] = "https://picsum.photos/"
      }
    }
    ImageGlanceWidget().updateAll(context)
  }

  /**
   * Use Coil and Picsum Photos to randomly load images into the cache based on the provided
   * size. This method returns the path of the cached image, which you can send to the widget.
   */
  @OptIn(ExperimentalCoilApi::class)
  private suspend fun getRandomImage(width: Float, height: Float, force: Boolean): String {
    val url = "https://picsum.photos/${width.roundToInt()}/${height.roundToInt()}"
    val request = ImageRequest.Builder(context)
      .data(url)
      .build()

    // Request the image to be loaded and throw error if it failed
    with(context.imageLoader) {
      if (force) {
        diskCache?.remove(url)
        memoryCache?.remove(MemoryCache.Key(url))
      }
      val result = execute(request)
      if (result is ErrorResult) {
        throw result.throwable
      }
    }

    // Get the path of the loaded image from DiskCache.
    val path = context.imageLoader.diskCache?.get(url)?.use { snapshot ->
      val imageFile = snapshot.data.toFile()

      // Use the FileProvider to create a content URI
      val contentUri = getUriForFile(
        context,
        "com.example.android.appwidget.fileprovider",
        imageFile
      )

      // Find the current launcher everytime to ensure it has read permissions
      val resolveInfo = context.packageManager.resolveActivity(
        Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_HOME) },
        PackageManager.MATCH_DEFAULT_ONLY
      )
      val launcherName = resolveInfo?.activityInfo?.packageName
      if (launcherName != null) {
        context.grantUriPermission(
          launcherName,
          contentUri,
          FLAG_GRANT_READ_URI_PERMISSION or FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        )
      }

      // return the path
      contentUri.toString()
    }
    return requireNotNull(path) {
      "Couldn't find cached file"
    }
  }
}
