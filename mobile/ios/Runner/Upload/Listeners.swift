class StatusEventListener: StreamStatusStreamHandler {
  var eventSink: PigeonEventSink<UploadApiTaskStatus>?

  override func onListen(withArguments arguments: Any?, sink: PigeonEventSink<UploadApiTaskStatus>) {
    eventSink = sink
  }

  func onTaskStatus(_ event: UploadApiTaskStatus) {
    if let eventSink = eventSink {
      eventSink.success(event)
    }
  }

  func onEventsDone() {
    eventSink?.endOfStream()
    eventSink = nil
  }
}

class ProgressEventListener: StreamProgressStreamHandler {
  var eventSink: PigeonEventSink<UploadApiTaskProgress>?

  override func onListen(withArguments arguments: Any?, sink: PigeonEventSink<UploadApiTaskProgress>) {
    eventSink = sink
  }

  func onTaskProgress(_ event: UploadApiTaskProgress) {
    if let eventSink = eventSink {
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
