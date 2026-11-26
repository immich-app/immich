import Photos

class MediaChangeStreamHandler: StreamMediaChangesStreamHandler {
  private class Observer: NSObject, PHPhotoLibraryChangeObserver {
    let onChange: () -> Void

    init(onChange: @escaping () -> Void) {
      self.onChange = onChange
    }

    func photoLibraryDidChange(_ changeInstance: PHChange) {
      onChange()
    }
  }

  private var sink: PigeonEventSink<PlatformMediaChange>?
  private var observer: Observer?

  override func onListen(withArguments arguments: Any?, sink: PigeonEventSink<PlatformMediaChange>) {
    self.sink = sink
    let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    guard observer == nil, status == .authorized || status == .limited else {
      return
    }

    let observer = Observer { [weak self] in
      DispatchQueue.main.async { self?.sink?.success(PlatformMediaChange()) }
    }
    PHPhotoLibrary.shared().register(observer)
    self.observer = observer
  }

  override func onCancel(withArguments arguments: Any?) {
    if let observer {
      PHPhotoLibrary.shared().unregisterChangeObserver(observer)
    }
    observer = nil
    sink = nil
  }
}
