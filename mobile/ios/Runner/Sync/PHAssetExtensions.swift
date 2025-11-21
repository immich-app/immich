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
  
  func getLivePhotoResource() -> PHAssetResource? {
    let resources = PHAssetResource.assetResources(for: self)
    
    var livePhotoResource: PHAssetResource?
    for resource in resources {
      if resource.type == .fullSizePairedVideo {
        return resource
      }
      
      if resource.type == .pairedVideo {
        livePhotoResource = resource
      }
    }

    return livePhotoResource
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

extension PHAssetCollection {
  private static let latestAssetOptions: PHFetchOptions = {
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    options.sortDescriptors = [NSSortDescriptor(key: "modificationDate", ascending: false)]
    options.fetchLimit = 1
    return options
  }()

  var isCloud: Bool { assetCollectionSubtype == .albumCloudShared || assetCollectionSubtype == .albumMyPhotoStream }

  var updatedAt: Date? {
    let result: PHFetchResult<PHAsset>
    if assetCollectionSubtype == .smartAlbumUserLibrary {
      result = PHAsset.fetchAssets(with: Self.latestAssetOptions)
    } else {
      result = PHAsset.fetchAssets(in: self, options: Self.latestAssetOptions)
    }

    return result.firstObject?.modificationDate
  }

  static func fetchAssetCollection(albumId: String, options: PHFetchOptions? = nil) -> PHAssetCollection? {
    let albums = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: options)
    return albums.firstObject
  }

  static func fetchAssets(in album: PHAssetCollection, options: PHFetchOptions) -> PHFetchResult<PHAsset> {
    album.assetCollectionSubtype == .smartAlbumUserLibrary
      ? PHAsset.fetchAssets(with: options)
      : PHAsset.fetchAssets(in: album, options: options)
  }
}
