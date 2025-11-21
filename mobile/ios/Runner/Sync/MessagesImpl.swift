import Algorithms
import CryptoKit
import Foundation
import Photos
import SQLiteData
import os.log

extension Notification.Name {
  static let localSyncDidComplete = Notification.Name("localSyncDidComplete")
}

enum LocalSyncError: Error {
  case photoAccessDenied, assetUpsertFailed, noChangeToken, unsupportedOS
  case unsupportedAssetType(Int)
}

enum SyncConfig {
  static let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]
  static let batchSize: Int = 5000
  static let changeTokenKey = "immich:changeToken"
  static let recoveredAlbumSubType = 1_000_000_219
  static let sortDescriptors = [NSSortDescriptor(key: "localIdentifier", ascending: true)]
}

class LocalSyncService {
  private static let dateFormatter = ISO8601DateFormatter()

  private let defaults: UserDefaults
  private let db: DatabasePool
  private let photoLibrary: PhotoLibraryProvider
  private let logger = Logger(subsystem: "com.immich.mobile", category: "LocalSync")

  init(db: DatabasePool, photoLibrary: PhotoLibraryProvider, with defaults: UserDefaults = .standard) {
    self.defaults = defaults
    self.db = db
    self.photoLibrary = photoLibrary
  }

  @available(iOS 16, *)
  private func getChangeToken() -> PHPersistentChangeToken? {
    defaults.data(forKey: SyncConfig.changeTokenKey)
      .flatMap { try? NSKeyedUnarchiver.unarchivedObject(ofClass: PHPersistentChangeToken.self, from: $0) }
  }

  @available(iOS 16, *)
  private func saveChangeToken(token: PHPersistentChangeToken) {
    guard let data = try? NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true) else {
      return
    }
    defaults.set(data, forKey: SyncConfig.changeTokenKey)
  }

  func clearSyncCheckpoint() {
    defaults.removeObject(forKey: SyncConfig.changeTokenKey)
  }

  func checkpointSync() {
    guard #available(iOS 16, *) else { return }
    saveChangeToken(token: photoLibrary.currentChangeToken)
  }

  func sync(full: Bool = false) async throws {
    let start = Date()
    defer { logger.info("Sync completed in \(Int(Date().timeIntervalSince(start) * 1000))ms") }

    guard !full, !shouldFullSync(), let delta = try? getMediaChanges(), delta.hasChanges
    else {
      logger.debug("Full sync: \(full ? "user requested" : "required")")
      return try await fullSync()
    }

    logger.debug("Delta sync: +\(delta.updates.count) -\(delta.deletes.count)")

    let albumFetchOptions = PHFetchOptions()
    albumFetchOptions.predicate = NSPredicate(format: "assetCollectionSubtype != %d", SyncConfig.recoveredAlbumSubType)

    try await db.write { conn in
      try #sql("pragma temp_store = 2").execute(conn)
      try #sql("create temp table current_albums(id text primary key) without rowid").execute(conn)

      var cloudAlbums = [PHAssetCollection]()
      for type in SyncConfig.albumTypes {
        photoLibrary.fetchAlbums(with: type, subtype: .any, options: albumFetchOptions)
          .enumerateObjects { album, _, _ in
            try? CurrentAlbum.insert { CurrentAlbum(id: album.localIdentifier) }.execute(conn)
            try? upsertAlbum(album, conn: conn)
            if album.isCloud {
              cloudAlbums.append(album)
            }
          }
      }

      try LocalAlbum.delete().where { localAlbum in
        localAlbum.backupSelection.eq(BackupSelection.none) && !CurrentAlbum.where { $0.id == localAlbum.id }.exists()
      }.execute(conn)

      for asset in delta.updates {
        try upsertAsset(asset, conn: conn)
      }

      if !delta.deletes.isEmpty {
        try LocalAsset.delete().where { $0.id.in(delta.deletes) }.execute(conn)
      }

      try self.updateAssetAlbumLinks(delta.assetAlbums, conn: conn)
    }

    // On iOS, we need to full sync albums that are marked as cloud as the delta sync
    // does not include changes for cloud albums. If ignoreIcloudAssets is enabled,
    // remove the albums from the local database from the previous sync
    if !cloudAlbums.isEmpty {
      try await syncCloudAlbums(cloudAlbums)
    }

    checkpointSync()
  }

  private func fullSync() async throws {
    let start = Date()
    defer { logger.info("Full sync completed in \(Int(Date().timeIntervalSince(start) * 1000))ms") }

    let dbAlbumIds = try await db.read { conn in
      try LocalAlbum.all.select(\.id).order { $0.id }.fetchAll(conn)
    }

    let albumFetchOptions = PHFetchOptions()
    albumFetchOptions.predicate = NSPredicate(format: "assetCollectionSubtype != %d", SyncConfig.recoveredAlbumSubType)
    albumFetchOptions.sortDescriptors = SyncConfig.sortDescriptors

    let albums = photoLibrary.fetchAlbums(with: .album, subtype: .any, options: albumFetchOptions)
    let smartAlbums = photoLibrary.fetchAlbums(with: .smartAlbum, subtype: .any, options: albumFetchOptions)

    try await withThrowingTaskGroup(of: Void.self) { group in
      var dbIndex = 0
      var albumIndex = 0
      var smartAlbumIndex = 0

      // Three-pointer merge: dbAlbumIds, albums, smartAlbums
      while albumIndex < albums.count || smartAlbumIndex < smartAlbums.count {
        let currentAlbum = albumIndex < albums.count ? albums.object(at: albumIndex) : nil
        let currentSmartAlbum = smartAlbumIndex < smartAlbums.count ? smartAlbums.object(at: smartAlbumIndex) : nil

        let useRegular =
          currentSmartAlbum == nil
          || (currentAlbum != nil && currentAlbum!.localIdentifier < currentSmartAlbum!.localIdentifier)

        let nextAlbum = useRegular ? currentAlbum! : currentSmartAlbum!
        let deviceId = nextAlbum.localIdentifier

        while dbIndex < dbAlbumIds.count && dbAlbumIds[dbIndex] < deviceId {
          let albumToRemove = dbAlbumIds[dbIndex]
          group.addTask { try await self.removeAlbum(albumId: albumToRemove) }
          dbIndex += 1
        }

        if dbIndex < dbAlbumIds.count && dbAlbumIds[dbIndex] == deviceId {
          group.addTask { try await self.syncAlbum(albumId: deviceId, deviceAlbum: nextAlbum) }
          dbIndex += 1
        } else {
          group.addTask { try await self.addAlbum(nextAlbum) }
        }

        if useRegular {
          albumIndex += 1
        } else {
          smartAlbumIndex += 1
        }
      }

      // Remove any remaining DB albums
      while dbIndex < dbAlbumIds.count {
        let albumToRemove = dbAlbumIds[dbIndex]
        group.addTask { try await self.removeAlbum(albumId: albumToRemove) }
        dbIndex += 1
      }

      try await group.waitForAll()
    }

    checkpointSync()
  }

  private func shouldFullSync() -> Bool {
    guard #available(iOS 16, *), photoLibrary.isAuthorized, let token = getChangeToken(),
      (try? photoLibrary.fetchPersistentChanges(since: token)) != nil
    else {
      return true
    }
    return false
  }

  private func addAlbum(_ album: PHAssetCollection) async throws {
    let options = PHFetchOptions()
    options.includeHiddenAssets = false

    if let timestamp = album.updatedAt {
      let date = timestamp as NSDate
      options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    }

    let result = photoLibrary.fetchAssets(in: album, options: options)
    try await self.db.write { conn in
      try upsertStreamedAssets(result: result, albumId: album.localIdentifier, conn: conn)
    }
  }

  private func upsertStreamedAssets(result: PHFetchResult<PHAsset>, albumId: String, conn: Database) throws {
    result.enumerateObjects { asset, _, stop in
      do {
        try self.upsertAsset(asset, conn: conn)
        try self.linkAsset(asset.localIdentifier, toAlbum: albumId, conn: conn)
      } catch {
        stop.pointee = true
      }
    }
    if let error = conn.lastErrorMessage {
      throw LocalSyncError.assetUpsertFailed
    }
  }

  /// Remove all assets that are only in this particular album.
  /// We cannot remove all assets in the album because they might be in other albums in iOS.
  private func removeAlbum(albumId: String) async throws {
    try await db.write { conn in
      try LocalAsset.delete().where { $0.id.in(LocalAlbumAsset.uniqueAssetIds(albumId: albumId)) }.execute(conn)
      try LocalAlbum.delete()
        .where { $0.id.eq(albumId) && $0.backupSelection.eq(BackupSelection.none) }
        .execute(conn)
    }
  }

  private func syncAlbum(albumId: String, deviceAlbum: PHAssetCollection) async throws {
    let dbAlbum = try await db.read { conn in
      try LocalAlbum.all.where { $0.id.eq(albumId) }.fetchOne(conn)
    }
    guard let dbAlbum else { return try await addAlbum(deviceAlbum) }

    // Check if unchanged
    guard dbAlbum.name != deviceAlbum.localizedTitle || dbAlbum.updatedAt != deviceAlbum.updatedAt
    else { return }

    try await fullDiffAlbum(dbAlbum: dbAlbum, deviceAlbum: deviceAlbum)
  }

  private func fullDiffAlbum(dbAlbum: LocalAlbum, deviceAlbum: PHAssetCollection) async throws {
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    let date = dbAlbum.updatedAt as NSDate
    options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    options.sortDescriptors = SyncConfig.sortDescriptors

    var deviceAssetIds: [String] = []
    let result = photoLibrary.fetchAssets(in: deviceAlbum, options: options)
    result.enumerateObjects { asset, _, _ in
      deviceAssetIds.append(asset.localIdentifier)
    }

    let dbAssetIds = try await db.read { conn in
      try LocalAlbumAsset.all
        .where { $0.id.albumId.eq(dbAlbum.id) }
        .select(\.id.assetId)
        .order { $0.id.assetId }
        .fetchAll(conn)
    }

    let (toFetch, toDelete) = diffSortedArrays(dbAssetIds, deviceAssetIds)
    guard !toFetch.isEmpty || !toDelete.isEmpty else { return }

    logger.debug("Syncing \(deviceAlbum.localizedTitle ?? "album"): +\(toFetch.count) -\(toDelete.count)")

    try await db.write { conn in
      try self.updateAlbum(deviceAlbum, conn: conn)
    }

    for batch in toFetch.chunks(ofCount: SyncConfig.batchSize) {
      let options = PHFetchOptions()
      options.includeHiddenAssets = false
      let result = photoLibrary.fetchAssets(withLocalIdentifiers: Array(batch), options: options)

      try await db.write { conn in
        try upsertStreamedAssets(result: result, albumId: deviceAlbum.localIdentifier, conn: conn)
      }
    }

    guard !toDelete.isEmpty else { return }

    let uniqueAssetIds = try await db.read { conn in
      return try LocalAlbumAsset.uniqueAssetIds(albumId: deviceAlbum.localIdentifier).fetchAll(conn)
    }

    // Delete unique assets and unlink others
    var toDeleteSet = Set(toDelete)
    let uniqueIds = toDeleteSet.intersection(uniqueAssetIds)
    toDeleteSet.subtract(uniqueIds)
    let toUnlink = toDeleteSet
    guard !toDeleteSet.isEmpty || !toUnlink.isEmpty else { return }
    try await db.write { conn in
      if !uniqueIds.isEmpty {
        try LocalAsset.delete().where { $0.id.in(Array(uniqueIds)) }.execute(conn)
      }

      if !toUnlink.isEmpty {
        try LocalAlbumAsset.delete()
          .where { $0.id.assetId.in(Array(toUnlink)) && $0.id.albumId.eq(deviceAlbum.localIdentifier) }
          .execute(conn)
      }
    }
  }

  private func syncCloudAlbums(_ albums: [PHAssetCollection]) async throws {
    try await withThrowingTaskGroup(of: Void.self) { group in
      for album in albums {
        group.addTask {
          let dbAlbum = try await self.db.read { conn in
            try LocalAlbum.all.where { $0.id.eq(album.localIdentifier) }.fetchOne(conn)
          }

          guard let dbAlbum else { return }

          let deviceIds = try self.getAssetIdsForAlbum(albumId: album.localIdentifier)
          let dbIds = try await self.db.read { conn in
            try LocalAlbumAsset.all
              .where { $0.id.albumId.eq(album.localIdentifier) }
              .select(\.id.assetId)
              .order { $0.id.assetId }
              .fetchAll(conn)
          }

          guard deviceIds != dbIds else { return }
          try await self.fullDiffAlbum(dbAlbum: dbAlbum, deviceAlbum: album)
        }
      }

      try await group.waitForAll()
    }
  }

  private func upsertAlbum(_ album: PHAssetCollection, conn: Database) throws {
    try LocalAlbum.insert {
      LocalAlbum(
        id: album.localIdentifier,
        backupSelection: .none,
        linkedRemoteAlbumId: nil,
        marker_: nil,
        name: album.localizedTitle ?? "",
        isIosSharedAlbum: album.isCloud,
        updatedAt: album.updatedAt ?? Date()
      )
    } onConflict: {
      $0.id
    } doUpdate: { old, new in
      old.name = new.name
      old.updatedAt = new.updatedAt
      old.isIosSharedAlbum = new.isIosSharedAlbum
      old.marker_ = new.marker_
    }.execute(conn)
  }

  private func updateAlbum(_ album: PHAssetCollection, conn: Database) throws {
    try LocalAlbum.update { row in
      row.name = album.localizedTitle ?? ""
      row.updatedAt = album.updatedAt ?? Date()
      row.isIosSharedAlbum = album.isCloud
    }.where { $0.id.eq(album.localIdentifier) }.execute(conn)
  }

  private func upsertAsset(_ asset: PHAsset, conn: Database) throws {
    guard let assetType = AssetType(rawValue: asset.mediaType.rawValue) else {
      throw LocalSyncError.unsupportedAssetType(asset.mediaType.rawValue)
    }
    let dateStr = Self.dateFormatter.string(from: asset.creationDate ?? Date())

    try LocalAsset.insert {
      LocalAsset(
        id: asset.localIdentifier,
        checksum: nil,
        createdAt: dateStr,
        durationInSeconds: Int64(asset.duration),
        height: asset.pixelHeight,
        isFavorite: asset.isFavorite,
        name: asset.title,
        orientation: "0",
        type: assetType,
        updatedAt: dateStr,
        width: asset.pixelWidth
      )
    } onConflict: {
      $0.id
    } doUpdate: { old, new in
      old.name = new.name
      old.type = new.type
      old.updatedAt = new.updatedAt
      old.width = new.width
      old.height = new.height
      old.durationInSeconds = new.durationInSeconds
      old.isFavorite = new.isFavorite
      old.orientation = new.orientation
    }.execute(conn)
  }

  private func linkAsset(_ assetId: String, toAlbum albumId: String, conn: Database) throws {
    try LocalAlbumAsset.insert {
      LocalAlbumAsset(id: LocalAlbumAsset.ID(assetId: assetId, albumId: albumId), marker_: nil)
    } onConflict: {
      ($0.id.assetId, $0.id.albumId)
    }.execute(conn)
  }

  private func updateAssetAlbumLinks(_ assetAlbums: [String: [String]], conn: Database) throws {
    for (assetId, albumIds) in assetAlbums {
      // Delete old links not in the new set
      try LocalAlbumAsset.delete()
        .where { $0.id.assetId.eq(assetId) && !$0.id.albumId.in(albumIds) }
        .execute(conn)

      // Insert new links
      for albumId in albumIds {
        try LocalAlbumAsset.insert {
          LocalAlbumAsset(id: LocalAlbumAsset.ID(assetId: assetId, albumId: albumId), marker_: nil)
        } onConflict: {
          ($0.id.assetId, $0.id.albumId)
        }.execute(conn)
      }
    }
  }

  private func fetchAssetsByIds(_ ids: [String]) throws -> [PHAsset] {
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    let result = photoLibrary.fetchAssets(withLocalIdentifiers: ids, options: options)

    var assets: [PHAsset] = []
    assets.reserveCapacity(ids.count)
    result.enumerateObjects { asset, _, _ in assets.append(asset) }

    return assets
  }

  private func getMediaChanges() throws -> NativeSyncDelta {
    guard #available(iOS 16, *) else {
      throw LocalSyncError.unsupportedOS
    }

    guard photoLibrary.isAuthorized else {
      throw LocalSyncError.photoAccessDenied
    }

    guard let storedToken = getChangeToken() else {
      throw LocalSyncError.noChangeToken
    }

    let currentToken = photoLibrary.currentChangeToken
    guard storedToken != currentToken else {
      return NativeSyncDelta(hasChanges: false, updates: [], deletes: [], assetAlbums: [:])
    }

    let changes = try photoLibrary.fetchPersistentChanges(since: storedToken)
    var updatedIds = Set<String>()
    var deletedIds = Set<String>()

    for change in changes {
      guard let details = try? change.changeDetails(for: PHObjectType.asset) else { continue }
      updatedIds.formUnion(details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers))
      deletedIds.formUnion(details.deletedLocalIdentifiers)
    }

    guard !updatedIds.isEmpty || !deletedIds.isEmpty else {
      return NativeSyncDelta(hasChanges: false, updates: [], deletes: [], assetAlbums: [:])
    }

    let updatedIdArray = Array(updatedIds)
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    let result = photoLibrary.fetchAssets(withLocalIdentifiers: updatedIdArray, options: options)

    var updates: [PHAsset] = []
    result.enumerateObjects { asset, _, _ in updates.append(asset) }

    return NativeSyncDelta(
      hasChanges: true,
      updates: updates,
      deletes: Array(deletedIds),
      assetAlbums: buildAssetAlbumsMap(assetIds: updatedIdArray)
    )
  }

  private func buildAssetAlbumsMap(assetIds: [String]) -> [String: [String]] {
    guard !assetIds.isEmpty else { return [:] }

    var result: [String: [String]] = [:]
    let options = PHFetchOptions()
    options.predicate = NSPredicate(format: "localIdentifier IN %@", assetIds)
    options.includeHiddenAssets = false

    for type in SyncConfig.albumTypes {
      photoLibrary.fetchAssetCollections(with: type, subtype: .any, options: nil)
        .enumerateObjects { album, _, _ in
          photoLibrary.fetchAssets(in: album, options: options)
            .enumerateObjects { asset, _, _ in
              result[asset.localIdentifier, default: []].append(album.localIdentifier)
            }
        }
    }

    return result
  }

  private func getAssetIdsForAlbum(albumId: String) throws -> [String] {
    guard let album = photoLibrary.fetchAssetCollection(albumId: albumId, options: nil) else { return [] }

    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    options.sortDescriptors = [NSSortDescriptor(key: "localIdentifier", ascending: true)]

    var ids: [String] = []
    photoLibrary.fetchAssets(in: album, options: options).enumerateObjects { asset, _, _ in
      ids.append(asset.localIdentifier)
    }
    return ids
  }

  private func getAssetsForAlbum(albumId: String, updatedTimeCond: Int64?) throws -> [PHAsset] {
    guard let album = photoLibrary.fetchAssetCollection(albumId: albumId, options: nil) else { return [] }

    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    if let timestamp = updatedTimeCond {
      let date = Date(timeIntervalSince1970: TimeInterval(timestamp))
      options.predicate = NSPredicate(
        format: "creationDate > %@ OR modificationDate > %@",
        date as NSDate,
        date as NSDate
      )
    }

    let result = photoLibrary.fetchAssets(in: album, options: options)
    var assets: [PHAsset] = []
    result.enumerateObjects { asset, _, _ in assets.append(asset) }

    return assets
  }
}

func diffSortedArrays<T: Comparable & Hashable>(_ a: [T], _ b: [T]) -> (toAdd: [T], toRemove: [T]) {
  var toAdd: [T] = []
  var toRemove: [T] = []
  var i = 0
  var j = 0

  while i < a.count && j < b.count {
    if a[i] < b[j] {
      toRemove.append(a[i])
      i += 1
    } else if b[j] < a[i] {
      toAdd.append(b[j])
      j += 1
    } else {
      i += 1
      j += 1
    }
  }

  toRemove.append(contentsOf: a[i...])
  toAdd.append(contentsOf: b[j...])

  return (toAdd, toRemove)
}

private struct NativeSyncDelta: Hashable {
  var hasChanges: Bool
  var updates: [PHAsset]
  var deletes: [String]
  var assetAlbums: [String: [String]]
}

/// Temp table to avoid parameter limit for album changes.
@Table("current_albums")
private struct CurrentAlbum {
  let id: String
}
