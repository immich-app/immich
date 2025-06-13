
import WidgetKit
import SwiftUI
import AppIntents

// MARK: Widget Configuration

extension Album: @unchecked Sendable, AppEntity, Identifiable {
  
  struct AlbumQuery: EntityQuery {
    func entities(for identifiers: [Album.ID]) async throws -> [Album] {
      var albums = try await AlbumCache.shared.getAlbums()
      albums.insert(NO_ALBUM, at: 0)
      
      return albums.filter {
        identifiers.contains($0.id)
      }
    }
          
    func suggestedEntities() async throws -> [Album] {
      var albums = try await AlbumCache.shared.getAlbums()
      albums.insert(NO_ALBUM, at: 0)
      
      return albums
    }
  }
  
  static var defaultQuery = AlbumQuery()
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Album")
  
  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(albumName)")
  }
}

let NO_ALBUM = Album(id: "NONE", albumName: "None")

struct RandomConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Select Album" }
    static var description: IntentDescription { "Choose an album to show images from" }

    // An example configurable parameter.
    @Parameter(title: "Album", default: NO_ALBUM)
    var album: Album?
}

// MARK: Provider

struct ImmichRandomProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }
  
  func snapshot(for configuration: RandomConfigurationAppIntent, in context: Context) async -> ImageEntry {
    guard let api = try? await ImmichAPI() else {
      return ImageEntry(date: Date(), image: nil, error: .noLogin)
    }
    
    guard let demoImage = try? await api.fetchSearchResults(with: SearchFilters(size: 1)).first else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }
  
    guard let image = try? await api.fetchImage(asset: demoImage) else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }
    
    return ImageEntry(date: Date(), image: image)
  }
  
  func timeline(for configuration: RandomConfigurationAppIntent, in context: Context) async -> Timeline<ImageEntry> {
    var entries: [ImageEntry] = []
    let now = Date()
    
    // If we don't have a server config, return an entry with an error
    guard let api = try? await ImmichAPI() else {
      entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
      return Timeline(entries: entries, policy: .atEnd)
    }
    
    print(configuration.album)
    
    entries.append(contentsOf: (try? await generateRandomEntries(api: api, now: now, count: 24)) ?? [])
    
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
