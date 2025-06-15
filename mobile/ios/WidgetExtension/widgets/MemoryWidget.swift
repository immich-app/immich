import AppIntents
import SwiftUI
import WidgetKit


struct ImmichMemoryProvider: TimelineProvider {
  func getYearDifferenceSubtitle(assetYear: Int) -> String {
    let currentYear = Calendar.current.component(.year, from: Date.now)
    // construct a "X years ago" subtitle
    let yearDifference = currentYear - assetYear

    return "\(yearDifference) year\(yearDifference == 1 ? "" : "s") ago"
  }

  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping @Sendable (ImageEntry) -> Void) {
    Task {
      guard let api = try? await ImmichAPI() else {
        completion(ImageEntry(date: Date(), image: nil, error: .noLogin))
        return;
      }
      
      guard let memories = try? await api.fetchMemory(for: Date.now)
      else {
        completion(ImageEntry(date: Date(), image: nil, error: .fetchFailed))
        return
      }
      
      do {
        for memory in memories {
          if let asset = memory.assets.first(where: { $0.type == .image }) {
            completion(try await buildEntry(
              api: api,
              asset: asset,
              hourOffset: 0,
              subtitle: getYearDifferenceSubtitle(assetYear: memory.data.year)
            ))
            return
          }
        }
      } catch {}
      
      // fallback to random image
      guard
        let randomImage = try? await api.fetchSearchResults(
          with: SearchFilters(size: 1)
        ).first
      else {
        completion(ImageEntry(date: Date(), image: nil, error: .fetchFailed))
        return
      }
      
      guard
        let imageEntry = try? await buildEntry(
          api: api,
          asset: randomImage,
          hourOffset: 0,
        )
      else {
        completion(ImageEntry(date: Date(), image: nil, error: .fetchFailed))
        return
      }
      
      completion(imageEntry)
    }
  }

  func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<ImageEntry>) -> Void) {
    Task {
      
      var entries: [ImageEntry] = []
      let now = Date()
      
      guard let api = try? await ImmichAPI() else {
        entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
        completion(Timeline(entries: entries, policy: .atEnd))
        return
      }
      
      // This whole block can fail and we will fall back to random, then a failure screen
      do {
        let memories = try await api.fetchMemory(for: Date.now)
        
        for memory in memories {
          for asset in memory.assets {
            if asset.type == .image {
              entries.append(
                try await buildEntry(
                  api: api,
                  asset: asset,
                  hourOffset: entries.count,
                  subtitle: getYearDifferenceSubtitle(assetYear: memory.data.year)
                )
              )
            }
          }
        }
      } catch {
        print("Failed to fetch from server: \(error)")
      }
      
      // If we didnt add any memory images, default to 12 hours of random photos
      if entries.count == 0 {
        entries.append(
          contentsOf: (try? await generateRandomEntries(
            api: api,
            now: now,
            count: 12
          )) ?? []
        )
      }
      
      // If we fail to fetch images, we still want to add an entry with a nil image and an error
      if entries.count == 0 {
        entries.append(ImageEntry(date: now, image: nil, error: .fetchFailed))
      }
      
      completion(Timeline(entries: entries, policy: .atEnd))
    }
  }
}

struct ImmichMemoryWidget: Widget {
  let kind: String = "com.immich.widget.memory"

  var body: some WidgetConfiguration {
    StaticConfiguration(
      kind: kind,
      provider: ImmichMemoryProvider()
    ) { entry in
      ImmichWidgetView(entry: entry)
        .containerBackground(.regularMaterial, for: .widget)
    }
    // allow image to take up entire widget
    .contentMarginsDisabled()

    // widget picker info
    .configurationDisplayName("Memories")
    .description("See memories from Immich.")
  }
}
