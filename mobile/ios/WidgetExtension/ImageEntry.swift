import SwiftUI
import WidgetKit

typealias EntryMetadata = ImageEntry.Metadata

struct ImageEntry: TimelineEntry {
  let date: Date
  var image: UIImage?
  var metadata: Metadata = Metadata()

  struct Metadata: Codable {
    var assetId: String? = nil
    var subtitle: String? = nil
    var error: WidgetError? = nil
    var deepLink: URL? = nil
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
        assetId: asset.id,
        subtitle: subtitle,
        deepLink: asset.deepLink
      )
    )
  }

  static func saveLast(for key: String, metadata: Metadata) {
    if let data = try? JSONEncoder().encode(metadata) {
      UserDefaults.group.set(data, forKey: "widget_last_\(key)")
    }
  }

  static func handleError(
    for key: String,
    api: ImmichAPI? = nil,
    error: WidgetError = .fetchFailed
  ) async -> Timeline<ImageEntry> {
    // Try to show the last image from the URL cache for transient failures
    if error == .fetchFailed, let api = api,
       let data = UserDefaults.group.data(forKey: "widget_last_\(key)"),
       let cached = try? JSONDecoder().decode(Metadata.self, from: data),
       let assetId = cached.assetId,
       let image = try? await api.fetchImage(asset: Asset(id: assetId, type: .image))
    {
      let entry = ImageEntry(date: Date.now, image: image, metadata: cached)
      return Timeline(entries: [entry], policy: .atEnd)
    }

    return Timeline(
      entries: [ImageEntry(date: Date.now, metadata: Metadata(error: error))],
      policy: .atEnd
    )
  }

}

func generateRandomEntries(
  api: ImmichAPI,
  now: Date,
  count: Int,
  filter: SearchFilter = Album.NONE.filter,
  subtitle: String? = nil
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
