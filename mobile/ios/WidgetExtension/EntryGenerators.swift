
import SwiftUI
import WidgetKit

func buildEntry(api: ImmichAPI, asset: SearchResult, hourOffset: Int, subtitle: String? = nil) async throws -> ImageEntry {
  let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: Date.now)!
  let image = try await api.fetchImage(asset: asset)
  return ImageEntry(date: entryDate, image: image, subtitle: subtitle)
}

func generateRandomEntries(api: ImmichAPI, now: Date, count: Int) async throws -> [ImageEntry] {
  
  var entries: [ImageEntry] = []
  
  let randomAssets = try await api.fetchSearchResults(with: SearchFilters(size: count))
  for (hourOffset, asset) in randomAssets.enumerated() {
    entries.append(try await buildEntry(api: api, asset: asset, hourOffset: hourOffset))
  }
  
  return entries
}
