
import WidgetKit
import SwiftUI
import AppIntents

struct EmptyConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Empty Configuration"
    static var description = IntentDescription("Does nothing.")
  // TODO: make no configuration
}

struct ImmichMemoryProvider: AppIntentTimelineProvider {
  
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }
  
  func snapshot(for configuration: EmptyConfigurationIntent, in context: Context) async -> ImageEntry {
    guard let api = try? await ImmichAPI() else {
      return ImageEntry(date: Date(), image: nil, error: .noLogin)
    }
    
    // TODO: Revise to grab a memory instead of random
    guard let demoImage = try? await api.fetchSearchResults(with: SearchFilters(size: 1)).first else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }
  
    guard let image = try? await api.fetchImage(asset: demoImage) else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }
    
    return ImageEntry(date: Date(), image: image)
  }
  
  func timeline(for configuration: EmptyConfigurationIntent, in context: Context) async -> Timeline<ImageEntry> {
    var entries: [ImageEntry] = []
    let now = Date()
    
    guard let api = try? await ImmichAPI() else {
      entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
      return Timeline(entries: entries, policy: .atEnd)
    }
      
    // This whole block can fail and we will fall back to random, then a failure screen
    do {
      let memories = try await api.fetchMemory(for: Date.now)
      let currentYear = Calendar.current.component(.year, from: Date.now)

      for memory in memories {
        // construct a "X years ago" subtitle
        let yearDifference = currentYear - memory.data.year
        let subtitle = "\(yearDifference) year\(yearDifference == 1 ? "" : "s") ago"
        
        for asset in memory.assets {
          if (asset.type == "IMAGE") {
            entries.append(try await buildEntry(api: api, asset: asset, hourOffset: entries.count, subtitle: subtitle))
          }
        }
      }
    } catch {
      print("Failed to fetch from server: \(error)")
    }
    
    // If we didnt add any memory images, default to 12 hours of random photos
    if (entries.count == 0) {
      entries.append(contentsOf: (try? await generateRandomEntries(api: api, now: now, count: 12)) ?? [])
    }
    
    // If we fail to fetch images, we still want to add an entry with a nil image and an error
    if (entries.count == 0) {
      entries.append(ImageEntry(date: now, image: nil, error: .fetchFailed))
    }

    return Timeline(entries: entries, policy: .atEnd)
  }
}



struct ImmichMemoryWidget: Widget {
  let kind: String = "com.immich.widget.memory"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: EmptyConfigurationIntent.self, provider: ImmichMemoryProvider()) { entry in
      ImmichWidgetView(entry: entry)
        .containerBackground(.black, for: .widget)
    }
      // allow image to take up entire widget
      .contentMarginsDisabled()

      // widget picker info
      .configurationDisplayName("Memories")
      .description("See memories from Immich.")
  }
}
