import SwiftUI
import WidgetKit

typealias EntryMetadata = ImageEntry.Metadata

struct ImageEntry: TimelineEntry {
  let date: Date
  var image: UIImage?
  var metadata: Metadata = Metadata()

  struct Metadata: Codable {
    var subtitle: String? = nil
    var error: WidgetError? = nil
    var deepLink: URL? = nil
  }

  // Resizes the stored image to a maximum width of 450 pixels
  mutating func resize() {
    if image == nil || image!.size.height < 450 || image!.size.width < 450 {
      return
    }

    image = image?.resized(toWidth: 450)

    if image == nil {
      metadata.error = .unableToResize
    }
  }

  static func build(
    api: ImmichAPI,
    asset: Asset,
    dateOffset: Int,
    subtitle: String? = nil
  )
    async throws -> Self
  {
    let entryDate = Calendar.current.date(
      byAdding: .minute,
      value: dateOffset * 20,
      to: Date.now
    )!
    let image = try await api.fetchImage(asset: asset)

    return Self(
      date: entryDate,
      image: image,
      metadata: EntryMetadata(
        subtitle: subtitle,
        deepLink: asset.deepLink
      )
    )
  }

  func cache(for key: String) throws {
    if let containerURL = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: IMMICH_SHARE_GROUP
    ) {
      let imageURL = containerURL.appendingPathComponent("\(key)_image.png")
      let metadataURL = containerURL.appendingPathComponent(
        "\(key)_metadata.json"
      )

      // build metadata JSON
      let entryMetadata = try JSONEncoder().encode(self.metadata)

      // write to disk
      try self.image?.pngData()?.write(to: imageURL, options: .atomic)
      try entryMetadata.write(to: metadataURL, options: .atomic)
    }
  }

  static func loadCached(for key: String, at date: Date = Date.now)
    -> ImageEntry?
  {
    if let containerURL = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: IMMICH_SHARE_GROUP
    ) {
      let imageURL = containerURL.appendingPathComponent("\(key)_image.png")
      let metadataURL = containerURL.appendingPathComponent(
        "\(key)_metadata.json"
      )

      guard let imageData = try? Data(contentsOf: imageURL),
        let metadataJSON = try? Data(contentsOf: metadataURL),
        let decodedMetadata = try? JSONDecoder().decode(Metadata.self, from: metadataJSON)
      else {
        return nil
      }

      return ImageEntry(
        date: date,
        image: UIImage(data: imageData),
        metadata: decodedMetadata
      )
    }

    return nil
  }

  static func handleCacheFallback(
    for key: String,
    error: WidgetError = .fetchFailed
  ) -> Timeline<ImageEntry> {
    var timelineEntry = ImageEntry(
      date: Date.now,
      image: nil,
      metadata: EntryMetadata(error: error)
    )

    // skip cache if album not found or no login
    // we want to show these errors to the user since without intervention,
    // it will never succeed
    if error != .noLogin && error != .albumNotFound {
      if let cachedEntry = ImageEntry.loadCached(for: key) {
        timelineEntry = cachedEntry
      }
    }

    return Timeline(entries: [timelineEntry], policy: .atEnd)
  }
}

func generateRandomEntries(
  api: ImmichAPI,
  now: Date,
  count: Int,
  albumId: String? = nil,
  subtitle: String? = nil
)
  async throws -> [ImageEntry]
{

  var entries: [ImageEntry] = []
  let albumIds = albumId != nil ? [albumId!] : []

  let randomAssets = try await api.fetchSearchResults(
    with: SearchFilters(size: count, albumIds: albumIds)
  )

  await withTaskGroup(of: ImageEntry?.self) { group in
    for (dateOffset, asset) in randomAssets.enumerated() {
      group.addTask {
        return try? await ImageEntry.build(
          api: api,
          asset: asset,
          dateOffset: dateOffset,
          subtitle: subtitle
        )
      }
    }

    for await result in group {
      if let entry = result {
        entries.append(entry)
      }
    }
  }

  return entries
}
