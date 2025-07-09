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
    ImageEntry(date: Date())
  }

  func snapshot(
    for configuration: RandomConfigurationAppIntent,
    in context: Context
  ) async
    -> ImageEntry
  {
    let cacheKey = "random_none_\(context.family.rawValue)"
    
    guard let api = try? await ImmichAPI() else {
      return ImageEntry.handleCacheFallback(for: cacheKey, error: .noLogin).entries.first!
    }

    guard
      let randomImage = try? await api.fetchSearchResults(
        with: SearchFilters(size: 1)
      ).first,
      var entry = try? await ImageEntry.build(
        api: api,
        asset: randomImage,
        dateOffset: 0
      )
    else {
      return ImageEntry.handleCacheFallback(for: cacheKey).entries.first!
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

    // nil if album is NONE or nil
    let albumId =
      configuration.album?.id != "NONE" ? configuration.album?.id : nil
    let albumName: String? =
      albumId != nil ? configuration.album?.albumName : nil

    let cacheKey = "random_\(albumId ?? "none")_\(context.family.rawValue)"

    // If we don't have a server config, return an entry with an error
    guard let api = try? await ImmichAPI() else {
      return ImageEntry.handleCacheFallback(for: cacheKey, error: .noLogin)
    }

    if albumId != nil {
      // make sure the album exists on server, otherwise show error
      guard let albums = try? await api.fetchAlbums() else {
        return ImageEntry.handleCacheFallback(for: cacheKey)
      }

      if !albums.contains(where: { $0.id == albumId }) {
        return ImageEntry.handleCacheFallback(
          for: cacheKey,
          error: .albumNotFound
        )
      }
    }

    // build entries
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

    // Load or save a cached asset for when network conditions are bad
    if entries.count == 0 {
      return ImageEntry.handleCacheFallback(for: cacheKey)
    }

    // Resize all images to something that can be stored by iOS
    for i in entries.indices {
      entries[i].resize()
    }

    // cache the last image
    try? entries.last!.cache(for: cacheKey)

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
