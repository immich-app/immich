import SQLiteData

extension FileHandle {
  static func createOrOverwrite(atPath path: String) throws -> FileHandle {
    let fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0o644)
    guard fd >= 0 else {
      throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno))
    }
    return FileHandle(fileDescriptor: fd, closeOnDealloc: true)
  }
}

final class UploadApiImpl<
  StoreRepo: StoreProtocol,
  TaskRepo: TaskProtocol,
  StatusListener: TaskStatusListener,
  ProgressListener: TaskProgressListener
>: ImmichPlugin, UploadApi {
  private let storeRepository: StoreRepo
  private let taskRepository: TaskRepo
  private let downloadQueue: DownloadQueue<StoreRepo, TaskRepo, StatusListener, ProgressListener>
  private let uploadQueue: UploadQueue<StoreRepo, TaskRepo, StatusListener>

  private var isInitialized = false
  private let initLock = NSLock()

  private var backupTask: Task<Void, Never>?
  private let backupLock = NSLock()
  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession

  init(
    storeRepository: StoreRepo,
    taskRepository: TaskRepo,
    statusListener: StatusListener,
    progressListener: ProgressListener
  ) {
    self.taskRepository = taskRepository
    let delegate = UploadApiDelegate(
      taskRepository: taskRepository,
      statusListener: statusListener,
      progressListener: progressListener
    )
    let cellularConfig = URLSessionConfiguration.background(withIdentifier: "\(TaskConfig.sessionId).cellular")
    cellularConfig.allowsCellularAccess = true
    cellularConfig.waitsForConnectivity = true

    self.cellularSession = URLSession(configuration: cellularConfig, delegate: delegate, delegateQueue: nil)

    let wifiOnlyConfig = URLSessionConfiguration.background(withIdentifier: "\(TaskConfig.sessionId).wifi")
    wifiOnlyConfig.allowsCellularAccess = false
    wifiOnlyConfig.waitsForConnectivity = true
    self.wifiOnlySession = URLSession(configuration: wifiOnlyConfig, delegate: delegate, delegateQueue: nil)

    self.storeRepository = storeRepository
    self.uploadQueue = UploadQueue(
      storeRepository: storeRepository,
      taskRepository: taskRepository,
      statusListener: statusListener,
      cellularSession: cellularSession,
      wifiOnlySession: wifiOnlySession
    )
    self.downloadQueue = DownloadQueue(
      storeRepository: storeRepository,
      taskRepository: taskRepository,
      statusListener: statusListener,
      progressListener: progressListener
    )
  }

  func initialize(completion: @escaping (Result<Void, any Error>) -> Void) {
    Task(priority: .high) {
      do {
        async let dbIds = taskRepository.getTaskIds(status: .uploadQueued)
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

        try await taskRepository.markOrphansPending(ids: Array(dbTaskIds))

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
        self.completeWhenActive(for: completion, with: .success(()))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  func enqueueFiles(paths: [String], completion: @escaping (Result<Void, any Error>) -> Void) {
    Task {
      do {
        try await uploadQueue.enqueueFiles(paths: paths)
        self.completeWhenActive(for: completion, with: .success(()))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  func onConfigChange(key: Int64, completion: @escaping (Result<Void, any Error>) -> Void) {
    storeRepository.invalidateCache()
    Task {
      if let key = StoreKey(rawValue: Int(key)), key == ._accessToken {
        try? await taskRepository.resolveError(code: .unauthorized)
      }
      startBackup()
      self.completeWhenActive(for: completion, with: .success(()))
    }
  }

  private func cancelSessionTasks(_ tasks: [URLSessionTask]) {
    dPrint("Canceling \(tasks.count) tasks")
    for task in tasks {
      task.cancel()
    }
  }

  private func _startBackup() async {
    defer {
      downloadQueue.startQueueProcessing()
      uploadQueue.startQueueProcessing()
    }

    do {
      let candidates = try await taskRepository.getBackupCandidates()

      guard !candidates.isEmpty else { return dPrint("No candidates for backup") }

      try await taskRepository.enqueue(assets: candidates, imagePriority: 0.5, videoPriority: 0.3)
      dPrint("Backup enqueued \(candidates.count) assets for upload")
    } catch {
      print("Backup queue error: \(error)")
    }
  }
}
