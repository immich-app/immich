protocol TaskProgressListener {
  func onTaskProgress(_ event: UploadApiTaskProgress)
}

protocol TaskStatusListener {
  func onTaskStatus(_ event: UploadApiTaskStatus)
}

final class StatusEventListener: StreamStatusStreamHandler, TaskStatusListener, @unchecked Sendable {
  var eventSink: PigeonEventSink<UploadApiTaskStatus>?

  override func onListen(withArguments arguments: Any?, sink: PigeonEventSink<UploadApiTaskStatus>) {
    eventSink = sink
  }

  func onTaskStatus(_ event: UploadApiTaskStatus) {
    if let eventSink {
      DispatchQueue.main.async { eventSink.success(event) }
    }
  }

  func onEventsDone() {
    DispatchQueue.main.async {
      self.eventSink?.endOfStream()
      self.eventSink = nil
    }
  }
}

final class ProgressEventListener: StreamProgressStreamHandler, TaskProgressListener, @unchecked Sendable {
  var eventSink: PigeonEventSink<UploadApiTaskProgress>?
  private var lastReportTimes: [String: Date] = [:]
  private let lock = NSLock()

  override func onListen(withArguments arguments: Any?, sink: PigeonEventSink<UploadApiTaskProgress>) {
    eventSink = sink
  }

  func onTaskProgress(_ event: UploadApiTaskProgress) {
    guard let eventSink,
      lock.withLock({
        let now = Date()
        if let lastReport = lastReportTimes[event.id] {
          guard now.timeIntervalSince(lastReport) >= TaskConfig.progressThrottleInterval else {
            return false
          }
        }
        lastReportTimes[event.id] = now
        return true
      })
    else { return }

    DispatchQueue.main.async { eventSink.success(event) }
  }

  func onEventsDone() {
    DispatchQueue.main.async {
      self.eventSink?.endOfStream()
      self.eventSink = nil
      self.lock.withLock {
        self.lastReportTimes.removeAll()
      }
    }
  }
}
