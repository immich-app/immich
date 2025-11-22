private var queueProcessingTask: Task<Void, Never>?
private var queueProcessingLock = NSLock()

final class UploadQueue<StoreRepo: StoreProtocol, TaskRepo: TaskProtocol, StatusListener: TaskStatusListener> {
  private let storeRepository: StoreRepo
  private let taskRepository: TaskRepo
  private let statusListener: StatusListener

  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession
  private var uploadObserver: NSObjectProtocol?
  private var downloadObserver: NSObjectProtocol?
  private var networkObserver: NSObjectProtocol?

  init(
    storeRepository: StoreRepo,
    taskRepository: TaskRepo,
    statusListener: StatusListener,
    cellularSession: URLSession,
    wifiOnlySession: URLSession
  ) {
    self.storeRepository = storeRepository
    self.taskRepository = taskRepository
    self.cellularSession = cellularSession
    self.wifiOnlySession = wifiOnlySession
    self.statusListener = statusListener

    uploadObserver = NotificationCenter.default.addObserver(forName: .uploadTaskDidComplete, object: nil, queue: nil) {
      [weak self] _ in
      self?.startQueueProcessing()
    }
    downloadObserver = NotificationCenter.default.addObserver(
      forName: .downloadTaskDidComplete,
      object: nil,
      queue: nil
    ) { [weak self] _ in
      self?.startQueueProcessing()
    }
    networkObserver = NotificationCenter.default.addObserver(forName: .networkDidConnect, object: nil, queue: nil) {
      [weak self] _ in
      self?.startQueueProcessing()
    }
  }

  deinit {
    uploadObserver.map(NotificationCenter.default.removeObserver(_:))
    downloadObserver.map(NotificationCenter.default.removeObserver(_:))
    networkObserver.map(NotificationCenter.default.removeObserver(_:))
  }

  func enqueueFiles(paths: [String]) async throws {
    guard !paths.isEmpty else { return dPrint("No paths to enqueue") }

    guard let deviceId = try? storeRepository.get(StoreKey.deviceId) else {
      throw StoreError.notFound
    }

    defer { startQueueProcessing() }

    try await withThrowingTaskGroup(of: Void.self, returning: Void.self) { group in
      let date = Date()
      try FileManager.default.createDirectory(
        at: TaskConfig.originalsDir,
        withIntermediateDirectories: true,
        attributes: nil
      )

      for path in paths {
        group.addTask {
          let inputURL = URL(fileURLWithPath: path, isDirectory: false)
          let outputURL = TaskConfig.originalsDir.appendingPathComponent(UUID().uuidString)
          let resources = try inputURL.resourceValues(forKeys: [.creationDateKey, .contentModificationDateKey])

          let formatter = ISO8601DateFormatter()
          let (header, footer) = AssetData(
            deviceAssetId: "",
            deviceId: deviceId,
            fileCreatedAt: formatter.string(from: resources.creationDate ?? date),
            fileModifiedAt: formatter.string(from: resources.contentModificationDate ?? date),
            fileName: resources.name ?? inputURL.lastPathComponent,
            isFavorite: false,
            livePhotoVideoId: nil
          ).multipart()

          do {
            let writeHandle = try FileHandle.createOrOverwrite(atPath: outputURL.path)
            try writeHandle.write(contentsOf: header)
            let readHandle = try FileHandle(forReadingFrom: inputURL)

            let bufferSize = 1024 * 1024
            while true {
              let data = try readHandle.read(upToCount: bufferSize)
              guard let data = data, !data.isEmpty else { break }
              try writeHandle.write(contentsOf: data)
            }
            try writeHandle.write(contentsOf: footer)
          } catch {
            try? FileManager.default.removeItem(at: outputURL)
            throw error
          }
        }
      }

      try await group.waitForAll()
    }

    try await taskRepository.enqueue(files: paths)
    dPrint("Enqueued \(paths.count) assets for upload")
  }

  func startQueueProcessing() {
    dPrint("Starting upload queue processing")
    queueProcessingLock.withLock {
      guard queueProcessingTask == nil else { return }
      queueProcessingTask = Task {
        await startUploads()
        queueProcessingLock.withLock { queueProcessingTask = nil }
      }
    }
  }

  private func startUploads() async {
    dPrint("Processing upload queue")
    guard NetworkMonitor.shared.isConnected,
      let backupEnabled = try? storeRepository.get(StoreKey.enableBackup), backupEnabled,
      let url = try? storeRepository.get(StoreKey.serverEndpoint),
      let accessToken = try? storeRepository.get(StoreKey.accessToken)
    else { return dPrint("Upload queue paused: missing preconditions") }

    do {
      let tasks = try await taskRepository.getUploadTasks()
      if tasks.isEmpty { return dPrint("No upload tasks to process") }

      await withTaskGroup(of: Void.self) { group in
        for task in tasks {
          group.addTask { await self.startUpload(multipart: task, url: url, accessToken: accessToken) }
        }
      }
    } catch {
      dPrint("Upload queue error: \(error)")
    }
  }

  private func startUpload(multipart task: LocalAssetUploadData, url: URL, accessToken: String) async {
    dPrint("Uploading asset resource at \(task.filePath) of task \(task.taskId)")
    defer { startQueueProcessing() }

    let session =
      switch task.type {
      case .image:
        (try? storeRepository.get(StoreKey.useWifiForUploadPhotos)) ?? false ? wifiOnlySession : cellularSession
      case .video:
        (try? storeRepository.get(StoreKey.useWifiForUploadVideos)) ?? false ? wifiOnlySession : cellularSession
      default: wifiOnlySession
      }

    var request = URLRequest(url: url.appendingPathComponent("/assets"))
    request.httpMethod = "POST"
    request.setValue(accessToken, forHTTPHeaderField: UploadHeaders.userToken.rawValue)
    request.setValue(AssetData.contentType, forHTTPHeaderField: "Content-Type")

    let sessionTask = session.uploadTask(with: request, fromFile: task.filePath)
    sessionTask.taskDescription = String(task.taskId)
    sessionTask.priority = task.priority
    do {
      try? FileManager.default.removeItem(at: task.filePath)  // upload task already copied the file
      try await taskRepository.markUploadQueued(taskId: task.taskId)
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: task.filename,
          status: .uploadQueued,
        )
      )

      sessionTask.resume()
      dPrint("Upload started for task \(task.taskId) using \(session == wifiOnlySession ? "WiFi" : "Cellular") session")
    } catch {
      dPrint("Upload failed for \(task.taskId), could not update queue status: \(error.localizedDescription)")
    }
  }

  private func handleFailure(task: LocalAssetUploadData, code: UploadErrorCode) async {
    do {
      try await taskRepository.retryOrFail(taskId: task.taskId, code: code, status: .uploadFailed)
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: task.filename,
          status: .uploadFailed
        )
      )
    } catch {
      dPrint("Failed to update upload failure status for task \(task.taskId): \(error)")
    }
  }
}
