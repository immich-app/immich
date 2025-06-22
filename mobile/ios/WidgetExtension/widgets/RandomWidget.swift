import AppIntents
import SwiftUI
import WidgetKit

// MARK: Widget Configuration

extension Album: @unchecked Sendable, AppEntity, Identifiable {

  struct AlbumQuery: EntityQuery {
    func entities(for identifiers: [Album.ID]) async throws -> [Album] {
      // use cached albums to search
      var albums = (try? await AlbumCache.shared.getAlbums()) ?? []
      albums.insert(NO_ALBUM, at: 0)

      return albums.filter {
        identifiers.contains($0.id)
      }
    }

    func suggestedEntities() async throws -> [Album] {
      var albums = (try? await AlbumCache.shared.getAlbums(refresh: true)) ?? []
      albums.insert(NO_ALBUM, at: 0)

      return albums
    }
  }

  static var defaultQuery = AlbumQuery()
  static var typeDisplayRepresentation = TypeDisplayRepresentation(
    name: "Album"
  )

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(albumName)")
  }
}

let NO_ALBUM = Album(id: "NONE", albumName: "None")

struct RandomConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Select Album" }
  static var description: IntentDescription {
    "Choose an album to show images from"
  }

  @Parameter(title: "Album")
  var album: Album?
  
  @Parameter(title: "Show Album Name", default: false)
  var showAlbumName: Bool
}

// MARK: Provider

struct ImmichRandomProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }

  func snapshot(
    for configuration: RandomConfigurationAppIntent,
    in context: Context
  ) async
    -> ImageEntry
  {
    guard let api = try? await ImmichAPI() else {
      return ImageEntry(date: Date(), image: nil, error: .noLogin)
    }

    guard
      let randomImage = try? await api.fetchSearchResults(
        with: SearchFilters(size: 1)
      ).first
    else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }

    guard
      var entry = try? await buildEntry(
        api: api,
        asset: randomImage,
        dateOffset: 0
      )
    else {
      return ImageEntry(date: Date(), image: nil, error: .fetchFailed)
    }

    entry.resize()

    return entry
  }

  func timeline(
    for configuration: RandomConfigurationAppIntent,
    in context: Context
  ) async
    -> Timeline<ImageEntry>
  {
    var entries: [ImageEntry] = []
    let now = Date()

    // If we don't have a server config, return an entry with an error
    guard let api = try? await ImmichAPI() else {
      entries.append(ImageEntry(date: now, image: nil, error: .noLogin))
      return Timeline(entries: entries, policy: .atEnd)
    }

    // nil if album is NONE or nil
    let albumId =
      configuration.album?.id != "NONE" ? configuration.album?.id : nil
    var albumName: String? = albumId != nil ? configuration.album?.albumName : nil
    
    if albumId != nil {
      // make sure the album exists on server, otherwise show error
      guard let albums = try? await api.fetchAlbums() else {
        entries.append(ImageEntry(date: now, image: nil, error: .fetchFailed))
        return Timeline(entries: entries, policy: .atEnd)
      }

      if !albums.contains(where: { $0.id == albumId }) {
        entries.append(ImageEntry(date: now, image: nil, error: .albumNotFound))
        return Timeline(entries: entries, policy: .atEnd)
      }
    }

    entries.append(
      contentsOf: (try? await generateRandomEntries(
        api: api,
        now: now,
        count: 12,
        albumId: albumId,
        subtitle: configuration.showAlbumName ? albumName : nil
      ))
        ?? []
    )

    // If we fail to fetch images, we still want to add an entry with a nil image and an error
    if entries.count == 0 {
      entries.append(ImageEntry(date: now, image: nil, error: .fetchFailed))
    }

    // Resize all images to something that can be stored by iOS
    for i in entries.indices {
      entries[i].resize()
    }

    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct ImmichRandomWidget: Widget {
  let kind: String = "com.immich.widget.random"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: RandomConfigurationAppIntent.self,
      provider: ImmichRandomProvider()
    ) { entry in
      ImmichWidgetView(entry: entry)
        .containerBackground(.regularMaterial, for: .widget)
    }
    // allow image to take up entire widget
    .contentMarginsDisabled()

    // widget picker info
    .configurationDisplayName("Random")
    .description("View a random image from your library or a specific album.")
  }
}
