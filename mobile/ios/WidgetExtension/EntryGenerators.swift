import SwiftUI
import WidgetKit

func buildEntry(
  api: ImmichAPI,
  asset: SearchResult,
  dateOffset: Int,
  subtitle: String? = nil
)
  async throws -> ImageEntry
{
  let entryDate = Calendar.current.date(
    byAdding: .minute,
    value: dateOffset * 20,
    to: Date.now
  )!
  let image = try await api.fetchImage(asset: asset)
  return ImageEntry(date: entryDate, image: image, subtitle: subtitle)
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
        return try? await buildEntry(
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
