package app.alextran.immich.upload

import android.content.Context
import android.provider.MediaStore
import androidx.work.*
import app.alextran.immich.schema.AppDatabase
import app.alextran.immich.schema.AssetType
import app.alextran.immich.schema.LocalAssetTaskData
import app.alextran.immich.schema.StorageType
import app.alextran.immich.schema.StoreKey
import app.alextran.immich.schema.TaskStatus
import app.alextran.immich.schema.UploadErrorCode
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import java.io.File
import java.io.IOException
import java.net.URL
import java.util.*
import java.util.concurrent.TimeUnit

class UploadWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {

  private val db = AppDatabase.getDatabase(applicationContext)
  private val client = createOkHttpClient()

  override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
    try {
      // Check if backup is enabled
      val backupEnabled = db.storeDao().get(StoreKey.enableBackup, StorageType.BoolStorage)
      if (backupEnabled != true) {
        return@withContext Result.success()
      }

      // Get pending upload tasks
      val tasks = db.uploadTaskDao().getTasksForUpload(TaskConfig.MAX_ACTIVE_UPLOADS)

      if (tasks.isEmpty()) {
        return@withContext Result.success()
      }

      // Process tasks concurrently
      val results = tasks.map { task ->
        async { processUploadTask(task) }
      }.awaitAll()

      // Check if we should continue processing
      val hasMore = db.uploadTaskDao().hasPendingTasks()

      if (hasMore) {
        // Schedule next batch
        enqueueNextBatch()
      }

      // Determine result based on processing outcomes
      when {
        results.all { it } -> Result.success()
        results.any { it } -> Result.success() // Partial success
        else -> Result.retry()
      }
    } catch (e: Exception) {
      android.util.Log.e(TAG, "Upload worker error", e)
      Result.retry()
    }
  }

  private suspend fun processUploadTask(task: LocalAssetTaskData): Boolean {
    return try {
      // Get asset from MediaStore
      val assetUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        .buildUpon()
        .appendPath(task.localId)
        .build()

      val cursor = applicationContext.contentResolver.query(
        assetUri,
        arrayOf(MediaStore.Images.Media.DATA),
        null,
        null,
        null
      ) ?: return handleFailure(task, UploadErrorCode.ASSET_NOT_FOUND)

      val filePath = cursor.use {
        if (it.moveToFirst()) {
          it.getString(it.getColumnIndexOrThrow(MediaStore.Images.Media.DATA))
        } else null
      } ?: return handleFailure(task, UploadErrorCode.ASSET_NOT_FOUND)

      val file = File(filePath)
      if (!file.exists()) {
        return handleFailure(task, UploadErrorCode.FILE_NOT_FOUND)
      }

      // Get server configuration
      val serverUrl = db.storeDao().get(StoreKey.serverEndpoint, StorageType.UrlStorage)
        ?: return handleFailure(task, UploadErrorCode.NO_SERVER_URL)
      val accessToken = db.storeDao().get(StoreKey.accessToken, StorageType.StringStorage)
        ?: return handleFailure(task, UploadErrorCode.NO_ACCESS_TOKEN)
      val deviceId = db.storeDao().get(StoreKey.deviceId, StorageType.StringStorage)
        ?: return handleFailure(task, UploadErrorCode.NO_DEVICE_ID)

      // Check network constraints
      val useWifiOnly = when (task.type) {
        AssetType.IMAGE -> db.storeDao().get(StoreKey.useWifiForUploadPhotos, StorageType.BoolStorage) ?: false
        AssetType.VIDEO -> db.storeDao().get(StoreKey.useWifiForUploadVideos, StorageType.BoolStorage) ?: false
        else -> false
      }

      if (useWifiOnly && !NetworkMonitor.isWifiConnected(applicationContext)) {
        // Wait for WiFi
        return true
      }

      // Update task status
      db.uploadTaskDao().updateStatus(task.taskId, TaskStatus.UPLOAD_QUEUED)

      // Perform upload
      uploadFile(task, file, serverUrl, accessToken, deviceId)

      // Mark as complete
      db.uploadTaskDao().updateStatus(task.taskId, TaskStatus.UPLOAD_COMPLETE)

      true
    } catch (e: Exception) {
      android.util.Log.e(TAG, "Upload task ${task.taskId} failed", e)
      handleFailure(task, UploadErrorCode.UNKNOWN)
    }
  }

  private suspend fun uploadFile(
    task: LocalAssetTaskData,
    file: File,
    serverUrl: URL,
    accessToken: String,
    deviceId: String
  ) {
    val requestBody = createMultipartBody(task, file, deviceId)

    val request = Request.Builder()
      .url("${serverUrl}/api/upload")
      .post(requestBody)
      .header("x-immich-user-token", accessToken)
      .tag(task.taskId)
      .build()

    client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw IOException("Upload failed: ${response.code}")
      }
    }
  }

  private fun createMultipartBody(
    task: LocalAssetTaskData,
    file: File,
    deviceId: String
  ): RequestBody {
    val boundary = "Boundary-${UUID.randomUUID()}"

    return object : RequestBody() {
      override fun contentType() = "multipart/form-data; boundary=$boundary".toMediaType()

      override fun writeTo(sink: okio.BufferedSink) {
        // Write form fields
        writeFormField(sink, boundary, "deviceAssetId", task.localId)
        writeFormField(sink, boundary, "deviceId", deviceId)
        writeFormField(sink, boundary, "fileCreatedAt", (task.createdAt.time / 1000).toString())
        writeFormField(sink, boundary, "fileModifiedAt", (task.updatedAt.time / 1000).toString())
        writeFormField(sink, boundary, "fileName", task.fileName)
        writeFormField(sink, boundary, "isFavorite", task.isFavorite.toString())

        // Write file
        sink.writeUtf8("--$boundary\r\n")
        sink.writeUtf8("Content-Disposition: form-data; name=\"assetData\"; filename=\"asset\"\r\n")
        sink.writeUtf8("Content-Type: application/octet-stream\r\n\r\n")

        file.inputStream().use { input ->
          val buffer = ByteArray(8192)
          var bytesRead: Int
          while (input.read(buffer).also { bytesRead = it } != -1) {
            sink.write(buffer, 0, bytesRead)

            // Report progress (simplified - could be enhanced with listeners)
            setProgressAsync(
              workDataOf(
                PROGRESS_TASK_ID to task.taskId,
                PROGRESS_BYTES to file.length()
              )
            )
          }
        }

        sink.writeUtf8("\r\n--$boundary--\r\n")
      }

      private fun writeFormField(sink: okio.BufferedSink, boundary: String, name: String, value: String) {
        sink.writeUtf8("--$boundary\r\n")
        sink.writeUtf8("Content-Disposition: form-data; name=\"$name\"\r\n\r\n")
        sink.writeUtf8(value)
        sink.writeUtf8("\r\n")
      }
    }
  }

  private suspend fun handleFailure(task: LocalAssetTaskData, code: UploadErrorCode): Boolean {
    val newAttempts = task.attempts + 1
    val status = if (newAttempts >= TaskConfig.MAX_ATTEMPTS) {
      TaskStatus.UPLOAD_FAILED
    } else {
      TaskStatus.UPLOAD_PENDING
    }

    val retryAfter = if (status == TaskStatus.UPLOAD_PENDING) {
      Date(System.currentTimeMillis() + (Math.pow(3.0, newAttempts.toDouble()) * 1000).toLong())
    } else null

    db.uploadTaskDao().updateTaskAfterFailure(
      task.taskId,
      newAttempts,
      code,
      status,
      retryAfter
    )

    return false
  }

  private fun enqueueNextBatch() {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    val nextWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
      .setConstraints(constraints)
      .addTag(UPLOAD_WORK_TAG)
      .setInitialDelay(1, TimeUnit.SECONDS)
      .build()

    WorkManager.getInstance(applicationContext)
      .enqueueUniqueWork(
        UPLOAD_WORK_NAME,
        ExistingWorkPolicy.KEEP,
        nextWorkRequest
      )
  }

  private fun createOkHttpClient(): OkHttpClient {
    return OkHttpClient.Builder()
      .connectTimeout(30, TimeUnit.SECONDS)
      .readTimeout(300, TimeUnit.SECONDS)
      .writeTimeout(300, TimeUnit.SECONDS)
      .build()
  }

  companion object {
    private const val TAG = "UploadWorker"
    private const val UPLOAD_WORK_TAG = "immich_upload"
    private const val UPLOAD_WORK_NAME = "immich_upload_unique"
    const val PROGRESS_TASK_ID = "progress_task_id"
    const val PROGRESS_BYTES = "progress_bytes"
  }
}
