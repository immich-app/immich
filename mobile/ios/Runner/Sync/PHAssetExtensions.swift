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
    
    var bestResource: PHAssetResource?
    var bestPriority = Int.max
    
    for resource in resources {
      let priority = getPriority(for: resource)
      if priority == 0 {
        return resource
      }
      
      if priority < bestPriority {
        bestResource = resource
        bestPriority = priority
      }
    }
    
    return bestResource
  }
  
  private func getPriority(for resource: PHAssetResource) -> Int {
    switch (mediaType, resource.type) {
    case (.image, .photo), (.video, .video): return 0
    case (.image, .alternatePhoto): return 1
    case (_, .fullSizePhoto): return 2
    default:
      if (resource.isCurrent) { return 3 }
      if (resource.isMediaResource) { return 4 }
      return 5
    }
  }
}
