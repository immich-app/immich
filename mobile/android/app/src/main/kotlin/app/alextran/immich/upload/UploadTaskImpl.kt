package app.alextran.immich.upload

import android.content.Context
import androidx.work.*
import app.alextran.immich.schema.AppDatabase
import app.alextran.immich.schema.AssetType
import app.alextran.immich.schema.StorageType
import app.alextran.immich.schema.StoreKey
import app.alextran.immich.schema.TaskStatus
import app.alextran.immich.schema.UploadMethod
import app.alextran.immich.schema.UploadTask
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await
import java.util.Date
import java.util.concurrent.TimeUnit

// TODO: this is almost entirely LLM-generated (ported from Swift), need to verify behavior
class UploadTaskImpl(context: Context) : UploadApi {
  private val ctx: Context = context.applicationContext
  private val db: AppDatabase = AppDatabase.getDatabase(ctx)
  private val workManager: WorkManager = WorkManager.getInstance(ctx)

  @Volatile
  private var isInitialized = false
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  override fun initialize(callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        // Clean up orphaned tasks
        val activeWorkInfos = workManager.getWorkInfosByTag(UPLOAD_WORK_TAG).await()
        val activeTaskIds = activeWorkInfos
          .filter { it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED }
          .mapNotNull {
            it.tags.find { tag -> tag.startsWith("task_") }?.substringAfter("task_")?.toLongOrNull()
          }
          .toSet()

        db.uploadTaskDao().run {
          withContext(Dispatchers.IO) {
            // Find tasks marked as queued but not actually running
            val dbQueuedIds = getTaskIdsByStatus(
              listOf(
                TaskStatus.DOWNLOAD_QUEUED,
                TaskStatus.UPLOAD_QUEUED,
                TaskStatus.UPLOAD_PENDING
              )
            )

            val orphanIds = dbQueuedIds.filterNot { it in activeTaskIds }

            if (orphanIds.isNotEmpty()) {
              resetOrphanedTasks(orphanIds)
            }
          }
        }

        // Clean up temp files
        val tempDir = getTempDirectory()
        tempDir.deleteRecursively()

        isInitialized = true
        startBackup()

        withContext(Dispatchers.Main) {
          callback(Result.success(Unit))
        }
      } catch (e: Exception) {
        withContext(Dispatchers.Main) {
          callback(Result.failure(e))
        }
      }
    }
  }

  override fun refresh(callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        startBackup()
        withContext(Dispatchers.Main) {
          callback(Result.success(Unit))
        }
      } catch (e: Exception) {
        withContext(Dispatchers.Main) {
          callback(Result.failure(e))
        }
      }
    }
  }

  private suspend fun startBackup() {
    if (!isInitialized) return

    withContext(Dispatchers.IO) {
      try {
        // Check if backup is enabled
        val backupEnabled = db.storeDao().get(StoreKey.enableBackup, StorageType.BoolStorage)
        if (backupEnabled != true) return@withContext

        // Get upload statistics
        val stats = db.uploadTaskStatDao().getStats() ?: return@withContext
        val availableSlots = TaskConfig.MAX_PENDING_UPLOADS + TaskConfig.MAX_PENDING_DOWNLOADS -
          (stats.pendingDownloads + stats.queuedDownloads + stats.pendingUploads + stats.queuedUploads)

        if (availableSlots <= 0) return@withContext

        // Find candidate assets for backup
        val candidates = db.localAssetDao().getCandidatesForBackup(availableSlots)

        if (candidates.isEmpty()) return@withContext

        // Create upload tasks for candidates
        db.uploadTaskDao().insertAll(candidates.map { candidate ->
          UploadTask(
            attempts = 0,
            createdAt = Date(),
            filePath = null,
            isLivePhoto = null,
            lastError = null,
            livePhotoVideoId = null,
            localId = candidate.id,
            method = UploadMethod.MULTIPART,
            priority = when (candidate.type) {
              AssetType.IMAGE -> 0.5f
              else -> 0.3f
            },
            retryAfter = null,
            status = TaskStatus.UPLOAD_PENDING
          )
        })

        // Start upload workers
        enqueueUploadWorkers()
      } catch (e: Exception) {
        android.util.Log.e(TAG, "Backup queue error", e)
      }
    }
  }

  private fun enqueueUploadWorkers() {
    // Create constraints
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    // Create work request
    val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
      .setConstraints(constraints)
      .addTag(UPLOAD_WORK_TAG)
      .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS
      )
      .build()

    workManager.enqueueUniqueWork(
      UPLOAD_WORK_NAME,
      ExistingWorkPolicy.KEEP,
      uploadWorkRequest
    )
  }

  private fun getTempDirectory(): java.io.File {
    return java.io.File(ctx.cacheDir, "upload_temp").apply {
      if (!exists()) mkdirs()
    }
  }

  companion object {
    private const val TAG = "UploadTaskImpl"
    private const val UPLOAD_WORK_TAG = "immich_upload"
    private const val UPLOAD_WORK_NAME = "immich_upload_unique"
  }
}
