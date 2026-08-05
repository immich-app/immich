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
    var forceFullColor: Bool = true
  }

  static func build(
    api: ImmichAPI,
    asset: Asset,
    dateOffset: Int,
    subtitle: String? = nil,
    forceFullColor: Bool = true
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
        deepLink: asset.deepLink,
        forceFullColor: forceFullColor
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
        let decodedMetadata = try? JSONDecoder().decode(
          Metadata.self,
          from: metadataJSON
        )
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

  static func handleError(
    for key: String,
    error: WidgetError = .fetchFailed
  ) -> Timeline<ImageEntry> {
    var timelineEntry = ImageEntry(
      date: Date.now,
      image: nil,
      metadata: EntryMetadata(error: error)
    )

    // use cache if generic failed error
    // we want to show the other errors to the user since without intervention,
    // it will never succeed
    if error == .fetchFailed, let cachedEntry = ImageEntry.loadCached(for: key)
    {
      timelineEntry = cachedEntry
    }

    return Timeline(entries: [timelineEntry], policy: .atEnd)
  }

}

// Required so that we can decode older versions of the metadata
extension ImageEntry.Metadata {
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    subtitle = try container.decodeIfPresent(String.self, forKey: .subtitle)
    error = try container.decodeIfPresent(WidgetError.self, forKey: .error)
    deepLink = try container.decodeIfPresent(URL.self, forKey: .deepLink)

    forceFullColor =
      try container.decodeIfPresent(Bool.self, forKey: .forceFullColor) ?? true
  }
}

func generateRandomEntries(
  api: ImmichAPI,
  now: Date,
  count: Int,
  filter: SearchFilter = Album.NONE.filter,
  subtitle: String? = nil,
  forceFullColor: Bool = true
)
  async throws -> [ImageEntry]
{

  var entries: [ImageEntry] = []

  let randomAssets = try await api.fetchSearchResults(with: filter)

  await withTaskGroup(of: ImageEntry?.self) { group in
    for (dateOffset, asset) in randomAssets.enumerated() {
      group.addTask {
        return try? await ImageEntry.build(
          api: api,
          asset: asset,
          dateOffset: dateOffset,
          subtitle: subtitle,
          forceFullColor: forceFullColor
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
