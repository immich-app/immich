import Photos

class AssetMediaApiImpl: ImmichPlugin, AssetMediaApi, FlutterPlugin {
  static let name = "AssetMediaApi"

  private var messenger: FlutterBinaryMessenger?

  static func register(with registrar: FlutterPluginRegistrar) {
    let instance = AssetMediaApiImpl()
    instance.messenger = registrar.messenger()
    AssetMediaApiSetup.setUp(binaryMessenger: registrar.messenger(), api: instance)
    registrar.publish(instance)
  }

  func detachFromEngine(for registrar: FlutterPluginRegistrar) {
    detachFromEngine()
  }

  override func detachFromEngine() {
    if let messenger {
      AssetMediaApiSetup.setUp(binaryMessenger: messenger, api: nil)
    }
    messenger = nil
    super.detachFromEngine()
  }

  // Trash and delete are the same on iOS
  func trash(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    delete(ids: ids, completion: completion)
  }

  func delete(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self else { return }

      let assets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)

      guard assets.count > 0 else {
        self.completeWhenActive(
          for: completion,
          with: .success(ids.map { AssetMediaActionResult(id: $0, status: .notFound) })
        )
        return
      }

      var seen = Set<String>()
      assets.enumerateObjects { asset, _, _ in seen.insert(asset.localIdentifier) }

      guard !self.detached else { return }

      PHPhotoLibrary.shared().performChanges {
        PHAssetChangeRequest.deleteAssets(assets)
      } completionHandler: { success, _ in
        let status: AssetMediaActionStatus = success ? .done : .failed
        let results = ids.map {
          AssetMediaActionResult(id: $0, status: seen.contains($0) ? status : .notFound)
        }
        self.completeWhenActive(for: completion, with: .success(results))
      }
    }
  }


  func restore(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    completeWhenActive(
      for: completion,
      with: .failure(
        PigeonError(
          code: kUnsupportedOs,
          message: "PhotoKit cannot restore assets from Recently Deleted",
          details: nil
        )
      )
    )
  }

  func saveFile(
    path: String,
    name: String,
    isVideo: Bool,
    relativePath: String?, // Relative Path is Android only
    completion: @escaping (Result<String, Error>) -> Void
  ) {
    guard FileManager.default.fileExists(atPath: path) else {
      completeWhenActive(
        for: completion,
        with: .failure(PigeonError(code: kSaveError, message: "No file to save at \(path)", details: nil))
      )
      return
    }

    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let self, !self.detached else { return }

      var createdId: String?
      PHPhotoLibrary.shared().performChanges {
        let request = PHAssetCreationRequest.forAsset()
        let options = PHAssetResourceCreationOptions()
        options.originalFilename = name
        request.addResource(with: isVideo ? .video : .photo, fileURL: URL(fileURLWithPath: path), options: options)
        createdId = request.placeholderForCreatedAsset?.localIdentifier
      } completionHandler: { success, error in
        guard success, let createdId else {
          self.completeWhenActive(
            for: completion,
            with: .failure(
              PigeonError(
                code: kSaveError,
                message: error?.localizedDescription ?? "The photo library rejected \(name)",
                details: nil
              )
            )
          )
          return
        }
        self.completeWhenActive(for: completion, with: .success(createdId))
      }
    }
  }

  func saveLivePhoto(
    imagePath: String,
    videoPath: String,
    name: String,
    completion: @escaping (Result<String, Error>) -> Void
  ) {
    let fileManager = FileManager.default
    for path in [imagePath, videoPath] where !fileManager.fileExists(atPath: path) {
      completeWhenActive(
        for: completion,
        with: .failure(PigeonError(code: kSaveError, message: "No file to save at \(path)", details: nil))
      )
      return
    }

    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let self, !self.detached else { return }

      var createdId: String?
      PHPhotoLibrary.shared().performChanges {
        let request = PHAssetCreationRequest.forAsset()

        let imageOptions = PHAssetResourceCreationOptions()
        imageOptions.originalFilename = name
        request.addResource(with: .photo, fileURL: URL(fileURLWithPath: imagePath), options: imageOptions)

        let videoOptions = PHAssetResourceCreationOptions()
        videoOptions.originalFilename = name
        request.addResource(with: .pairedVideo, fileURL: URL(fileURLWithPath: videoPath), options: videoOptions)

        createdId = request.placeholderForCreatedAsset?.localIdentifier
      } completionHandler: { success, error in
        guard success, let createdId else {
          let error = error as NSError?
          self.completeWhenActive(
            for: completion,
            with: .failure(
              PigeonError(
                code: error?.domain ?? kSaveError,
                message: error?.localizedDescription ?? "The photo library rejected \(name)",
                details: nil
              )
            )
          )
          return
        }
        self.completeWhenActive(for: completion, with: .success(createdId))
      }
    }
  }
}
