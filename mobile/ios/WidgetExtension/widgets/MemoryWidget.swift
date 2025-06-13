
import WidgetKit
import SwiftUI
import AppIntents

struct EmptyConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Empty Configuration"
    static var description = IntentDescription("Does nothing.")
}

struct ImmichMemoryProvider: AppIntentTimelineProvider {
  
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }
  
  func snapshot(for configuration: EmptyConfigurationIntent, in context: Context) async -> ImageEntry {
    guard let serverConfig = getServerConfig() else {
      return ImageEntry(date: Date(), image: nil, error: .noLogin)
    }
    
    do {
      let demoImage = try await fetchSearchResults(serverConfig: serverConfig, searchRequest: SearchRequest(size: 1)).first
      let image = try await fetchImage(serverConfig: serverConfig, asset: demoImage!)
      
      return ImageEntry(date: Date(), image: image)
    } catch {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }
  }
  
  func timeline(for configuration: EmptyConfigurationIntent, in context: Context) async -> Timeline<ImageEntry> {
    var entries: [ImageEntry] = []
    let now = Date()
    
    guard let serverConfig = getServerConfig() else {
      // If we don't have a server config, return an entry with an error
      entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
      return Timeline(entries: entries, policy: .atEnd)
    }
        
    do {
      let memories = try await fetchMemory(serverConfig: serverConfig, for: Date.now)
      let currentYear = Calendar.current.component(.year, from: Date.now)

      for memory in memories {
        let subtitle = "\(currentYear - memory.data.year) year\(currentYear - memory.data.year == 1 ? "" : "s") ago"
                
        for asset in memory.assets {
          // only want image assets
          if (asset.type == "IMAGE") {
            entries.append(try await buildEntry(serverConfig: serverConfig, asset: asset, hourOffset: entries.count, subtitle: subtitle))
          }
        }
      }
    } catch {}
    
    // If we didnt add any memory images, default to 12 hours of random photos
    if (entries.count == 0) {
      entries.append(contentsOf: (try? await generateRandomEntries(serverConfig: serverConfig, now: now, count: 12)) ?? [])
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
