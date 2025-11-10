import SQLiteData

class UploadApiDelegate: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
  private static let stateLock = NSLock()
  private static var transferStates: [Int64: NetworkTransferState] = [:]
  private static var responseData: [Int64: Data] = [:]
  private static let jsonDecoder = JSONDecoder()

  private let db: DatabasePool
  private let statusListener: StatusEventListener
  private let progressListener: ProgressEventListener
  weak var downloadQueue: DownloadQueue?
  weak var uploadQueue: UploadQueue?

  init(db: DatabasePool, statusListener: StatusEventListener, progressListener: ProgressEventListener) {
    self.db = db
    self.statusListener = statusListener
    self.progressListener = progressListener
  }

  static func reset() {
    stateLock.withLock {
      transferStates.removeAll()
      responseData.removeAll()
    }
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    guard let taskIdStr = dataTask.taskDescription,
      let taskId = Int64(taskIdStr)
    else { return }

    Self.stateLock.withLock {
      if var response = Self.responseData[taskId] {
        response.append(data)
      } else {
        Self.responseData[taskId] = data
      }
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    Task {
      defer {
        downloadQueue?.startQueueProcessing()
        uploadQueue?.startQueueProcessing()
      }

      guard let taskDescriptionId = task.taskDescription,
        let taskId = Int64(taskDescriptionId)
      else {
        return dPrint("Unexpected: task without session ID completed")
      }

      defer {
        Self.stateLock.withLock { let _ = Self.transferStates.removeValue(forKey: taskId) }
      }

      if let responseData = Self.stateLock.withLock({ Self.responseData.removeValue(forKey: taskId) }),
        let httpResponse = task.response as? HTTPURLResponse
      {
        switch httpResponse.statusCode {
        case 200, 201:
          do {
            let response = try Self.jsonDecoder.decode(UploadSuccessResponse.self, from: responseData)
            return await handleSuccess(taskId: taskId, response: response)
          } catch {
            return await handleFailure(taskId: taskId, code: .invalidResponse)
          }
        case 400..<500:
          dPrint(
            "Response \(httpResponse.statusCode): \(String(data: responseData, encoding: .utf8) ?? "No response body")"
          )
          return await handleFailure(taskId: taskId, code: .badRequest)
        default:
          break
        }
      }

      guard let urlError = error as? URLError else {
        return await handleFailure(taskId: taskId)
      }

      if #available(iOS 17, *), let resumeData = urlError.uploadTaskResumeData {
        return await handleFailure(taskDescriptionId: taskDescriptionId, session: session, resumeData: resumeData)
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
      await handleFailure(taskId: taskId, code: code)
    }
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {
    guard let sessionTaskId = task.taskDescription, let taskId = Int64(sessionTaskId) else { return }
    let currentTime = Date()
    let state = Self.stateLock.withLock {
      if let existing = Self.transferStates[taskId] {
        return existing
      }
      let new = NetworkTransferState(
        lastUpdateTime: currentTime,
        totalBytesTransferred: totalBytesSent,
        currentSpeed: nil
      )
      Self.transferStates[taskId] = new
      return new
    }

    let timeDelta = currentTime.timeIntervalSince(state.lastUpdateTime)
    guard timeDelta > 0 else { return }

    let bytesDelta = totalBytesSent - state.totalBytesTransferred
    let instantSpeed = Double(bytesDelta) / timeDelta
    let currentSpeed =
      if let previousSpeed = state.currentSpeed {
        TaskConfig.transferSpeedAlpha * instantSpeed + (1 - TaskConfig.transferSpeedAlpha) * previousSpeed
      } else {
        instantSpeed
      }
    state.currentSpeed = currentSpeed
    state.lastUpdateTime = currentTime
    state.totalBytesTransferred = totalBytesSent
    self.progressListener.onTaskProgress(
      UploadApiTaskProgress(
        id: sessionTaskId,
        progress: Double(totalBytesSent) / Double(totalBytesExpectedToSend),
        speed: currentSpeed
      )
    )
  }

  private func handleSuccess(taskId: Int64, response: UploadSuccessResponse) async {
    dPrint("Upload succeeded for task \(taskId), server ID: \(response.id)")
    do {
      try await db.write { conn in
        let task = try UploadTask.update { $0.status = .uploadComplete }.where({ $0.id.eq(taskId) })
          .returning(\.self).fetchOne(conn)
        guard let task, let isLivePhoto = task.isLivePhoto, isLivePhoto, task.livePhotoVideoId == nil else { return }
        try UploadTask.insert {
          UploadTask.Draft(
            attempts: 0,
            createdAt: Date(),
            filePath: nil,
            isLivePhoto: true,
            lastError: nil,
            livePhotoVideoId: response.id,
            localId: task.localId,
            method: .multipart,
            priority: 0.7,
            retryAfter: nil,
            status: .downloadPending,
          )
        }.execute(conn)
      }
      dPrint("Updated upload success status for session task \(taskId)")
    } catch {
      dPrint(
        "Failed to update upload success status for session task \(taskId): \(error.localizedDescription)"
      )
    }
  }

  private func handleFailure(taskId: Int64, code: UploadErrorCode = .unknown) async {
    dPrint("Upload failed for task \(taskId) with code \(code)")
    try? await db.write { conn in
      try UploadTask.retryOrFail(code: code, status: .uploadFailed).where { $0.id.eq(taskId) }
        .execute(conn)
    }
  }

  @available(iOS 17, *)
  private func handleFailure(taskDescriptionId: String, session: URLSession, resumeData: Data) async {
    dPrint("Resuming upload for task \(taskDescriptionId)")
    let resumeTask = session.uploadTask(withResumeData: resumeData)
    resumeTask.taskDescription = taskDescriptionId
    resumeTask.resume()
  }

  private class NetworkTransferState {
    var lastUpdateTime: Date
    var totalBytesTransferred: Int64
    var currentSpeed: Double?

    init(lastUpdateTime: Date, totalBytesTransferred: Int64, currentSpeed: Double?) {
      self.lastUpdateTime = lastUpdateTime
      self.totalBytesTransferred = totalBytesTransferred
      self.currentSpeed = currentSpeed
    }
  }
}
