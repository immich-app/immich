import BackgroundTasks
import Network
import Photos
import SQLiteData
import StructuredFieldValues

extension Notification.Name {
  static let localAssetsDidUpdate = Notification.Name("localAssetsDidUpdate")
  static let networkDidConnect = Notification.Name("networkDidConnect")
}

class NetworkMonitor {
  static let shared = NetworkMonitor()
  private let monitor = NWPathMonitor()
  private(set) var isConnected = false
  private(set) var isExpensive = false

  private init() {
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self else { return }
      let wasConnected = self.isConnected
      self.isConnected = path.status == .satisfied
      self.isExpensive = path.isExpensive

      if !wasConnected && self.isConnected {
        NotificationCenter.default.post(name: .networkDidConnect, object: nil)
      }
    }
    monitor.start(queue: .global(qos: .utility))
  }
}

struct AssetData: StructuredFieldValue {
  static let structuredFieldType: StructuredFieldType = .dictionary

  let deviceAssetId: String
  let deviceId: String
  let fileCreatedAt: Date
  let fileModifiedAt: Date
  let fileName: String
  let isFavorite: Bool
  let livePhotoVideoId: String?

  static let boundary = "--Boundary-\(UUID().uuidString)\r\n".data(using: .utf8)!
  static let footer = "\r\n\(boundary)".data(using: .utf8)!
  static let deviceAssetIdHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"deviceAssetId\"\r\n\r\n"
    .data(using: .utf8)!
  static let deviceIdHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"deviceId\"\r\n\r\n".data(
    using: .utf8
  )!
  static let fileCreatedAtHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"fileCreatedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileModifiedAtHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"fileModifiedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileNameHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"fileName\"\r\n\r\n".data(
    using: .utf8
  )!
  static let isFavoriteHeader = "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"isFavorite\"\r\n\r\n".data(
    using: .utf8
  )!
  static let livePhotoVideoIdHeader =
    "\r\n\(boundary)\r\nContent-Disposition: form-data; name=\"livePhotoVideoId\"\r\n\r\n".data(using: .utf8)!
  static let trueData = "true".data(using: .utf8)!
  static let falseData = "false".data(using: .utf8)!

  func multipart() -> (Data, Data) {
    var header = Data()
    header.append(Self.deviceAssetIdHeader)
    header.append(deviceAssetId.data(using: .utf8)!)

    header.append(Self.deviceIdHeader)
    header.append(deviceId.data(using: .utf8)!)

    header.append(Self.fileCreatedAtHeader)
    header.append(String(fileCreatedAt.timeIntervalSince1970).data(using: .utf8)!)

    header.append(Self.fileModifiedAtHeader)
    header.append(String(fileModifiedAt.timeIntervalSince1970).data(using: .utf8)!)

    header.append(Self.fileNameHeader)
    header.append(fileName.data(using: .utf8)!)

    header.append(Self.isFavoriteHeader)
    header.append(isFavorite ? Self.trueData : Self.falseData)

    if let livePhotoVideoId {
      header.append(Self.livePhotoVideoIdHeader)
      header.append(livePhotoVideoId.data(using: .utf8)!)
    }
    return (header, Self.footer)
  }
}

class DownloadQueue {
  private static let resourceManager = PHAssetResourceManager.default()
  private static var queueProcessingTask: Task<Void, Never>?
  private static var queueProcessingLock = NSLock()

  private let db: DatabasePool
  private let uploadQueue: UploadQueue

  init(db: DatabasePool, uploadQueue: UploadQueue) {
    self.db = db
    self.uploadQueue = uploadQueue
    NotificationCenter.default.addObserver(forName: .networkDidConnect, object: nil, queue: nil) { [weak self] _ in
      self?.startQueueProcessing()
    }
  }

  func startQueueProcessing() {
    Self.queueProcessingLock.withLock {
      guard Self.queueProcessingTask == nil else { return }
      Self.queueProcessingTask = Task {
        await startDownloads()
        Self.queueProcessingLock.withLock { Self.queueProcessingTask = nil }
      }
    }
  }

  private func startDownloads() async {
    guard NetworkMonitor.shared.isConnected else { return }

    do {
      let tasks = try await db.read({ conn in
        return try UploadTask.assetData.where { task, _ in
          task.status.in([TaskStatus.downloadPending, TaskStatus.downloadFailed])
            && task.attempts < TaskConfig.maxAttempts
            && (task.retryAfter.is(nil) || task.retryAfter.unwrapped <= Date().unixTime)
            && !task.lastError.unwrapped.in([
              UploadErrorCode.assetNotFound, UploadErrorCode.resourceNotFound, UploadErrorCode.invalidResource,
            ])
        }
        .order { task, asset in (task.priority.desc(), task.createdAt) }
        .limit { _, _ in UploadTaskStat.availableDownloadSlots }
        .fetchAll(conn)
      })
      if tasks.isEmpty { return }

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
      print("Download queue error: \(error)")
    }
  }

  private func downloadAndQueue(_ task: LocalAssetTaskData) async {
    defer { startQueueProcessing() }

    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [task.localId], options: nil).firstObject,
      let resource = asset.getResource()
    else {
      return handleFailure(task: task, code: .assetNotFound)
    }

    guard let deviceId = (try? await db.read { conn in try Store.get(conn, StoreKey.deviceId) }) else {
      return handleFailure(task: task, code: .noDeviceId)
    }

    let fileDir = TaskConfig.originalsDir
    let filePath = fileDir.appendingPathComponent("\(resource.assetLocalIdentifier)_\(resource.type.rawValue)")
    do {
      try FileManager.default.createDirectory(
        at: fileDir,
        withIntermediateDirectories: true,
        attributes: nil
      )
    } catch {
      return handleFailure(task: task, code: .writeFailed, filePath: filePath)
    }

    do {
      try await db.write { conn in
        try UploadTask.update {
          $0.status = .downloadQueued
          $0.filePath = filePath
        }.where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      return print("Failed to set file path for download task \(task.taskId): \(error)")
    }

    do {
      for try await _ in downloadAsset(task: task, resource: resource, toMultipart: filePath, deviceId: deviceId) {
        // TODO: progress events
      }
      try await db.write { conn in
        try UploadTask.update { $0.status = .uploadPending }.where { $0.id.eq(task.taskId) }.execute(conn)
      }
      uploadQueue.startQueueProcessing()
    } catch {
      handleFailure(task: task, code: .writeFailed, filePath: filePath)
    }
  }

  func downloadAsset(task: LocalAssetTaskData, resource: PHAssetResource, toMultipart filePath: URL, deviceId: String)
    -> AsyncThrowingStream<Double, Error>
  {
    AsyncThrowingStream { continuation in
      let options = PHAssetResourceRequestOptions()
      options.isNetworkAccessAllowed = true

      let (header, footer) = AssetData(
        deviceAssetId: task.localId,
        deviceId: deviceId,
        fileCreatedAt: task.createdAt,
        fileModifiedAt: task.updatedAt,
        fileName: task.fileName,
        isFavorite: task.isFavorite,
        livePhotoVideoId: nil
      ).multipart()

      // closed on dealloc
      guard let fileHandle = FileHandle(forWritingAtPath: filePath.path),
        (try? fileHandle.write(contentsOf: header)) != nil
      else {
        handleFailure(task: task, code: .writeFailed, filePath: filePath)
        return continuation.finish(
          throwing: NSError(domain: "DownloadError", code: UploadErrorCode.writeFailed.rawValue)
        )
      }

      class RequestRef {
        var id: PHAssetResourceDataRequestID?
        var lastProgressTime = Date()
        var didStall = false
      }

      var lastProgressTime = Date()
      options.progressHandler = { progress in
        lastProgressTime = Date()
        continuation.yield(progress)
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

      request.id = Self.resourceManager.requestData(
        for: resource,
        options: options,
        dataReceivedHandler: { data in
          guard let requestId = request.id else { return }
          do {
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
            let code: UploadErrorCode =
              switch e.code {
              case 1005: .iCloudRateLimit
              case 81: .iCloudThrottled
              default: .photosUnknownError
              }
            self.handleFailure(task: task, code: code, filePath: filePath)
          case let e as PHPhotosError:
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
            self.handleFailure(task: task, code: .unknown, filePath: filePath)
          case .none:
            do {
              try fileHandle.write(contentsOf: footer)
            } catch {
              try? FileManager.default.removeItem(at: filePath)
              continuation.finish(throwing: error)
            }
            continuation.yield(1.0)
            continuation.finish()
          }
        }
      )

      continuation.onTermination = { termination in
        if case .cancelled = termination {
          if let requestId = request.id {
            Self.resourceManager.cancelDataRequest(requestId)
          }
        }
      }
    }
  }

  private func handleFailure(task: LocalAssetTaskData, code: UploadErrorCode, filePath: URL? = nil) {
    do {
      if let filePath {
        try? FileManager.default.removeItem(at: filePath)
      }

      try db.write { conn in
        try UploadTask.retryOrFail(code: code, status: .downloadFailed).where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      print("Failed to update download failure status for task \(task.taskId): \(error)")
    }
  }
}

class UploadQueue {
  private static let structuredEncoder = StructuredFieldValueEncoder()
  private static var queueProcessingTask: Task<Void, Never>?
  private static var queueProcessingLock = NSLock()

  private let db: DatabasePool
  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession

  init(db: DatabasePool, cellularSession: URLSession, wifiOnlySession: URLSession) {
    self.db = db
    self.cellularSession = cellularSession
    self.wifiOnlySession = wifiOnlySession
  }

  func startQueueProcessing() {
    Self.queueProcessingLock.withLock {
      guard Self.queueProcessingTask == nil else { return }
      Self.queueProcessingTask = Task {
        await startUploads()
        Self.queueProcessingLock.withLock { Self.queueProcessingTask = nil }
      }
    }
  }

  private func startUploads() async {
    guard NetworkMonitor.shared.isConnected else { return }

    do {
      let tasks = try await db.read({ conn in
        try UploadTask.assetData
          .where { task, _ in
            task.status.eq(TaskStatus.uploadPending) && task.attempts < TaskConfig.maxAttempts
              && task.filePath.isNot(nil)
          }
          .limit { task, _ in UploadTaskStat.availableUploadSlots }
          .order { task, asset in (task.priority.desc(), task.createdAt) }
          .fetchAll(conn)
      })
      if tasks.isEmpty { return }

      await withTaskGroup(of: Void.self) { group in
        for task in tasks {
          group.addTask { await self.startUpload(multipart: task) }
        }
      }
    } catch {
      print("Upload queue error: \(error)")
    }
  }

  private func startUpload(multipart task: LocalAssetTaskData) async {
    defer { startQueueProcessing() }

    guard let filePath = task.filePath else {
      return handleFailure(task: task, code: .fileNotFound)
    }

    let (url, accessToken, session): (URL, String, URLSession)
    do {
      (url, accessToken, session) = try await db.read { conn in
        guard let url = try Store.get(conn, StoreKey.serverUrl),
          let accessToken = try Store.get(conn, StoreKey.accessToken)
        else {
          throw StoreError.notFound
        }

        let session =
          switch task.type {
          case .image:
            (try? Store.get(conn, StoreKey.useWifiForUploadPhotos)) ?? false ? cellularSession : wifiOnlySession
          case .video:
            (try? Store.get(conn, StoreKey.useWifiForUploadVideos)) ?? false ? cellularSession : wifiOnlySession
          default: wifiOnlySession
          }
        return (url, accessToken, session)
      }
    } catch {
      return handleFailure(task: task, code: .noServerUrl)
    }

    var request = URLRequest(url: url.appendingPathComponent("/api/upload"))
    request.httpMethod = "POST"
    request.setValue(accessToken, forHTTPHeaderField: UploadHeaders.userToken.rawValue)

    let sessionId = UUID().uuidString
    let sessionTask = session.uploadTask(with: request, fromFile: filePath)
    sessionTask.taskDescription = sessionId
    sessionTask.priority = task.priority
    do {
      try? FileManager.default.removeItem(at: filePath)  // upload task already copied the file
      try await db.write { conn in
        try UploadTask.update { row in
          row.status = .uploadQueued
          row.sessionId = sessionId
          row.filePath = nil
        }
        .where { $0.id.eq(task.taskId) }
        .execute(conn)
      }

      sessionTask.resume()
    } catch {
      print("Upload failed for \(task.taskId), could not update queue status: \(error.localizedDescription)")
    }
  }

  private func handleFailure(task: LocalAssetTaskData, code: UploadErrorCode) {
    do {
      try db.write { conn in
        try UploadTask.retryOrFail(code: code, status: .uploadFailed).where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      print("Failed to update upload failure status for task \(task.taskId): \(error)")
    }
  }
}

class UploadApiDelegate: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
  private let db: DatabasePool
  weak var downloadQueue: DownloadQueue?
  weak var uploadQueue: UploadQueue?

  init(db: DatabasePool) {
    self.db = db
    super.init()
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    Task {
      defer {
        downloadQueue?.startQueueProcessing()
        uploadQueue?.startQueueProcessing()
      }

      guard let sessionTaskID = task.taskDescription else {
        return print("Unexpected: task without session ID completed")
      }

      guard let error else {
        return await handleSuccess(sessionTaskID: sessionTaskID)
      }

      guard let urlError = error as? URLError else {
        return await handleFailure(sessionTaskID: sessionTaskID)
      }

      if #available(iOS 17, *), let resumeData = urlError.uploadTaskResumeData {
        return await handleFailure(sessionTaskID: sessionTaskID, session: session, resumeData: resumeData)
      }

      let code: UploadErrorCode =
        switch urlError.backgroundTaskCancelledReason {
        case .backgroundUpdatesDisabled: .backgroundUpdatesDisabled
        case .insufficientSystemResources: .outOfResources
        case .userForceQuitApplication: .forceQuit
        default:
          switch urlError.code {
          case .networkConnectionLost, .notConnectedToInternet: .networkError
          case .timedOut: .uploadTimeout
          case .resourceUnavailable, .fileDoesNotExist: .fileNotFound
          default: .unknown
          }
        }
      await handleFailure(sessionTaskID: sessionTaskID, code: code)
    }
  }

  private func handleSuccess(sessionTaskID: String) async {
    do {
      try await db.write { conn in
        try UploadTask.update { $0.status = .uploadComplete }.where { $0.sessionId.eq(sessionTaskID) }
          .execute(conn)
      }
    } catch {
      print(
        "Failed to update upload success status for session task \(sessionTaskID): \(error.localizedDescription)"
      )
    }
  }

  private func handleFailure(sessionTaskID: String, code: UploadErrorCode = .unknown) async {
    try? await db.write { conn in
      try UploadTask.retryOrFail(code: code, status: .uploadFailed).where { $0.sessionId.eq(sessionTaskID) }
        .execute(conn)
    }
  }

  @available(iOS 17, *)
  private func handleFailure(sessionTaskID: String, session: URLSession, resumeData: Data) async {
    let newSessionId = UUID().uuidString
    let resumeTask = session.uploadTask(withResumeData: resumeData)
    resumeTask.taskDescription = newSessionId
    try? await db.write { conn in
      try UploadTask.update { row in row.sessionId = newSessionId }
        .where { $0.sessionId.eq(sessionTaskID) }.execute(conn)
    }
    resumeTask.resume()
  }
}

class UploadApiImpl: UploadApi {
  private let db: DatabasePool
  private let downloadQueue: DownloadQueue
  private let uploadQueue: UploadQueue

  private var isInitialized = false
  private let initLock = NSLock()

  private var backupTask: Task<Void, Never>?
  private let backupLock = NSLock()

  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession

  init() {
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
    let delegate = UploadApiDelegate(db: db)
    self.cellularSession = URLSession(configuration: cellularConfig, delegate: delegate, delegateQueue: nil)

    let wifiOnlyConfig = URLSessionConfiguration.background(withIdentifier: "\(TaskConfig.sessionId).wifi")
    wifiOnlyConfig.allowsCellularAccess = false
    wifiOnlyConfig.waitsForConnectivity = true
    self.wifiOnlySession = URLSession(configuration: wifiOnlyConfig, delegate: delegate, delegateQueue: nil)

    self.uploadQueue = UploadQueue(db: db, cellularSession: cellularSession, wifiOnlySession: wifiOnlySession)
    self.downloadQueue = DownloadQueue(db: db, uploadQueue: uploadQueue)
    delegate.downloadQueue = downloadQueue
    delegate.uploadQueue = uploadQueue
    NotificationCenter.default.addObserver(forName: .localAssetsDidUpdate, object: nil, queue: nil) { [weak self] _ in
      self?.startBackup()
    }
  }

  func initialize(completion: @escaping (Result<Void, any Error>) -> Void) {
    Task(priority: TaskPriority.high) {
      do {
        let sessionTasks = await withTaskGroup(of: [URLSessionTask].self, returning: [URLSessionTask].self) { group in
          group.addTask { await self.cellularSession.allTasks }
          group.addTask { await self.wifiOnlySession.allTasks }

          var values = [URLSessionTask]()
          for await value in group {
            for task in value {
              values.append(task)
            }
          }
          return values
        }

        var sessionIdSet = Set(sessionTasks.compactMap(\.taskDescription))
        let sessionIds = Array(sessionIdSet)
        sessionIdSet.removeAll(keepingCapacity: true)
        try await db.write { conn in
          try UploadTask.update { row in
            row.status = .downloadPending  // file was already deleted after creating upload task
            row.sessionId = nil
          }
          .where { task in
            task.status.eq(TaskStatus.uploadQueued) && !task.sessionId.unwrapped.in(sessionIds)
          }
          .execute(conn)
        }

        sessionIdSet.formUnion(
          try await db.read { conn in
            try UploadTask.select(\.sessionId.unwrapped)
              .where { $0.status.eq(TaskStatus.uploadQueued) && $0.sessionId.isNot(nil) }
              .fetchAll(conn)
          }
        )

        for task in sessionTasks {
          guard let taskId = task.taskDescription, sessionIdSet.contains(taskId) else {
            task.cancel()
            continue
          }
        }

        try await db.write { conn in
          return try UploadTask.update {
            $0.filePath = nil
            $0.status = .downloadPending
          }
          .where { $0.status.in([TaskStatus.downloadQueued, TaskStatus.uploadPending]) }
          .execute(_:)(conn)
        }

        try? FileManager.default.removeItem(at: TaskConfig.originalsDir)
        initLock.withLock { isInitialized = true }
        startBackup()
        completion(.success(()))
      } catch {
        completion(.failure(error))
      }
    }
  }

  func startBackup() {
    guard (initLock.withLock { isInitialized }) else { return }

    backupLock.withLock {
      guard backupTask == nil else { return }
      backupTask = Task {
        await _startBackup()
        backupLock.withLock { backupTask = nil }
      }
    }
  }

  private func _startBackup() async {
    do {
      let candidates = try await db.read { conn in
        return try LocalAsset.getCandidates()
          .where { asset in !UploadTask.where { task in task.localId.eq(asset.id) }.exists() }
          .select(\.id)
          .limit { _ in UploadTaskStat.availableSlots }
          .fetchAll(conn)
      }

      guard !candidates.isEmpty else { return }

      try await db.write { conn in
        var draft = UploadTask.Draft(
          attempts: 0,
          createdAt: Date(),
          filePath: nil,
          lastError: nil,
          localId: "",
          method: .multipart,
          priority: 0.5,
          remoteId: nil,
          retryAfter: nil,
          sessionId: nil,
          status: .downloadPending,
        )
        for assetId in candidates {
          draft.localId = assetId
          try UploadTask.insert {
            draft
          } onConflict: {
            $0.localId
          }
          .execute(conn)
        }
      }

      downloadQueue.startQueueProcessing()
    } catch {
      print("Backup queue error: \(error)")
    }
  }
}
