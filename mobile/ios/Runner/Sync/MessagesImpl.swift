import Photos
import CryptoKit
import UniformTypeIdentifiers

struct AssetWrapper: Hashable, Equatable {
  let asset: PlatformAsset

  init(with asset: PlatformAsset) {
    self.asset = asset
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(self.asset.id)
  }

  static func == (lhs: AssetWrapper, rhs: AssetWrapper) -> Bool {
    return lhs.asset.id == rhs.asset.id
  }
}

class NativeSyncApiImpl: ImmichPlugin, NativeSyncApi, FlutterPlugin {
  static let name = "NativeSyncApi"
  
  static func register(with registrar: any FlutterPluginRegistrar) {
    let instance = NativeSyncApiImpl()
    NativeSyncApiSetup.setUp(binaryMessenger: registrar.messenger(), api: instance)
    registrar.publish(instance)
  }
  
  func detachFromEngine(for registrar: any FlutterPluginRegistrar) {
    super.detachFromEngine()
  }
  
  private let defaults: UserDefaults
  private let changeTokenKey = "immich:changeToken"
  private let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]
  private let recoveredAlbumSubType = 1000000219
  
  private var hashTask: Task<Void?, Error>?
  private static let hashCancelledCode = "HASH_CANCELLED"
  private static let hashCancelled = Result<[HashResult], Error>.failure(PigeonError(code: hashCancelledCode, message: "Hashing cancelled", details: nil))
  
  private var syncTask: Task<Void?, Error>?
  private static let syncCancelledCode = "SYNC_CANCELLED"
  private static let syncCancelled = PigeonError(code: syncCancelledCode, message: "Sync cancelled", details: nil)
  
  init(with defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }
  
  @available(iOS 16, *)
  private func getChangeToken() -> PHPersistentChangeToken? {
    guard let data = defaults.data(forKey: changeTokenKey) else {
      return nil
    }
    return try? NSKeyedUnarchiver.unarchivedObject(ofClass: PHPersistentChangeToken.self, from: data)
  }
  
  @available(iOS 16, *)
  private func saveChangeToken(token: PHPersistentChangeToken) -> Void {
    guard let data = try? NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true) else {
      return
    }
    defaults.set(data, forKey: changeTokenKey)
  }
  
  func clearSyncCheckpoint() -> Void {
    defaults.removeObject(forKey: changeTokenKey)
  }
  
  func checkpointSync() {
    guard #available(iOS 16, *) else {
      return
    }
    saveChangeToken(token: PHPhotoLibrary.shared().currentChangeToken)
  }
  
  func shouldFullSync(completion: @escaping (Result<Bool, Error>) -> Void) {
    runSync(completion) { $0.shouldFullSync() }
  }
  
  private func shouldFullSync() -> Bool {
    guard #available(iOS 16, *),
          PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized,
          let storedToken = getChangeToken() else {
      // When we do not have access to photo library, older iOS version or No token available, fallback to full sync
      return true
    }
    
    guard let _ = try? PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken) else {
      // Cannot fetch persistent changes
      return true
    }
    
    return false
  }
  
  func getAlbums(completion: @escaping (Result<[PlatformAlbum], Error>) -> Void) {
    runSync(completion) { try $0.getAlbums() }
  }
  
  private func getAlbums() throws -> [PlatformAlbum] {
    var albums: [PlatformAlbum] = []
    
    for type in albumTypes {
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      for i in 0..<collections.count {
        try Task.checkCancellation()
        let album = collections.object(at: i)
        
        // Ignore recovered album
        if(album.assetCollectionSubtype.rawValue == self.recoveredAlbumSubType) {
          continue;
        }
        
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "modificationDate", ascending: false)]
        options.includeHiddenAssets = false

        let assets = getAssetsFromAlbum(in: album, options: options)
        
        let isCloud = album.assetCollectionSubtype == .albumCloudShared || album.assetCollectionSubtype == .albumMyPhotoStream
        
        var domainAlbum = PlatformAlbum(
          id: album.localIdentifier,
          name: album.localizedTitle ?? album.localIdentifier,
          updatedAt: nil,
          isCloud: isCloud,
          assetCount: Int64(assets.count)
        )
        
        if let firstAsset = assets.firstObject {
          domainAlbum.updatedAt = firstAsset.modificationDate.map { Int64($0.timeIntervalSince1970) }
        }
        
        albums.append(domainAlbum)
      }
    }
    return albums.sorted { $0.id < $1.id }
  }
  
  func getMediaChanges(completion: @escaping (Result<SyncDelta, Error>) -> Void) {
    runSync(completion) { try $0.getMediaChanges() }
  }
  
  private func getMediaChanges() throws -> SyncDelta {
    guard #available(iOS 16, *) else {
      throw PigeonError(code: "UNSUPPORTED_OS", message: "This feature requires iOS 16 or later.", details: nil)
    }
    
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      throw PigeonError(code: "NO_AUTH", message: "No photo library access", details: nil)
    }
    
    guard let storedToken = getChangeToken() else {
      // No token exists, definitely need a full sync
      print("MediaManager::getMediaChanges: No token found")
      throw PigeonError(code: "NO_TOKEN", message: "No stored change token", details: nil)
    }
    
    let currentToken = PHPhotoLibrary.shared().currentChangeToken
    if storedToken == currentToken {
      return SyncDelta(hasChanges: false, updates: [], deletes: [], assetAlbums: [:])
    }
    
    let changes = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
    
    var updatedAssets: Set<AssetWrapper> = []
    var deletedAssets: Set<String> = []
    
    for change in changes {
      try Task.checkCancellation()
      guard let details = try? change.changeDetails(for: PHObjectType.asset) else { continue }
      
      let updated = details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers)
      deletedAssets.formUnion(details.deletedLocalIdentifiers)
      
      if (updated.isEmpty) { continue }

      let options = PHFetchOptions()
      options.includeHiddenAssets = false
      options.includeAllBurstAssets = true
      let result = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: options)
      for i in 0..<result.count {
        let asset = result.object(at: i)

        // Asset wrapper only uses the id for comparison. Multiple change can contain the same asset, skip duplicate changes
        let predicate = PlatformAsset(
          id: asset.localIdentifier,
          name: "",
          type: 0,
          durationMs: 0,
          orientation: 0,
          isFavorite: false,
          playbackStyle: .unknown,
          isBurstRepresentative: false
        )
        if (updatedAssets.contains(AssetWrapper(with: predicate))) {
          continue
        }

        let domainAsset = AssetWrapper(with: asset.toPlatformAsset())
        updatedAssets.insert(domainAsset)

        // iOS reports only the representative in change details, so a delta sync
        // would otherwise miss the other frames. Pull the full burst group
        // explicitly and add each member (deduped by the wrapper's id).
        if let burstId = asset.burstIdentifier {
          let burstOptions = PHFetchOptions()
          burstOptions.includeHiddenAssets = false
          burstOptions.includeAllBurstAssets = true
          let members = PHAsset.fetchAssets(withBurstIdentifier: burstId, options: burstOptions)
          members.enumerateObjects { (member, _, _) in
            updatedAssets.insert(AssetWrapper(with: member.toPlatformAsset()))
          }
        }
      }
    }
    
    let updates = Array(updatedAssets.map { $0.asset })
    return SyncDelta(hasChanges: true, updates: updates, deletes: Array(deletedAssets), assetAlbums: buildAssetAlbumsMap(assets: updates))
  }
  
  private func buildAssetAlbumsMap(assets: Array<PlatformAsset>) -> [String: [String]] {
    guard !assets.isEmpty else {
      return [:]
    }
    
    var albumAssets: [String: [String]] = [:]
    
    for type in albumTypes {
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      collections.enumerateObjects { (album, _, _) in
        let options = PHFetchOptions()
        options.predicate = NSPredicate(format: "localIdentifier IN %@", assets.map(\.id))
        options.includeHiddenAssets = false
        let result = self.getAssetsFromAlbum(in: album, options: options)
        result.enumerateObjects { (asset, _, _) in
          albumAssets[asset.localIdentifier, default: []].append(album.localIdentifier)
        }
      }
    }
    return albumAssets
  }
  
  func getAssetIdsForAlbum(albumId: String, completion: @escaping (Result<[String], Error>) -> Void) {
    runSync(completion) { try $0.getAssetIdsForAlbum(albumId: albumId) }
  }
  
  private func getAssetIdsForAlbum(albumId: String) throws -> [String] {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return []
    }
    
    var ids: [String] = []
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    let assets = getAssetsFromAlbum(in: album, options: options)
    assets.enumerateObjects { (asset, _, stop) in
      if Task.isCancelled {
        stop.pointee = true
        return 
      }
      ids.append(asset.localIdentifier)
    }
    try Task.checkCancellation()
    return ids
  }
  
  func getAssetsCountSince(albumId: String, timestamp: Int64) throws -> Int64 {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return 0
    }
    
    let date = NSDate(timeIntervalSince1970: TimeInterval(timestamp))
    let options = PHFetchOptions()
    options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    options.includeHiddenAssets = false
    let assets = getAssetsFromAlbum(in: album, options: options)
    return Int64(assets.count)
  }
  
  func getAssetsForAlbum(albumId: String, updatedTimeCond: Int64?, completion: @escaping (Result<[PlatformAsset], Error>) -> Void) {
    runSync(completion) { try $0.getAssetsForAlbum(albumId: albumId, updatedTimeCond: updatedTimeCond) }
  }
  
  private func getAssetsForAlbum(albumId: String, updatedTimeCond: Int64?) throws -> [PlatformAsset] {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return []
    }
    
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    if(updatedTimeCond != nil) {
      let date = NSDate(timeIntervalSince1970: TimeInterval(updatedTimeCond!))
      options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    }
    
    let result = getAssetsFromAlbum(in: album, options: options)
    if(result.count == 0) {
      return []
    }
    
    var assets: [PlatformAsset] = []
    result.enumerateObjects { (asset, _, stop) in
      if Task.isCancelled {
        stop.pointee = true
        return 
      }
      assets.append(asset.toPlatformAsset())
    }
    try Task.checkCancellation()
    return assets
  }
  
  func hashAssets(assetIds: [String], allowNetworkAccess: Bool, completion: @escaping (Result<[HashResult], Error>) -> Void) {
    if let prevTask = hashTask {
      prevTask.cancel()
      hashTask = nil
    }
    hashTask = Task { [weak self] in
      var missingAssetIds = Set(assetIds)
      var assets = [PHAsset]()
      assets.reserveCapacity(assetIds.count)
      // includeAllBurstAssets: a non-representative burst member is invisible to a
      // default fetch-by-id, so without this it'd be reported "not found" and never
      // hashed — leaving it out of the backup candidate set permanently.
      let hashFetchOptions = PHFetchOptions()
      hashFetchOptions.includeAllBurstAssets = true
      PHAsset.fetchAssets(withLocalIdentifiers: assetIds, options: hashFetchOptions).enumerateObjects { (asset, _, stop) in
        if Task.isCancelled {
          stop.pointee = true
          return
        }
        missingAssetIds.remove(asset.localIdentifier)
        assets.append(asset)
      }
      
      if Task.isCancelled {
        return self?.completeWhenActive(for: completion, with: Self.hashCancelled)
      }
      
      await withTaskGroup(of: HashResult?.self) { taskGroup in
        var results = [HashResult]()
        results.reserveCapacity(assets.count)
        for asset in assets {
          if Task.isCancelled {
            return self?.completeWhenActive(for: completion, with: Self.hashCancelled)
          }
          taskGroup.addTask {
            guard let self = self else { return nil }
            return await self.hashAsset(asset, allowNetworkAccess: allowNetworkAccess)
          }
        }
        
        for await result in taskGroup {
          guard let result = result else {
            return self?.completeWhenActive(for: completion, with: Self.hashCancelled)
          }
          results.append(result)
        }
        
        for missing in missingAssetIds {
          results.append(HashResult(assetId: missing, error: "Asset not found in library", hash: nil))
        }
        
        return self?.completeWhenActive(for: completion, with: .success(results))
      }
    }
  }
  
  func cancelHashing() {
    hashTask?.cancel()
    hashTask = nil
  }
  
  func cancelSync() {
    syncTask?.cancel()
    syncTask = nil
  }
  
  private func runSync<T>(
    _ completion: @escaping (Result<T, Error>) -> Void,
    _ work: @escaping (NativeSyncApiImpl) throws -> T
  ) {
    syncTask?.cancel()
    syncTask = Task { [weak self] in
      guard let self else { return nil }
      let result: Result<T, Error>
      do {
        result = .success(try work(self))
      } catch is CancellationError {
        result = .failure(Self.syncCancelled)
      } catch {
        result = .failure(error)
      }
      self.completeWhenActive(for: completion, with: result)
      return nil
    }
  }
  
  private func hashAsset(_ asset: PHAsset, allowNetworkAccess: Bool) async -> HashResult? {
    class RequestRef {
      var id: PHAssetResourceDataRequestID?
    }
    let requestRef = RequestRef()
    return await withTaskCancellationHandler(operation: {
      if Task.isCancelled {
        return nil
      }
      
      guard let resource = asset.getResource() else {
        return HashResult(assetId: asset.localIdentifier, error: "Cannot get asset resource", hash: nil)
      }
      
      if Task.isCancelled {
        return nil
      }
      
      let options = PHAssetResourceRequestOptions()
      options.isNetworkAccessAllowed = allowNetworkAccess
      
      return await withCheckedContinuation { continuation in
        var hasher = Insecure.SHA1()
        
        requestRef.id = PHAssetResourceManager.default().requestData(
          for: resource,
          options: options,
          dataReceivedHandler: { data in
            hasher.update(data: data)
          },
          completionHandler: { error in
            let result: HashResult? = switch (error) {
            case let e as PHPhotosError where e.code == .userCancelled: nil
            case let .some(e): HashResult(
              assetId: asset.localIdentifier,
              error: "Failed to hash asset: \(e.localizedDescription)",
              hash: nil
            )
            case .none:
              HashResult(
                assetId: asset.localIdentifier,
                error: nil,
                hash: Data(hasher.finalize()).base64EncodedString()
              )
            }
            continuation.resume(returning: result)
          }
        )
      }
    }, onCancel: {
      guard let requestId = requestRef.id else { return }
      PHAssetResourceManager.default().cancelDataRequest(requestId)
    })
  }
  
  func getTrashedAssets() throws -> [String: [PlatformAsset]] {
    throw PigeonError(code: "UNSUPPORTED_OS", message: "This feature not supported on iOS.", details: nil)
  }

  func restoreFromTrashById(mediaId: String, type: Int64, completion: @escaping (Result<Bool, Error>) -> Void) {
    completion(.success(false))
  }
  
  private func getAssetsFromAlbum(in album: PHAssetCollection, options: PHFetchOptions) -> PHFetchResult<PHAsset> {
    // Surface every burst member, not just the auto-picked representative. Set in
    // the shared fetch helper so album asset counts and the asset lists stay
    // consistent — LocalSyncService compares assetCount against the synced set, so
    // a count that excludes burst members while the list includes them wedges sync.
    options.includeAllBurstAssets = true
    // Ensure to actually getting all assets for the Recents album
    if (album.assetCollectionSubtype == .smartAlbumUserLibrary) {
      return PHAsset.fetchAssets(with: options)
    } else {
      return PHAsset.fetchAssets(in: album, options: options)
    }
  }
  
  func getCloudIdForAssetIds(assetIds: [String]) throws -> [CloudIdResult] {
    guard #available(iOS 16, *) else {
      return assetIds.map { CloudIdResult(assetId: $0) }
    }
    
    var mappings: [CloudIdResult] = []
    let result = PHPhotoLibrary.shared().cloudIdentifierMappings(forLocalIdentifiers: assetIds)
    for (key, value) in result {
      switch value {
      case .success(let cloudIdentifier):
        let cloudId = cloudIdentifier.stringValue
        // Ignores invalid cloud ids of the format "GUID:ID:". Valid Ids are of the form "GUID:ID:HASH"
        if !cloudId.hasSuffix(":") {
          mappings.append(CloudIdResult(assetId: key, cloudId: cloudId))
        } else {
          mappings.append(CloudIdResult(assetId: key, error: "Incomplete Cloud Id: \(cloudId)"))
        }
      case .failure(let error):
        mappings.append(CloudIdResult(assetId: key, error: "Error getting Cloud Id: \(error.localizedDescription)"))
      }
    }
    return mappings;
  }

  // Streams the asset's current rendition — the same resource hashAssets hashes
  // (getResource(): the isCurrent rendition, the lone .photo otherwise). Used for
  // iOS burst members, which photo_manager can't resolve by id; streaming the same
  // bytes the hash measured keeps the server checksum aligned with the local one
  // (else the asset shows cloud-only). includeAllBurstAssets so a non-rep resolves.
  func getCurrentResource(
    assetId: String,
    allowNetworkAccess: Bool,
    completion: @escaping (Result<BaseResource?, Error>) -> Void
  ) {
    Task { [weak self] in
      guard let self = self else { return }
      let options = PHFetchOptions()
      options.includeAllBurstAssets = true
      guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: options).firstObject,
        let resource = asset.getResource()
      else {
        return self.completeWhenActive(for: completion, with: .success(nil))
      }
      do {
        let result = try await self.streamBaseResource(
          resource: resource,
          localId: assetId,
          allowNetworkAccess: allowNetworkAccess
        )
        self.completeWhenActive(for: completion, with: .success(result))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  func getBaseResource(
    assetId: String,
    allowNetworkAccess: Bool,
    completion: @escaping (Result<BaseResource?, Error>) -> Void
  ) {
    Task { [weak self] in
      guard let self = self else { return }

      do {
        guard let originals = try await Self.originalsForEditedAsset(assetId, allowNetworkAccess: allowNetworkAccess)
        else {
          return self.completeWhenActive(for: completion, with: .success(nil))
        }
        let result = try await self.streamBaseResource(
          resource: originals.still,
          localId: assetId,
          allowNetworkAccess: allowNetworkAccess
        )
        self.completeWhenActive(for: completion, with: .success(result))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  // Reads both readable originals of an edited live photo (still + paired video) so the
  // backup can upload the unedited pair and stack the edit onto it. Same edited-only gate
  // as getBaseResource. video is nil when the asset has no paired video left to recover
  // (e.g. the edit turned Live off); the still temp is removed if the video read fails.
  func getBaseLivePhoto(
    assetId: String,
    allowNetworkAccess: Bool,
    completion: @escaping (Result<BaseLivePhoto?, Error>) -> Void
  ) {
    Task { [weak self] in
      guard let self = self else { return }

      do {
        guard let originals = try await Self.originalsForEditedAsset(assetId, allowNetworkAccess: allowNetworkAccess)
        else {
          return self.completeWhenActive(for: completion, with: .success(nil))
        }
        let still = try await self.streamBaseResource(
          resource: originals.still,
          localId: assetId,
          allowNetworkAccess: allowNetworkAccess
        )
        var video: BaseResource? = nil
        if let videoRes = originals.video {
          do {
            video = try await self.streamBaseResource(
              resource: videoRes,
              localId: assetId,
              allowNetworkAccess: allowNetworkAccess
            )
          } catch {
            try? FileManager.default.removeItem(atPath: still.path)
            throw error
          }
        }
        self.completeWhenActive(for: completion, with: .success(BaseLivePhoto(still: still, video: video)))
      } catch {
        self.completeWhenActive(for: completion, with: .failure(error))
      }
    }
  }

  // Returns whether the asset carries a live Photos edit without reading the photo
  // itself, only the small adjustment metadata. The revert probe relies on this to
  // tell "not edited" apart from "couldn't read" (offloaded to iCloud), so it never
  // mistakes an unreadable edit for a revert.
  func getEditState(
    assetId: String,
    allowNetworkAccess: Bool,
    completion: @escaping (Result<EditState, Error>) -> Void
  ) {
    Task { [weak self] in
      guard let self = self else { return }
      guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil).firstObject else {
        // Not in the library, so don't answer "not edited" (the caller acts on that).
        return self.completeWhenActive(for: completion, with: .success(.unknown))
      }
      let state = await Self.classifyEdit(
        resources: PHAssetResource.assetResources(for: asset),
        allowNetworkAccess: allowNetworkAccess
      )
      self.completeWhenActive(for: completion, with: .success(state))
    }
  }

  // adjustmentRenderTypes for a photo with no real edit: a plain capture, a
  // Photographic Style, or a reverted edit. A real edit changes this value.
  private static let kNoEditRenderTypes = 27648

  // Idle deadline for the base-resource reads: cancel only after this long with no
  // data received, so a stalled iCloud fetch can't hang the backup forever but a
  // big original on a slow link keeps downloading as long as chunks flow.
  private static let kBaseReadTimeoutSeconds: Double = 120

  private final class ResourceRequestRef {
    var id: PHAssetResourceDataRequestID?
    // Written from the resource callback queue, read from the deadline timer;
    // unsynchronized on purpose — the read below clamps, so the worst case is
    // the timer re-arming one extra round.
    var lastActivity = DispatchTime.now()
  }

  // Re-arming watchdog: fires after `delay`, cancels if nothing arrived for a full
  // timeout window, otherwise re-arms for the remainder of the window.
  private static func armIdleDeadline(_ ref: ResourceRequestRef, after delay: Double = kBaseReadTimeoutSeconds) {
    DispatchQueue.global().asyncAfter(deadline: .now() + delay) {
      guard let id = ref.id else { return }
      let nowNs = DispatchTime.now().uptimeNanoseconds
      let lastNs = ref.lastActivity.uptimeNanoseconds
      // lastActivity can race ahead of the captured now; treat that as activity.
      let idle = nowNs > lastNs ? Double(nowNs - lastNs) / 1_000_000_000 : 0
      if idle >= kBaseReadTimeoutSeconds {
        PHAssetResourceManager.default().cancelDataRequest(id)
      } else {
        armIdleDeadline(ref, after: kBaseReadTimeoutSeconds - idle)
      }
    }
  }

  // Shared gate for the base readers: fetch the asset, classify the edit from its
  // adjustment metadata, and pick the original resources. nil = positively nothing
  // to recover (missing asset, not edited, or no readable original still). An
  // unreadable plist throws instead — that's "can't tell right now", and Dart
  // defers the asset rather than uploading the edit standalone for good.
  private static func originalsForEditedAsset(
    _ assetId: String,
    allowNetworkAccess: Bool
  ) async throws -> (still: PHAssetResource, video: PHAssetResource?)? {
    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil).firstObject else {
      return nil
    }
    let resources = PHAssetResource.assetResources(for: asset)
    let state = await classifyEdit(resources: resources, allowNetworkAccess: allowNetworkAccess)
    if state == .unknown {
      throw PigeonError(
        code: "unknownEditState",
        message: "Could not read adjustment metadata for \(assetId)",
        details: nil
      )
    }
    guard state == .edited, let still = originalStillResource(resources) else {
      return nil
    }
    return (still, originalPairedVideoResource(resources))
  }

  // Works out the edit state from Adjustments.plist only (never reads the photo).
  // adjustmentRenderTypes is the signal: a real edit moves it off the baseline, while a
  // plain capture, a Photographic Style, and a reverted edit all sit at the baseline. The
  // editor id is NOT reliable: com.apple.camera authors both styles and some real edits
  // (e.g. changing the Photographic Style after capture), so we key off the render types
  // alone. Cleanup and object-removal write AdjustmentsSecondary.data, which we count as
  // edited. unknown = couldn't read the plist (offloaded, no network).
  private static func classifyEdit(resources: [PHAssetResource], allowNetworkAccess: Bool) async -> EditState {
    if resources.contains(where: { $0.originalFilename == "AdjustmentsSecondary.data" }) {
      return .edited
    }
    guard let adjRes = resources.first(where: { $0.originalFilename == "Adjustments.plist" }) else {
      return .notEdited
    }
    guard let buf = await collectResourceData(adjRes, allowNetworkAccess: allowNetworkAccess),
      let plist = try? PropertyListSerialization.propertyList(from: buf, options: [], format: nil) as? [String: Any]
    else {
      return .unknown
    }
    let renderTypes = (plist["adjustmentRenderTypes"] as? NSNumber)?.intValue
    let isUserEdit = renderTypes != nil && renderTypes != kNoEditRenderTypes
    return isUserEdit ? .edited : .notEdited
  }

  // The unedited original still, told apart from the edited "current" render by isCurrent.
  // Prefer the non-current .photo; fall back to the .adjustmentBasePhoto flavor some
  // creation-API / third-party-editor layouts use for the unaltered source (their .photo
  // IS the edited render, so this must come before the bare .photo net); last, a lone
  // .photo for single-resource assets or a failed isCurrent read.
  private static func originalStillResource(_ resources: [PHAssetResource]) -> PHAssetResource? {
    return resources.first(where: { $0.type == .photo && !$0.isCurrent })
      ?? resources.first(where: { $0.type == .adjustmentBasePhoto })
      ?? resources.first(where: { $0.type == .photo })
  }

  // The unedited original paired video, same isCurrent / adjustment-base ordering as the
  // still. nil when the asset carries no paired video (not live, or Live turned off).
  private static func originalPairedVideoResource(_ resources: [PHAssetResource]) -> PHAssetResource? {
    return resources.first(where: { $0.type == .pairedVideo && !$0.isCurrent })
      ?? resources.first(where: { $0.type == .adjustmentBasePairedVideo })
      ?? resources.first(where: { $0.type == .pairedVideo })
  }

  private func streamBaseResource(
    resource: PHAssetResource,
    localId: String,
    allowNetworkAccess: Bool
  ) async throws -> BaseResource {
    let safeId = localId.replacingOccurrences(of: "/", with: "_")
    let suffix = UTType(resource.uniformTypeIdentifier)?.preferredFilenameExtension ?? "bin"
    // Library/Caches, not tmp: the chain can span launches and clearCache wipes
    // tmp at the start of every upload run. Swept by clearEditBaseCache instead.
    let cacheRoot =
      FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
      ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
    let tempDir = cacheRoot.appendingPathComponent("immich_base", isDirectory: true)
    try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)

    let unique = UUID().uuidString.prefix(8)
    let tempUrl = tempDir.appendingPathComponent("\(safeId)_\(unique)_base.\(suffix)")

    // Write the resource to disk and hash it chunk by chunk, so a big original (e.g.
    // ProRAW) never sits fully in memory on the upload thread.
    FileManager.default.createFile(atPath: tempUrl.path, contents: nil)
    guard let handle = try? FileHandle(forWritingTo: tempUrl) else {
      try? FileManager.default.removeItem(at: tempUrl)
      throw PigeonError(
        code: "baseResourceWriteFailed",
        message: "Failed to open temp file for base resource \(localId)",
        details: nil
      )
    }

    var hasher = Insecure.SHA1()
    let options = PHAssetResourceRequestOptions()
    options.isNetworkAccessAllowed = allowNetworkAccess

    // Deadline + cancellation so a stalled iCloud read can't hang the backup forever;
    // a write failure also cancels right away instead of draining the download for nothing.
    let requestRef = ResourceRequestRef()
    let succeeded = await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
      var writeFailed = false
      requestRef.id = PHAssetResourceManager.default().requestData(
        for: resource,
        options: options,
        dataReceivedHandler: { chunk in
          requestRef.lastActivity = DispatchTime.now()
          if writeFailed { return }
          do {
            try handle.write(contentsOf: chunk)
            hasher.update(data: chunk)
          } catch {
            writeFailed = true
            if let id = requestRef.id {
              PHAssetResourceManager.default().cancelDataRequest(id)
            }
          }
        },
        completionHandler: { error in
          requestRef.id = nil
          continuation.resume(returning: error == nil && !writeFailed)
        }
      )
      Self.armIdleDeadline(requestRef)
    }

    try? handle.close()

    guard succeeded else {
      try? FileManager.default.removeItem(at: tempUrl)
      throw PigeonError(
        code: "baseResourceReadFailed",
        message: "Failed to read base resource for \(localId)",
        details: nil
      )
    }

    let sha1 = Data(hasher.finalize()).base64EncodedString()
    return BaseResource(path: tempUrl.path, sha1: sha1)
  }

  private static func collectResourceData(
    _ resource: PHAssetResource,
    allowNetworkAccess: Bool
  ) async -> Data? {
    let options = PHAssetResourceRequestOptions()
    options.isNetworkAccessAllowed = allowNetworkAccess
    var buffer = Data()
    let requestRef = ResourceRequestRef()
    return await withCheckedContinuation { (continuation: CheckedContinuation<Data?, Never>) in
      requestRef.id = PHAssetResourceManager.default().requestData(
        for: resource,
        options: options,
        dataReceivedHandler: { data in
          requestRef.lastActivity = DispatchTime.now()
          buffer.append(data)
        },
        completionHandler: { error in
          requestRef.id = nil
          continuation.resume(returning: error == nil ? buffer : nil)
        }
      )
      armIdleDeadline(requestRef)
    }
  }

}
