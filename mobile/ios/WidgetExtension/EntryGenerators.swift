
import SwiftUI
import WidgetKit

func buildEntry(serverConfig: ServerConfig, asset: SearchResult, hourOffset: Int, subtitle: String? = nil) async throws -> ImageEntry {
  let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: Date.now)!
  let image = try await fetchImage(serverConfig: serverConfig, asset: asset)
  return ImageEntry(date: entryDate, image: image, subtitle: subtitle)
}

func generateRandomEntries(serverConfig: ServerConfig, now: Date, count: Int) async throws -> [ImageEntry] {
  
  var entries: [ImageEntry] = []
  
  let randomAssets = try await fetchSearchResults(serverConfig: serverConfig, searchRequest: SearchRequest(size: count))
  for (hourOffset, asset) in randomAssets.enumerated() {
    entries.append(try await buildEntry(serverConfig: serverConfig, asset: asset, hourOffset: hourOffset))
  }
  
  return entries
}
