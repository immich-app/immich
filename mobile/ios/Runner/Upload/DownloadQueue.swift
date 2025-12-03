import CryptoKit
import Photos

private var queueProcessingTask: Task<Void, Never>?
private var queueProcessingLock = NSLock()
private let resourceManager = PHAssetResourceManager.default()

private final class RequestRef {
  var id: PHAssetResourceDataRequestID?
  var lastProgressTime = Date()
  var didStall = false
}

final class DownloadQueue<
  StoreRepo: StoreProtocol,
  TaskRepo: TaskProtocol,
  StatusListener: TaskStatusListener,
  ProgressListener: TaskProgressListener
> {
  private let storeRepository: StoreRepo
  private let taskRepository: TaskRepo
  private let statusListener: StatusListener
  private let progressListener: ProgressListener
  private var uploadObserver: NSObjectProtocol?
  private var networkObserver: NSObjectProtocol?

  init(
    storeRepository: StoreRepo,
    taskRepository: TaskRepo,
    statusListener: StatusListener,
    progressListener: ProgressListener
  ) {
    self.storeRepository = storeRepository
    self.taskRepository = taskRepository
    self.statusListener = statusListener
    self.progressListener = progressListener
    uploadObserver = NotificationCenter.default.addObserver(forName: .uploadTaskDidComplete, object: nil, queue: nil) {
      [weak self] _ in
      self?.startQueueProcessing()
    }
    networkObserver = NotificationCenter.default.addObserver(forName: .networkDidConnect, object: nil, queue: nil) {
      [weak self] _ in
      dPrint("Network connected")
      self?.startQueueProcessing()
    }
  }

  deinit {
    uploadObserver.map(NotificationCenter.default.removeObserver(_:))
    networkObserver.map(NotificationCenter.default.removeObserver(_:))
  }

  func enqueueAssets(localIds: [String]) async throws {
    guard !localIds.isEmpty else { return dPrint("No assets to enqueue") }

    defer { startQueueProcessing() }
    let candidates = try await taskRepository.getBackupCandidates(ids: localIds)

    guard !candidates.isEmpty else { return dPrint("No candidates to enqueue") }

    try await taskRepository.enqueue(assets: candidates, imagePriority: 0.9, videoPriority: 0.8)
    dPrint("Enqueued \(candidates.count) assets for upload")
  }

  func startQueueProcessing() {
    dPrint("Starting download queue processing")
    queueProcessingLock.withLock {
      guard queueProcessingTask == nil else { return }
      queueProcessingTask = Task {
        await startDownloads()
        queueProcessingLock.withLock { queueProcessingTask = nil }
      }
    }
  }

  private func startDownloads() async {
    dPrint("Processing download queue")

    guard await UIApplication.shared.applicationState != .background else {
      return dPrint("Not processing downloads in background") // TODO: run in processing tasks
    }

    guard NetworkMonitor.shared.isConnected,
      let backupEnabled = try? storeRepository.get(StoreKey.enableBackup), backupEnabled,
      let deviceId = try? storeRepository.get(StoreKey.deviceId)
    else { return dPrint("Download queue paused: missing preconditions") }

    do {
      let tasks = try await taskRepository.getDownloadTasks()
      if tasks.isEmpty { return dPrint("No download tasks to process") }

      try await withThrowingTaskGroup(of: Void.self) { group in
        var iterator = tasks.makeIterator()
        for _ in 0..<min(TaskConfig.maxActiveDownloads, tasks.count) {
          if let task = iterator.next() {
            group.addTask { await self.downloadAndQueue(task, deviceId: deviceId) }
          }
        }

        while try await group.next() != nil {
          if let task = iterator.next() {
            group.addTask { await self.downloadAndQueue(task, deviceId: deviceId) }
          }
        }
      }
    } catch {
      dPrint("Download queue error: \(error)")
    }
  }

  private func downloadAndQueue(_ task: LocalAssetDownloadData, deviceId: String) async {
    defer { startQueueProcessing() }
    dPrint("Starting download for task \(task.taskId)")

    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [task.localId], options: nil).firstObject
    else {
      dPrint("Asset not found")
      return await handleFailure(task: task, code: .assetNotFound)
    }

    let isLivePhoto = asset.mediaSubtypes.contains(.photoLive)
    let isMotion = isLivePhoto && task.livePhotoVideoId != nil
    guard let resource = isMotion ? asset.getLivePhotoResource() : asset.getResource() else {
      dPrint("Resource not found")
      return await handleFailure(task: task, code: .resourceNotFound)
    }

    let fileDir = TaskConfig.originalsDir
    let fileName = "\(resource.assetLocalIdentifier.replacingOccurrences(of: "/", with: "_"))_\(resource.type.rawValue)"
    let filePath = fileDir.appendingPathComponent(fileName)
    do {
      try FileManager.default.createDirectory(
        at: fileDir,
        withIntermediateDirectories: true,
        attributes: nil
      )
    } catch {
      dPrint("Failed to create directory for download task \(task.taskId): \(error)")
      return await handleFailure(task: task, code: .writeFailed, filePath: filePath)
    }

    do {
      try await taskRepository.markDownloadQueued(taskId: task.taskId, isLivePhoto: isLivePhoto, filePath: filePath)
    } catch {
      return dPrint("Failed to set file path for download task \(task.taskId): \(error)")
    }
    statusListener.onTaskStatus(
      UploadApiTaskStatus(id: String(task.taskId), filename: filePath.path, status: .downloadQueued)
    )

    do {
      let hash = try await download(task: task, asset: asset, resource: resource, to: filePath, deviceId: deviceId)
      let status = try await taskRepository.markDownloadComplete(taskId: task.taskId, localId: task.localId, hash: hash)
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: task.filename,
          status: UploadApiStatus(rawValue: status.rawValue)!
        )
      )
      NotificationCenter.default.post(name: .downloadTaskDidComplete, object: nil)
    } catch let error as UploadError {
      dPrint("Download failed for task \(task.taskId): \(error)")
      await handleFailure(task: task, code: error.code, filePath: filePath)
    } catch {
      dPrint("Download failed for task \(task.taskId): \(error)")
      await handleFailure(task: task, code: .unknown, filePath: filePath)
    }
  }

  func download(
    task: LocalAssetDownloadData,
    asset: PHAsset,
    resource: PHAssetResource,
    to filePath: URL,
    deviceId: String
  ) async throws
    -> String?
  {
    dPrint("Downloading asset resource \(resource.assetLocalIdentifier) of type \(resource.type.rawValue)")
    let options = PHAssetResourceRequestOptions()
    options.isNetworkAccessAllowed = true
    let (header, footer) = AssetData(
      deviceAssetId: task.localId,
      deviceId: deviceId,
      fileCreatedAt: task.createdAt,
      fileModifiedAt: task.updatedAt,
      fileName: resource.originalFilename,
      isFavorite: asset.isFavorite,
      livePhotoVideoId: nil
    ).multipart()

    guard let fileHandle = try? FileHandle.createOrOverwrite(atPath: filePath.path) else {
      dPrint("Failed to open file handle for download task \(task.taskId), path: \(filePath.path)")
      throw UploadError.fileCreationFailed
    }
    try fileHandle.write(contentsOf: header)

    var lastProgressTime = Date()
    let taskIdStr = String(task.taskId)
    options.progressHandler = { progress in
      lastProgressTime = Date()
      self.progressListener.onTaskProgress(UploadApiTaskProgress(id: taskIdStr, progress: progress))
    }

    let request = RequestRef()
    let timeoutTask = Task {
      while !Task.isCancelled {
        try? await Task.sleep(nanoseconds: TaskConfig.downloadCheckIntervalNs)
        request.didStall = Date().timeIntervalSince(lastProgressTime) > TaskConfig.downloadTimeoutS
        if request.didStall {
          if let requestId = request.id {
            resourceManager.cancelDataRequest(requestId)
          }
          break
        }
      }
    }

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        var hasher = task.checksum == nil && task.livePhotoVideoId == nil ? Insecure.SHA1() : nil
        request.id = resourceManager.requestData(
          for: resource,
          options: options,
          dataReceivedHandler: { data in
            guard let requestId = request.id else { return }
            do {
              hasher?.update(data: data)
              try fileHandle.write(contentsOf: data)
            } catch {
              request.id = nil
              resourceManager.cancelDataRequest(requestId)
            }
          },
          completionHandler: { error in
            timeoutTask.cancel()
            switch error {
            case let e as NSError where e.domain == "CloudPhotoLibraryErrorDomain":
              dPrint("iCloud error during download: \(e)")
              let code: UploadErrorCode =
                switch e.code {
                case 1005: .iCloudRateLimit
                case 81: .iCloudThrottled
                default: .photosUnknownError
                }
              continuation.resume(throwing: UploadError.iCloudError(code))
            case let e as PHPhotosError:
              dPrint("Photos error during download: \(e)")
              let code: UploadErrorCode =
                switch e.code {
                case .notEnoughSpace: .notEnoughSpace
                case .missingResource: .resourceNotFound
                case .networkError: .networkError
                case .internalError: .photosInternalError
                case .invalidResource: .invalidResource
                case .operationInterrupted: .interrupted
                case .userCancelled where request.didStall: .downloadStalled
                case .userCancelled: .cancelled
                default: .photosUnknownError
                }
              continuation.resume(throwing: UploadError.photosError(code))
            case .some:
              dPrint("Unknown error during download: \(String(describing: error))")
              continuation.resume(throwing: UploadError.unknown)
            case .none:
              dPrint("Download completed for task \(task.taskId)")
              do {
                try fileHandle.write(contentsOf: footer)
                continuation.resume(returning: hasher.map { hasher in Data(hasher.finalize()).base64EncodedString() })
              } catch {
                try? FileManager.default.removeItem(at: filePath)
                continuation.resume(throwing: UploadError.fileCreationFailed)
              }
            }
          }
        )
      }
    } onCancel: {
      if let requestId = request.id {
        resourceManager.cancelDataRequest(requestId)
      }
    }
  }

  private func handleFailure(task: LocalAssetDownloadData, code: UploadErrorCode, filePath: URL? = nil) async {
    dPrint("Handling failure for task \(task.taskId) with code \(code.rawValue)")
    do {
      if let filePath {
        try? FileManager.default.removeItem(at: filePath)
      }

      try await taskRepository.retryOrFail(taskId: task.taskId, code: code, status: .downloadFailed)
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: task.filename,
          status: .downloadFailed
        )
      )
    } catch {
      dPrint("Failed to update download failure status for task \(task.taskId): \(error)")
    }
  }
}
