
import WidgetKit
import SwiftUI
import AppIntents

struct RandomConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Select Album" }
    static var description: IntentDescription { "Choose an album to show images from" }

    // An example configurable parameter.
    @Parameter(title: "Favorite Emoji", default: "😃")
    var favoriteEmoji: String
}

struct ImmichRandomProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }
  
  func snapshot(for configuration: RandomConfigurationAppIntent, in context: Context) async -> ImageEntry {
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
  
  func timeline(for configuration: RandomConfigurationAppIntent, in context: Context) async -> Timeline<ImageEntry> {
    var entries: [ImageEntry] = []
    let now = Date()
    
    guard let serverConfig = getServerConfig() else {
      // If we don't have a server config, return an entry with an error
      entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
      return Timeline(entries: entries, policy: .atEnd)
    }
    
    entries.append(contentsOf: (try? await generateRandomEntries(serverConfig: serverConfig, now: now, count: 24)) ?? [])
    
    // If we fail to fetch images, we still want to add an entry with a nil image and an error
    if (entries.count == 0) {
      entries.append(ImageEntry(date: now, image: nil, error: .fetchFailed))
    }
    

    return Timeline(entries: entries, policy: .atEnd)
  }
}



struct ImmichRandomWidget: Widget {
  let kind: String = "com.immich.widget.random"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: RandomConfigurationAppIntent.self, provider: ImmichRandomProvider()) { entry in
      ImmichWidgetView(entry: entry)
        .containerBackground(.black, for: .widget)
    }
      // allow image to take up entire widget
      .contentMarginsDisabled()

      // widget picker info
      .configurationDisplayName("Random")
      .description("View a random image from your library or a specific album.")
  }
}
