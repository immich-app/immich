import SQLiteData

private let stateLock = NSLock()
private var transferStates: [Int64: NetworkTransferState] = [:]
private var responseData: [Int64: Data] = [:]
private let jsonDecoder = JSONDecoder()

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

final class UploadApiDelegate<
  TaskRepo: TaskProtocol,
  StatusListener: TaskStatusListener,
  ProgressListener: TaskProgressListener
>: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
  private let taskRepository: TaskRepo
  private let statusListener: StatusListener
  private let progressListener: ProgressListener

  init(taskRepository: TaskRepo, statusListener: StatusListener, progressListener: ProgressListener) {
    self.taskRepository = taskRepository
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

    stateLock.withLock {
      if var response = responseData[taskId] {
        response.append(data)
      } else {
        responseData[taskId] = data
      }
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    Task {
      defer {
        NotificationCenter.default.post(name: .uploadTaskDidComplete, object: nil)
      }

      guard let taskDescriptionId = task.taskDescription,
        let taskId = Int64(taskDescriptionId)
      else {
        return dPrint("Unexpected: task without session ID completed")
      }

      defer {
        stateLock.withLock { let _ = transferStates.removeValue(forKey: taskId) }
      }

      if let body = stateLock.withLock({ responseData.removeValue(forKey: taskId) }),
        let response = task.response as? HTTPURLResponse
      {
        switch response.statusCode {
        case 200, 201:
          do {
            let response = try jsonDecoder.decode(UploadSuccessResponse.self, from: body)
            return await handleSuccess(taskId: taskId, response: response)
          } catch {
            return await handleFailure(taskId: taskId, code: .invalidResponse)
          }
        case 401: return await handleFailure(taskId: taskId, code: .unauthorized)
        case 400..<500:
          dPrint("Response \(response.statusCode): \(String(data: body, encoding: .utf8) ?? "No response body")")
          return await handleFailure(taskId: taskId, code: .badRequest)
        case 500..<600:
          dPrint("Response \(response.statusCode): \(String(data: body, encoding: .utf8) ?? "No response body")")
          return await handleFailure(taskId: taskId, code: .internalServerError)
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
    let state = stateLock.withLock {
      if let existing = transferStates[taskId] {
        return existing
      }
      let new = NetworkTransferState(
        lastUpdateTime: currentTime,
        totalBytesTransferred: totalBytesSent,
        currentSpeed: nil
      )
      transferStates[taskId] = new
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

  func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
    dPrint("All background events delivered for session: \(session.configuration.identifier ?? "unknown")")
    DispatchQueue.main.async {
      if let identifier = session.configuration.identifier,
        let appDelegate = UIApplication.shared.delegate as? AppDelegate,
        let completionHandler = appDelegate.completionHandler(forSession: identifier)
      {
        completionHandler()
      }
    }
  }

  private func handleSuccess(taskId: Int64, response: UploadSuccessResponse) async {
    dPrint("Upload succeeded for task \(taskId), server ID: \(response.id)")
    do {
      try await taskRepository.markUploadSuccess(taskId: taskId, livePhotoVideoId: response.id)
      statusListener.onTaskStatus(
        UploadApiTaskStatus(
          id: String(taskId),
          filename: (try? await taskRepository.getFilename(taskId: taskId)) ?? "",
          status: .uploadComplete
        )
      )
    } catch {
      dPrint(
        "Failed to update upload success status for session task \(taskId): \(error.localizedDescription)"
      )
    }
  }

  private func handleFailure(taskId: Int64, code: UploadErrorCode = .unknown) async {
    dPrint("Upload failed for task \(taskId) with code \(code)")
    try? await taskRepository.retryOrFail(taskId: taskId, code: code, status: .uploadFailed)
    statusListener.onTaskStatus(
      UploadApiTaskStatus(
        id: String(taskId),
        filename: (try? await taskRepository.getFilename(taskId: taskId)) ?? "",
        status: .uploadFailed
      )
    )
  }

  @available(iOS 17, *)
  private func handleFailure(taskDescriptionId: String, session: URLSession, resumeData: Data) async {
    dPrint("Resuming upload for task \(taskDescriptionId)")
    let resumeTask = session.uploadTask(withResumeData: resumeData)
    resumeTask.taskDescription = taskDescriptionId
    resumeTask.resume()
  }
}
