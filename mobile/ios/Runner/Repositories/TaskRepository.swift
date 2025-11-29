import SQLiteData

protocol TaskProtocol {
  func getTaskIds(status: TaskStatus) async throws -> [Int64]
  func getBackupCandidates() async throws -> [LocalAssetCandidate]
  func getBackupCandidates(ids: [String]) async throws -> [LocalAssetCandidate]
  func getDownloadTasks() async throws -> [LocalAssetDownloadData]
  func getUploadTasks() async throws -> [LocalAssetUploadData]
  func markOrphansPending(ids: [Int64]) async throws
  func markDownloadQueued(taskId: Int64, isLivePhoto: Bool, filePath: URL) async throws
  func markUploadQueued(taskId: Int64) async throws
  func markDownloadComplete(taskId: Int64, localId: String, hash: String?) async throws -> TaskStatus
  func markUploadSuccess(taskId: Int64, livePhotoVideoId: String?) async throws
  func retryOrFail(taskId: Int64, code: UploadErrorCode, status: TaskStatus) async throws
  func enqueue(assets: [LocalAssetCandidate], imagePriority: Float, videoPriority: Float) async throws
  func enqueue(files: [String]) async throws
  func resolveError(code: UploadErrorCode) async throws
  func getFilename(taskId: Int64) async throws -> String?
}

final class TaskRepository: TaskProtocol {
  private let db: DatabasePool

  init(db: DatabasePool) {
    self.db = db
  }

  func getTaskIds(status: TaskStatus) async throws -> [Int64] {
    return try await db.read { conn in
      try UploadTask.select(\.id).where { $0.status.eq(status) }.fetchAll(conn)
    }
  }

  func getBackupCandidates() async throws -> [LocalAssetCandidate] {
    return try await db.read { conn in
      return try LocalAsset.backupCandidates.fetchAll(conn)
    }
  }

  func getBackupCandidates(ids: [String]) async throws -> [LocalAssetCandidate] {
    return try await db.read { conn in
      return try LocalAsset.backupCandidates.where { $0.id.in(ids) }.fetchAll(conn)
    }
  }

  func getDownloadTasks() async throws -> [LocalAssetDownloadData] {
    return try await db.read({ conn in
      return try UploadTask.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }
        .where { task, _ in task.canRetry && task.noFatalError && LocalAsset.withChecksum.exists() }
        .select { task, asset in
          LocalAssetDownloadData.Columns(
            checksum: asset.checksum,
            createdAt: asset.createdAt,
            filename: asset.name,
            livePhotoVideoId: task.livePhotoVideoId,
            localId: asset.id,
            taskId: task.id,
            updatedAt: asset.updatedAt
          )
        }
        .order { task, asset in (task.priority.desc(), task.createdAt) }
        .limit { _, _ in UploadTaskStat.availableDownloadSlots }
        .fetchAll(conn)
    })
  }

  func getUploadTasks() async throws -> [LocalAssetUploadData] {
    return try await db.read({ conn in
      return try UploadTask.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }
        .where { task, _ in task.canRetry && task.noFatalError && LocalAsset.withChecksum.exists() }
        .select { task, asset in
          LocalAssetUploadData.Columns(
            filename: asset.name,
            filePath: task.filePath.unwrapped,
            priority: task.priority,
            taskId: task.id,
            type: asset.type
          )
        }
        .order { task, asset in (task.priority.desc(), task.createdAt) }
        .limit { task, _ in UploadTaskStat.availableUploadSlots }
        .fetchAll(conn)
    })
  }

  func markOrphansPending(ids: [Int64]) async throws {
    try await db.write { conn in
      try UploadTask.update {
        $0.filePath = nil
        $0.status = .downloadPending
      }
      .where { row in row.status.in([TaskStatus.downloadQueued, TaskStatus.uploadPending]) || row.id.in(ids) }
      .execute(conn)
    }
  }

  func markDownloadQueued(taskId: Int64, isLivePhoto: Bool, filePath: URL) async throws {
    try await db.write { conn in
      try UploadTask.update {
        $0.status = .downloadQueued
        $0.isLivePhoto = isLivePhoto
        $0.filePath = filePath
      }
      .where { $0.id.eq(taskId) }.execute(conn)
    }
  }

  func markUploadQueued(taskId: Int64) async throws {
    try await db.write { conn in
      try UploadTask.update { row in
        row.status = .uploadQueued
        row.filePath = nil
      }
      .where { $0.id.eq(taskId) }.execute(conn)
    }
  }

  func markDownloadComplete(taskId: Int64, localId: String, hash: String?) async throws -> TaskStatus {
    return try await db.write { conn in
      if let hash {
        try LocalAsset.update { $0.checksum = hash }.where { $0.id.eq(localId) }.execute(conn)
      }
      let status =
        if let hash, try RemoteAsset.select(\.rowid).where({ $0.checksum.eq(hash) }).fetchOne(conn) != nil {
          TaskStatus.uploadSkipped
        } else {
          TaskStatus.uploadPending
        }
      try UploadTask.update { $0.status = status }.where { $0.id.eq(taskId) }.execute(conn)
      return status
    }
  }

  func markUploadSuccess(taskId: Int64, livePhotoVideoId: String?) async throws {
    try await db.write { conn in
      let task =
        try UploadTask
        .update { $0.status = .uploadComplete }
        .where { $0.id.eq(taskId) }
        .returning(\.self)
        .fetchOne(conn)
      guard let task, let localId = task.localId, let isLivePhoto = task.isLivePhoto, isLivePhoto,
        task.livePhotoVideoId == nil
      else { return }
      try UploadTask.insert {
        UploadTask.Draft(
          attempts: 0,
          createdAt: Date(),
          filePath: nil,
          isLivePhoto: true,
          lastError: nil,
          livePhotoVideoId: livePhotoVideoId,
          localId: localId,
          method: .multipart,
          priority: 0.7,
          retryAfter: nil,
          status: .downloadPending,
        )
      }.execute(conn)
    }
  }

  func retryOrFail(taskId: Int64, code: UploadErrorCode, status: TaskStatus) async throws {
    try await db.write { conn in
      try UploadTask.update { row in
        let retryOffset =
          switch code {
          case .iCloudThrottled, .iCloudRateLimit, .notEnoughSpace: 3000
          default: 0
          }
        row.status = Case()
          .when(row.localId.is(nil) && row.attempts.lte(TaskConfig.maxRetries), then: TaskStatus.uploadPending)
          .when(row.attempts.lte(TaskConfig.maxRetries), then: TaskStatus.downloadPending)
          .else(status)
        row.attempts += 1
        row.lastError = code
        row.retryAfter = #sql("unixepoch('now') + (\(4 << row.attempts)) + \(retryOffset)")
      }
      .where { $0.id.eq(taskId) }.execute(conn)
    }
  }

  func enqueue(assets: [LocalAssetCandidate], imagePriority: Float, videoPriority: Float) async throws {
    try await db.write { conn in
      var draft = draftStub
      for candidate in assets {
        draft.localId = candidate.id
        draft.priority = candidate.type == .image ? imagePriority : videoPriority
        try UploadTask.insert {
          draft
        } onConflict: {
          ($0.localId, $0.livePhotoVideoId)
        }
        .execute(conn)
      }
    }
  }

  func enqueue(files: [String]) async throws {
    try await db.write { conn in
      var draft = draftStub
      draft.priority = 1.0
      draft.status = .uploadPending
      for file in files {
        draft.filePath = URL(fileURLWithPath: file, isDirectory: false)
        try UploadTask.insert { draft }.execute(conn)
      }
    }
  }

  func resolveError(code: UploadErrorCode) async throws {
    try await db.write { conn in
      try UploadTask.update { $0.lastError = nil }.where { $0.lastError.unwrapped.eq(code) }.execute(conn)
    }
  }

  func getFilename(taskId: Int64) async throws -> String? {
    try await db.read { conn in
      try UploadTask.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }.select(\.1.name).fetchOne(conn)
    }
  }

  private var draftStub: UploadTask.Draft {
    .init(
      attempts: 0,
      createdAt: Date(),
      filePath: nil,
      isLivePhoto: nil,
      lastError: nil,
      livePhotoVideoId: nil,
      localId: nil,
      method: .multipart,
      priority: 0.5,
      retryAfter: nil,
      status: .downloadPending,
    )
  }
}

extension UploadTask.TableColumns {
  var noFatalError: some QueryExpression<Bool> { lastError.is(nil) || !lastError.unwrapped.in(UploadErrorCode.fatal) }
  var canRetry: some QueryExpression<Bool> {
    attempts.lte(TaskConfig.maxRetries) && (retryAfter.is(nil) || retryAfter.unwrapped <= Date().unixTime)
  }
}

extension LocalAlbum {
  static let selected = Self.where { $0.backupSelection.eq(BackupSelection.selected) }
  static let excluded = Self.where { $0.backupSelection.eq(BackupSelection.excluded) }
}

extension LocalAlbumAsset {
  static let selected = Self.where {
    $0.id.assetId.eq(LocalAsset.columns.id) && $0.id.albumId.in(LocalAlbum.selected.select(\.id))
  }
  static let excluded = Self.where {
    $0.id.assetId.eq(LocalAsset.columns.id) && $0.id.albumId.in(LocalAlbum.excluded.select(\.id))
  }
}

extension RemoteAsset {
  static let currentUser = Self.where { _ in
    ownerId.eq(Store.select(\.stringValue).where { $0.id.eq(StoreKey.currentUser.rawValue) }.unwrapped)
  }
}

extension LocalAsset {
  static let withChecksum = Self.where { $0.checksum.isNot(nil) }
  static let shouldBackup = Self.where { _ in LocalAlbumAsset.selected.exists() && !LocalAlbumAsset.excluded.exists() }
  static let notBackedUp = Self.where { local in
    !RemoteAsset.currentUser.where { remote in local.checksum.eq(remote.checksum) }.exists()
  }
  static let backupCandidates = Self
    .shouldBackup
    .notBackedUp
    .where { local in !UploadTask.where { $0.localId.eq(local.id) }.exists() }
    .select { LocalAssetCandidate.Columns(id: $0.id, type: $0.type) }
    .limit { _ in UploadTaskStat.availableSlots }
}
