import SQLiteData
import StructuredFieldValues

extension FileHandle {
  static func createOrOverwrite(atPath path: String) throws -> FileHandle {
    let fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0o644)
    guard fd >= 0 else {
      throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno))
    }
    return FileHandle(fileDescriptor: fd, closeOnDealloc: true)
  }
}

class UploadApiImpl: ImmichPlugin, UploadApi {
  private let db: DatabasePool
  private let downloadQueue: DownloadQueue
  private let uploadQueue: UploadQueue

  private var isInitialized = false
  private let initLock = NSLock()

  private var backupTask: Task<Void, Never>?
  private let backupLock = NSLock()

  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession

  init(statusListener: StatusEventListener, progressListener: ProgressEventListener) {
    let dbUrl = try! FileManager.default.url(
      for: .documentDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    ).appendingPathComponent("immich.sqlite")

    self.db = try! DatabasePool(path: dbUrl.path)
    let cellularConfig = URLSessionConfiguration.background(withIdentifier: "\(TaskConfig.sessionId).cellular")
    cellularConfig.allowsCellularAccess = true
    cellularConfig.waitsForConnectivity = true
    let delegate = UploadApiDelegate(db: db, statusListener: statusListener, progressListener: progressListener)
    self.cellularSession = URLSession(configuration: cellularConfig, delegate: delegate, delegateQueue: nil)

    let wifiOnlyConfig = URLSessionConfiguration.background(withIdentifier: "\(TaskConfig.sessionId).wifi")
    wifiOnlyConfig.allowsCellularAccess = false
    wifiOnlyConfig.waitsForConnectivity = true
    self.wifiOnlySession = URLSession(configuration: wifiOnlyConfig, delegate: delegate, delegateQueue: nil)

    self.uploadQueue = UploadQueue(
      db: db,
      cellularSession: cellularSession,
      wifiOnlySession: wifiOnlySession,
      statusListener: statusListener
    )
    self.downloadQueue = DownloadQueue(
      db: db,
      uploadQueue: uploadQueue,
      statusListener: statusListener,
      progressListener: progressListener
    )
    delegate.downloadQueue = downloadQueue
    delegate.uploadQueue = uploadQueue
  }

  func initialize(completion: @escaping (Result<Void, any Error>) -> Void) {
    Task(priority: .high) {
      do {
        async let dbIds = db.read { conn in
          try UploadTask.select(\.id).where { $0.status.eq(TaskStatus.uploadQueued) }.fetchAll(conn)
        }
        async let cellularTasks = cellularSession.allTasks
        async let wifiTasks = wifiOnlySession.allTasks

        var dbTaskIds = Set(try await dbIds)
        func validateTasks(_ tasks: [URLSessionTask]) {
          for task in tasks {
            if let taskIdStr = task.taskDescription, let taskId = Int64(taskIdStr), task.state != .canceling {
              dbTaskIds.remove(taskId)
            } else {
              task.cancel()
            }
          }
        }

        validateTasks(await cellularTasks)
        validateTasks(await wifiTasks)

        let orphanIds = Array(dbTaskIds)
        try await db.write { conn in
          try UploadTask.update {
            $0.filePath = nil
            $0.status = .downloadPending
          }
          .where { row in row.status.in([TaskStatus.downloadQueued, TaskStatus.uploadPending]) || row.id.in(orphanIds) }
          .execute(conn)
        }

        try? FileManager.default.removeItem(at: TaskConfig.originalsDir)
        initLock.withLock { isInitialized = true }
        startBackup()
        self.completeWhenActive(for: completion, with: .success(()))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  func refresh(completion: @escaping (Result<Void, any Error>) -> Void) {
    Task {
      startBackup()
      self.completeWhenActive(for: completion, with: .success(()))
    }
  }

  func startBackup() {
    dPrint("Starting backup task")
    guard (initLock.withLock { isInitialized }) else { return dPrint("Not initialized, skipping backup") }

    backupLock.withLock {
      guard backupTask == nil else { return dPrint("Backup task already running") }
      backupTask = Task {
        await _startBackup()
        backupLock.withLock { backupTask = nil }
      }
    }
  }

  func cancelAll(completion: @escaping (Result<Void, any Error>) -> Void) {
    Task {
      async let cellularTasks = cellularSession.allTasks
      async let wifiTasks = wifiOnlySession.allTasks

      cancelSessionTasks(await cellularTasks)
      cancelSessionTasks(await wifiTasks)
      self.completeWhenActive(for: completion, with: .success(()))
    }
  }

  func enqueueAssets(localIds: [String], completion: @escaping (Result<Void, any Error>) -> Void) {
    Task {
      do {
        try await downloadQueue.enqueueAssets(localIds: localIds)
        completion(.success(()))
      } catch {
        completion(.failure(error))
      }
    }
  }

  func enqueueFiles(paths: [String], completion: @escaping (Result<Void, any Error>) -> Void) {
    Task {
      do {
        try await uploadQueue.enqueueFiles(paths: paths)
        completion(.success(()))
      } catch {
        completion(.failure(error))
      }
    }
  }

  private func cancelSessionTasks(_ tasks: [URLSessionTask]) {
    dPrint("Canceling \(tasks.count) tasks")
    for task in tasks {
      task.cancel()
    }
  }

  private func _startBackup() async {
    defer { downloadQueue.startQueueProcessing() }
    do {
      let candidates = try await db.read { conn in
        return try LocalAsset.getCandidates()
          .where { asset in !UploadTask.where { task in task.localId.eq(asset.id) }.exists() }
          .select { LocalAssetCandidate.Columns(id: $0.id, type: $0.type) }
          .limit { _ in UploadTaskStat.availableSlots }
          .fetchAll(conn)
      }

      guard !candidates.isEmpty else { return dPrint("No candidates for backup") }

      try await db.write { conn in
        var draft = UploadTask.Draft(
          attempts: 0,
          createdAt: Date(),
          filePath: nil,
          isLivePhoto: nil,
          lastError: nil,
          livePhotoVideoId: nil,
          localId: "",
          method: .multipart,
          priority: 0.5,
          retryAfter: nil,
          status: .downloadPending,
        )
        for candidate in candidates {
          draft.localId = candidate.id
          draft.priority = candidate.type == .image ? 0.5 : 0.3
          try UploadTask.insert {
            draft
          } onConflict: {
            ($0.localId, $0.livePhotoVideoId)
          }
          .execute(conn)
        }
      }
      dPrint("Backup enqueued \(candidates.count) assets for upload")
    } catch {
      print("Backup queue error: \(error)")
    }
  }
}

struct AssetData: StructuredFieldValue {
  static let structuredFieldType: StructuredFieldType = .dictionary

  let deviceAssetId: String
  let deviceId: String
  let fileCreatedAt: String
  let fileModifiedAt: String
  let fileName: String
  let isFavorite: Bool
  let livePhotoVideoId: String?

  static let boundary = "Boundary-\(UUID().uuidString)"
  static let deviceAssetIdField = "--\(boundary)\r\nContent-Disposition: form-data; name=\"deviceAssetId\"\r\n\r\n"
    .data(using: .utf8)!
  static let deviceIdField = "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"deviceId\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileCreatedAtField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"fileCreatedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileModifiedAtField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"fileModifiedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let isFavoriteField = "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"isFavorite\"\r\n\r\n"
    .data(using: .utf8)!
  static let livePhotoVideoIdField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"livePhotoVideoId\"\r\n\r\n"
    .data(using: .utf8)!
  static let trueData = "true".data(using: .utf8)!
  static let falseData = "false".data(using: .utf8)!
  static let footer = "\r\n--\(boundary)--\r\n".data(using: .utf8)!
  static let contentType = "multipart/form-data; boundary=\(boundary)"

  func multipart() -> (Data, Data) {
    var header = Data()
    header.append(Self.deviceAssetIdField)
    header.append(deviceAssetId.data(using: .utf8)!)

    header.append(Self.deviceIdField)
    header.append(deviceId.data(using: .utf8)!)

    header.append(Self.fileCreatedAtField)
    header.append(fileCreatedAt.data(using: .utf8)!)

    header.append(Self.fileModifiedAtField)
    header.append(fileModifiedAt.data(using: .utf8)!)

    header.append(Self.isFavoriteField)
    header.append(isFavorite ? Self.trueData : Self.falseData)

    if let livePhotoVideoId {
      header.append(Self.livePhotoVideoIdField)
      header.append(livePhotoVideoId.data(using: .utf8)!)
    }
    header.append(
      "\r\n--\(Self.boundary)\r\nContent-Disposition: form-data; name=\"assetData\"; filename=\"\(fileName)\"\r\nContent-Type: application/octet-stream\r\n\r\n"
        .data(using: .utf8)!
    )
    return (header, Self.footer)
  }
}
