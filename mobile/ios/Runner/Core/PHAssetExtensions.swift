import Photos

extension PHAsset {
  func toPlatformAsset() -> PlatformAsset {
    return PlatformAsset(
      id: localIdentifier,
      name: title,
      type: Int64(mediaType.rawValue),
      createdAt: creationDate.map { Int64($0.timeIntervalSince1970) },
      updatedAt: modificationDate.map { Int64($0.timeIntervalSince1970) },
      width: Int64(pixelWidth),
      height: Int64(pixelHeight),
      durationInSeconds: Int64(duration),
      orientation: 0,
      isFavorite: isFavorite
    )
  }

  var title: String {
    return filename ?? originalFilename ?? "<unknown>"
  }

  var filename: String? {
    return value(forKey: "filename") as? String
  }

  // This method is expected to be slow as it goes through the asset resources to fetch the originalFilename
  var originalFilename: String? {
    return getResource()?.originalFilename
  }

  func getResource() -> PHAssetResource? {
    let resources = PHAssetResource.assetResources(for: self)

    let filteredResources = resources.filter { $0.isMediaResource && isValidResourceType($0.type) }

    guard !filteredResources.isEmpty else {
      return nil
    }

    if filteredResources.count == 1 {
      return filteredResources.first
    }

    if let currentResource = filteredResources.first(where: { $0.isCurrent }) {
      return currentResource
    }

    if let fullSizeResource = filteredResources.first(where: { isFullSizeResourceType($0.type) }) {
      return fullSizeResource
    }

    return nil
  }

  private func isValidResourceType(_ type: PHAssetResourceType) -> Bool {
    switch mediaType {
    case .image:
      return [.photo, .alternatePhoto, .fullSizePhoto].contains(type)
    case .video:
      return [.video, .fullSizeVideo, .fullSizePairedVideo].contains(type)
    default:
      return false
    }
  }

  private func isFullSizeResourceType(_ type: PHAssetResourceType) -> Bool {
    switch mediaType {
    case .image:
      return type == .fullSizePhoto
    case .video:
      return type == .fullSizeVideo
    default:
      return false
    }
  }
}
