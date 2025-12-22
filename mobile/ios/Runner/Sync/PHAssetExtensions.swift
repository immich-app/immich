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
      isFavorite: isFavorite,
      adjustmentTime: adjustmentTimestamp,
      latitude: location?.coordinate.latitude,
      longitude: location?.coordinate.longitude
    )
  }

  var title: String {
    return filename ?? originalFilename ?? "<unknown>"
  }

  var filename: String? {
    return value(forKey: "filename") as? String
  }
  
  var adjustmentTimestamp: Int64? {
    if let date = value(forKey: "adjustmentTimestamp") as? Date {
      return Int64(date.timeIntervalSince1970)
    }
    return nil
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

  /// Get the RAW resource for this asset, if available.
  /// Returns nil if the asset doesn't have a RAW resource.
  ///
  /// In iOS, when a photo has both JPEG and RAW, they are stored as separate resources:
  /// - The primary resource (usually JPEG/HEIC) has type `.photo` (1)
  /// - The RAW resource has type `.alternatePhoto` (4)
  /// Both may have `isCurrent = true` when imported from camera.
  func getRawResource() -> PHAssetResource? {
    guard mediaType == .image else {
      return nil
    }

    let resources = PHAssetResource.assetResources(for: self)
    let rawExtensions = [
      "dng", "raw", "raf", "cr2", "cr3", "nef", "arw", "orf", "rw2", "pef", "srw",
    ]

    // Filter to only image resources (including alternatePhoto which is type=4 for RAW files)
    let imageResources = resources.filter {
      $0.isMediaResource
        && ($0.type == .photo || $0.type == .fullSizePhoto || $0.type == .alternatePhoto)
    }

    // If there's only one image resource, there's no RAW+JPEG pair
    guard imageResources.count > 1 else {
      return nil
    }

    // First, try to find a resource with .alternatePhoto type (type=4) which is typically RAW
    if let rawResource = imageResources.first(where: { $0.type == .alternatePhoto }) {
      let filename = rawResource.originalFilename.lowercased()
      if rawExtensions.contains(where: { filename.hasSuffix(".\($0)") }) {
        return rawResource
      }
    }

    // Second, try to find by isCurrent=false (older pairing method)
    if let rawResource = imageResources.first(where: { !$0.isCurrent }) {
      let filename = rawResource.originalFilename.lowercased()
      if rawExtensions.contains(where: { filename.hasSuffix(".\($0)") }) {
        return rawResource
      }
    }

    // Third, look for any resource with RAW file extension
    for resource in imageResources {
      let filename = resource.originalFilename.lowercased()
      if rawExtensions.contains(where: { filename.hasSuffix(".\($0)") }) {
        return resource
      }
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
