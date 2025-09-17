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
    
    let filteredResources = resources.filter { resource in
      guard resource.isMediaResource else {
        return false
      }
      
      switch self.mediaType {
      case .image:
        return resource.type == .photo || resource.type == .alternatePhoto || resource.type == .fullSizePhoto
      case .video:
        return resource.type == .video || resource.type == .fullSizeVideo || resource.type == .fullSizePairedVideo
      case .audio:
        return resource.type == .audio
      case .unknown:
        return false
      @unknown default:
        return false
      }
    }
    
    guard !filteredResources.isEmpty else {
      return nil
    }
    
    if filteredResources.count == 1 {
      return filteredResources.first
    }
    
    if let currentResource = filteredResources.first(where: {
      ($0.value(forKey: "isCurrent") as? Bool) ?? false
    }) {
      return currentResource
    }
    
    if let fullSizeResource = filteredResources.first(where: {
      (self.mediaType == .image && $0.type == .fullSizePhoto) ||
      (self.mediaType == .video && $0.type == .fullSizeVideo)
    }) {
      return fullSizeResource
    }
    
    return nil
  }
}
