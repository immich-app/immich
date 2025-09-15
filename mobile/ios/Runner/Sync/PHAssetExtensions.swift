import Photos

extension PHAsset {

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
    
    return bestResource ?? resources.first
  }
  
  private func getPriority(for resource: PHAssetResource) -> Int {
    if (mediaType == .image && resource.type == .photo) ||
       (mediaType == .video && resource.type == .video) {
      return 0
    }
    
    if mediaType == .image && resource.type == .alternatePhoto {
      return 1
    }
    
    if (mediaType == .image && resource.type == .fullSizePhoto) ||
        (mediaType == .video && resource.type == .fullSizeVideo) {
      return 2
    }
    
    if resource.isCurrent {
      return 3
    }
    
    if resource.isMediaResource {
      return 4
    }
    
    return 5
  }
}
