import CryptoKit
import Photos
import SQLiteData

class DownloadQueue {
  private static let resourceManager = PHAssetResourceManager.default()
  private static var queueProcessingTask: Task<Void, Never>?
  private static var queueProcessingLock = NSLock()

  private let db: DatabasePool
  private let uploadQueue: UploadQueue
  private let statusListener: StatusEventListener
  private let progressListener: ProgressEventListener

  init(
    db: DatabasePool,
    uploadQueue: UploadQueue,
    statusListener: StatusEventListener,
    progressListener: ProgressEventListener
  ) {
    self.db = db
    self.uploadQueue = uploadQueue
    self.statusListener = statusListener
    self.progressListener = progressListener
    NotificationCenter.default.addObserver(forName: .networkDidConnect, object: nil, queue: nil) { [weak self] _ in
      dPrint("Network connected")
      self?.startQueueProcessing()
    }
  }

  func enqueueAssets(localIds: [String]) async throws {
    guard !localIds.isEmpty else { return dPrint("No assets to enqueue") }

    defer { startQueueProcessing() }
    let candidates = try await db.read { conn in
      return try LocalAsset.all
        .where { asset in asset.id.in(localIds) }
        .select { LocalAssetCandidate.Columns(id: $0.id, type: $0.type) }
        .limit { _ in UploadTaskStat.availableSlots }
        .fetchAll(conn)
    }

    guard !candidates.isEmpty else { return dPrint("No candidates to enqueue") }

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
        draft.priority = candidate.type == .image ? 0.9 : 0.8
        try UploadTask.insert {
          draft
        } onConflict: {
          ($0.localId, $0.livePhotoVideoId)
        }.execute(conn)
      }
    }
    dPrint("Enqueued \(candidates.count) assets for upload")
  }

  func startQueueProcessing() {
    dPrint("Starting download queue processing")
    Self.queueProcessingLock.withLock {
      guard Self.queueProcessingTask == nil else { return }
      Self.queueProcessingTask = Task {
        await startDownloads()
        Self.queueProcessingLock.withLock { Self.queueProcessingTask = nil }
      }
    }
  }

  private func startDownloads() async {
    dPrint("Processing download queue")
    guard NetworkMonitor.shared.isConnected else {
      return dPrint("Download queue paused: network disconnected")
    }

    do {
      let tasks: [LocalAssetDownloadData] = try await db.read({ conn in
        guard let backupEnabled = try Store.get(conn, StoreKey.enableBackup), backupEnabled else { return [] }
        return try UploadTask.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }
          .where { task, asset in
            asset.checksum.isNot(nil) && task.status.eq(TaskStatus.downloadPending)
              && task.attempts < TaskConfig.maxRetries
              && (task.retryAfter.is(nil) || task.retryAfter.unwrapped <= Date().unixTime)
              && (task.lastError.is(nil)
                || !task.lastError.unwrapped.in([
                  UploadErrorCode.assetNotFound, UploadErrorCode.resourceNotFound, UploadErrorCode.invalidResource,
                ]))
          }
          .select { task, asset in
            LocalAssetDownloadData.Columns(
              checksum: asset.checksum,
              createdAt: asset.createdAt,
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
      if tasks.isEmpty { return dPrint("No download tasks to process") }

      try await withThrowingTaskGroup(of: Void.self) { group in
        var iterator = tasks.makeIterator()
        for _ in 0..<min(TaskConfig.maxActiveDownloads, tasks.count) {
          if let task = iterator.next() {
            group.addTask { await self.downloadAndQueue(task) }
          }
        }

        while try await group.next() != nil {
          if let task = iterator.next() {
            group.addTask { await self.downloadAndQueue(task) }
          }
        }
      }
    } catch {
      dPrint("Download queue error: \(error)")
    }
  }

  private func downloadAndQueue(_ task: LocalAssetDownloadData) async {
    defer { startQueueProcessing() }
    dPrint("Starting download for task \(task.taskId)")

    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [task.localId], options: nil).firstObject
    else {
      dPrint("Asset not found")
      return handleFailure(task: task, code: .assetNotFound)
    }

    let isLivePhoto = asset.mediaSubtypes.contains(.photoLive)
    let isMotion = isLivePhoto && task.livePhotoVideoId != nil
    guard let resource = isMotion ? asset.getLivePhotoResource() : asset.getResource() else {
      dPrint("Resource not found")
      return handleFailure(task: task, code: .resourceNotFound)
    }

    guard let deviceId = (try? await db.read { conn in try Store.get(conn, StoreKey.deviceId) }) else {
      dPrint("Device ID not found")
      return handleFailure(task: task, code: .noDeviceId)
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
      return handleFailure(task: task, code: .writeFailed, filePath: filePath)
    }

    do {
      try await db.write { conn in
        try UploadTask.update {
          $0.status = .downloadQueued
          $0.isLivePhoto = isLivePhoto
          $0.filePath = filePath
        }.where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      return dPrint("Failed to set file path for download task \(task.taskId): \(error)")
    }
    statusListener.onTaskStatus(
      UploadApiTaskStatus(id: String(task.taskId), filename: filePath.path, status: .downloadQueued)
    )

    do {
      let hash = try await download(task: task, asset: asset, resource: resource, to: filePath, deviceId: deviceId)
      let status = try await db.write { conn in
        if let hash { try LocalAsset.update { $0.checksum = hash }.where { $0.id.eq(task.localId) }.execute(conn) }
        let status =
          if let hash, try RemoteAsset.select(\.rowid).where({ $0.checksum.eq(hash) }).fetchOne(conn) != nil {
            TaskStatus.uploadSkipped
          } else {
            TaskStatus.uploadPending
          }
        try UploadTask.update { $0.status = .uploadPending }.where { $0.id.eq(task.taskId) }.execute(conn)
        return status
      }
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: filePath.path,
          status: UploadApiStatus(rawValue: status.rawValue)!
        )
      )
      uploadQueue.startQueueProcessing()
    } catch {
      dPrint("Download failed for task \(task.taskId): \(error)")
      handleFailure(task: task, code: .writeFailed, filePath: filePath)
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

    class RequestRef {
      var id: PHAssetResourceDataRequestID?
      var lastProgressTime = Date()
      var didStall = false
    }

    var lastProgressTime = Date()
    nonisolated(unsafe) let progressListener = self.progressListener
    let taskIdStr = String(task.taskId)
    options.progressHandler = { progress in
      lastProgressTime = Date()
      progressListener.onTaskProgress(UploadApiTaskProgress(id: taskIdStr, progress: progress))
    }

    let request = RequestRef()
    let timeoutTask = Task {
      while !Task.isCancelled {
        try? await Task.sleep(nanoseconds: TaskConfig.downloadCheckIntervalNs)
        request.didStall = Date().timeIntervalSince(lastProgressTime) > TaskConfig.downloadTimeoutS
        if request.didStall {
          if let requestId = request.id {
            Self.resourceManager.cancelDataRequest(requestId)
          }
          break
        }
      }
    }

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        var hasher = task.checksum == nil && task.livePhotoVideoId == nil ? Insecure.SHA1() : nil
        request.id = Self.resourceManager.requestData(
          for: resource,
          options: options,
          dataReceivedHandler: { data in
            guard let requestId = request.id else { return }
            do {
              hasher?.update(data: data)
              try fileHandle.write(contentsOf: data)
            } catch {
              request.id = nil
              Self.resourceManager.cancelDataRequest(requestId)
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
              self.handleFailure(task: task, code: code, filePath: filePath)
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
              self.handleFailure(task: task, code: code, filePath: filePath)
            case .some:
              dPrint("Unknown error during download: \(String(describing: error))")
              self.handleFailure(task: task, code: .unknown, filePath: filePath)
            case .none:
              dPrint("Download completed for task \(task.taskId)")
              do {
                try fileHandle.write(contentsOf: footer)
                continuation.resume(returning: hasher.map { hasher in Data(hasher.finalize()).base64EncodedString() })
              } catch {
                try? FileManager.default.removeItem(at: filePath)
                continuation.resume(throwing: error)
              }
            }
          }
        )
      }
    } onCancel: {
      if let requestId = request.id {
        Self.resourceManager.cancelDataRequest(requestId)
      }
    }
  }

  private func handleFailure(task: LocalAssetDownloadData, code: UploadErrorCode, filePath: URL? = nil) {
    dPrint("Handling failure for task \(task.taskId) with code \(code.rawValue)")
    do {
      if let filePath {
        try? FileManager.default.removeItem(at: filePath)
      }

      try db.write { conn in
        try UploadTask.retryOrFail(code: code, status: .downloadFailed).where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      dPrint("Failed to update download failure status for task \(task.taskId): \(error)")
    }
  }
}
