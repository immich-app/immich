package app.alextran.immich.schema

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import app.alextran.immich.upload.TaskConfig
import java.util.Date

@Dao
interface LocalAssetDao {
  @Query("""
        SELECT a.id, a.type FROM local_asset_entity a
        WHERE EXISTS (
            SELECT 1 FROM local_album_asset_entity laa
            INNER JOIN local_album_entity la ON laa.album_id = la.id
            WHERE laa.asset_id = a.id
            AND la.backup_selection = 0 -- selected
        )
        AND NOT EXISTS (
            SELECT 1 FROM local_album_asset_entity laa2
            INNER JOIN local_album_entity la2 ON laa2.album_id = la2.id
            WHERE laa2.asset_id = a.id
            AND la2.backup_selection = 2 -- excluded
        )
        AND NOT EXISTS (
            SELECT 1 FROM remote_asset_entity ra
            WHERE ra.checksum = a.checksum
            AND ra.owner_id = (SELECT string_value FROM store_entity WHERE id = 14) -- current_user
        )
        AND NOT EXISTS (
            SELECT 1 FROM upload_tasks ut
            WHERE ut.local_id = a.id
        )
        LIMIT :limit
    """)
  suspend fun getCandidatesForBackup(limit: Int): List<BackupCandidate>
}

@Dao
interface StoreDao {
  @Query("SELECT * FROM store_entity WHERE id = :key")
  suspend fun get(key: StoreKey): Store?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insert(store: Store)

  // Extension functions for type-safe access
  suspend fun <T> get(
    typedKey: TypedStoreKey<T>,
    storage: StorageType<T>
  ): T? {
    val store = get(typedKey.key) ?: return null

    return when (storage) {
      is StorageType.IntStorage,
      is StorageType.BoolStorage,
      is StorageType.DateStorage -> {
        store.intValue?.let { storage.fromDb(it) }
      }
      else -> {
        store.stringValue?.let { storage.fromDb(it) }
      }
    }
  }

  suspend fun <T> set(
    typedKey: TypedStoreKey<T>,
    value: T,
    storage: StorageType<T>
  ) {
    val dbValue = storage.toDb(value)

    val store = when (storage) {
      is StorageType.IntStorage,
      is StorageType.BoolStorage,
      is StorageType.DateStorage -> {
        Store(
          id = typedKey.key,
          stringValue = null,
          intValue = dbValue as Int
        )
      }
      else -> {
        Store(
          id = typedKey.key,
          stringValue = dbValue as String,
          intValue = null
        )
      }
    }

    insert(store)
  }
}

@Dao
interface UploadTaskDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertAll(tasks: List<UploadTask>)

  @Query("""
        SELECT id FROM upload_tasks
        WHERE status IN (:statuses)
    """)
  suspend fun getTaskIdsByStatus(statuses: List<TaskStatus>): List<Long>

  @Query("""
        UPDATE upload_tasks
        SET status = 3, -- upload_pending
            file_path = NULL,
            attempts = 0
        WHERE id IN (:taskIds)
    """)
  suspend fun resetOrphanedTasks(taskIds: List<Long>)

  @Query("""
        SELECT
            t.attempts,
            a.checksum,
            a.created_at as createdAt,
            a.name as fileName,
            t.file_path as filePath,
            a.is_favorite as isFavorite,
            a.id as localId,
            t.priority,
            t.id as taskId,
            a.type,
            a.updated_at as updatedAt
        FROM upload_tasks t
        INNER JOIN local_asset_entity a ON t.local_id = a.id
        WHERE t.status = 3 -- upload_pending
        AND t.attempts < :maxAttempts
        AND a.checksum IS NOT NULL
        AND (t.retry_after IS NULL OR t.retry_after <= :currentTime)
        ORDER BY t.priority DESC, t.created_at ASC
        LIMIT :limit
    """)
  suspend fun getTasksForUpload(limit: Int, maxAttempts: Int = TaskConfig.MAX_ATTEMPTS, currentTime: Long = System.currentTimeMillis() / 1000): List<LocalAssetTaskData>

  @Query("SELECT EXISTS(SELECT 1 FROM upload_tasks WHERE status = 3 LIMIT 1)") // upload_pending
  suspend fun hasPendingTasks(): Boolean

  @Query("""
        UPDATE upload_tasks
        SET attempts = :attempts,
            last_error = :errorCode,
            status = :status,
            retry_after = :retryAfter
        WHERE id = :taskId
    """)
  suspend fun updateTaskAfterFailure(
    taskId: Long,
    attempts: Int,
    errorCode: UploadErrorCode,
    status: TaskStatus,
    retryAfter: Date?
  )

  @Query("UPDATE upload_tasks SET status = :status WHERE id = :id")
  suspend fun updateStatus(id: Long, status: TaskStatus)
}

@Dao
interface UploadTaskStatDao {
  @Query("SELECT * FROM upload_task_stats")
  suspend fun getStats(): UploadTaskStat?
}
