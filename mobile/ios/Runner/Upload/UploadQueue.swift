import SQLiteData
import StructuredFieldValues

class UploadQueue {
  private static let structuredEncoder = StructuredFieldValueEncoder()
  private static var queueProcessingTask: Task<Void, Never>?
  private static var queueProcessingLock = NSLock()

  private let db: DatabasePool
  private let cellularSession: URLSession
  private let wifiOnlySession: URLSession
  private let statusListener: StatusEventListener

  init(db: DatabasePool, cellularSession: URLSession, wifiOnlySession: URLSession, statusListener: StatusEventListener)
  {
    self.db = db
    self.cellularSession = cellularSession
    self.wifiOnlySession = wifiOnlySession
    self.statusListener = statusListener
  }
  
  func enqueueFiles(paths: [String]) async throws {
    guard !paths.isEmpty else { return dPrint("No paths to enqueue") }

    guard let deviceId = (try? await db.read { conn in try Store.get(conn, StoreKey.deviceId) }) else {
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
      for path in paths {
        draft.filePath = URL(fileURLWithPath: path, isDirectory: false)
        try UploadTask.insert { draft }.execute(conn)
      }
    }
    dPrint("Enqueued \(paths.count) assets for upload")
  }

  func startQueueProcessing() {
    dPrint("Starting upload queue processing")
    Self.queueProcessingLock.withLock {
      guard Self.queueProcessingTask == nil else { return }
      Self.queueProcessingTask = Task {
        await startUploads()
        Self.queueProcessingLock.withLock { Self.queueProcessingTask = nil }
      }
    }
  }

  private func startUploads() async {
    dPrint("Processing download queue")
    guard NetworkMonitor.shared.isConnected,
      let backupEnabled = try? await db.read({ conn in try Store.get(conn, StoreKey.enableBackup) }),
      backupEnabled
    else { return dPrint("Download queue paused: network disconnected or backup disabled") }

    do {
      let tasks: [LocalAssetUploadData] = try await db.read({ conn in
        guard let backupEnabled = try Store.get(conn, StoreKey.enableBackup), backupEnabled else { return [] }
        return try UploadTask.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }
          .where { task, asset in
            asset.checksum.isNot(nil) && task.status.eq(TaskStatus.uploadPending)
              && task.attempts < TaskConfig.maxRetries
              && task.filePath.isNot(nil)
          }
          .select { task, asset in
            LocalAssetUploadData.Columns(
              filePath: task.filePath.unwrapped,
              priority: task.priority,
              taskId: task.id,
              type: asset.type
            )
          }
          .limit { task, _ in UploadTaskStat.availableUploadSlots }
          .order { task, asset in (task.priority.desc(), task.createdAt) }
          .fetchAll(conn)
      })
      if tasks.isEmpty { return dPrint("No upload tasks to process") }

      await withTaskGroup(of: Void.self) { group in
        for task in tasks {
          group.addTask { await self.startUpload(multipart: task) }
        }
      }
    } catch {
      dPrint("Upload queue error: \(error)")
    }
  }

  private func startUpload(multipart task: LocalAssetUploadData) async {
    dPrint("Uploading asset resource at \(task.filePath) of task \(task.taskId)")
    defer { startQueueProcessing() }

    let (url, accessToken, session): (URL, String, URLSession)
    do {
      (url, accessToken, session) = try await db.read { conn in
        guard let url = try Store.get(conn, StoreKey.serverEndpoint),
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
      dPrint("Upload failed for \(task.taskId), could not retrieve server URL or access token: \(error)")
      return handleFailure(task: task, code: .noServerUrl)
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
      try await db.write { conn in
        try UploadTask.update { row in
          row.status = .uploadQueued
          row.filePath = nil
        }
        .where { $0.id.eq(task.taskId) }
        .execute(conn)
      }
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(task.taskId),
          filename: task.filePath.lastPathComponent,
          status: .uploadQueued,
        )
      )

      sessionTask.resume()
      dPrint("Upload started for task \(task.taskId) using \(session == wifiOnlySession ? "WiFi" : "Cellular") session")
    } catch {
      dPrint("Upload failed for \(task.taskId), could not update queue status: \(error.localizedDescription)")
    }
  }

  private func handleFailure(task: LocalAssetUploadData, code: UploadErrorCode) {
    do {
      try db.write { conn in
        try UploadTask.retryOrFail(code: code, status: .uploadFailed).where { $0.id.eq(task.taskId) }.execute(conn)
      }
    } catch {
      dPrint("Failed to update upload failure status for task \(task.taskId): \(error)")
    }
  }
}
