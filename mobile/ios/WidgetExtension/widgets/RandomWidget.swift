import AppIntents
import SwiftUI
import WidgetKit

// MARK: Widget Configuration

extension Album: @unchecked Sendable, AppEntity, Identifiable {

  struct AlbumQuery: EntityQuery {
    func entities(for identifiers: [Album.ID]) async throws -> [Album] {
      return await suggestedEntities().filter {
        identifiers.contains($0.id)
      }
    }

    func suggestedEntities() async -> [Album] {
      let albums = (try? await AlbumCache.shared.getAlbums()) ?? []

      let options =
        [
          NONE,
          FAVORITES,
        ] + albums

      return options
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
      return ImageEntry.handleError(for: cacheKey, error: .noLogin).entries
        .first!
    }

    guard
      let randomImage = try? await api.fetchSearchResults(
        with: Album.NONE.filter
      ).first,
      let entry = try? await ImageEntry.build(
        api: api,
        asset: randomImage,
        dateOffset: 0
      )
    else {
      return ImageEntry.handleError(for: cacheKey).entries.first!
    }

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
    let album = configuration.album ?? Album.NONE
    let albumName = album.isVirtual ? nil : album.albumName

    let cacheKey = "random_\(album.id)_\(context.family.rawValue)"

    // If we don't have a server config, return an entry with an error
    guard let api = try? await ImmichAPI() else {
      return ImageEntry.handleError(for: cacheKey, error: .noLogin)
    }

    // build entries
    // this must be a do/catch since we need to
    // distinguish between a network fail and an empty search
    do {
      let search = try await generateRandomEntries(
        api: api,
        now: now,
        count: 12,
        filter: album.filter,
        subtitle: configuration.showAlbumName ? albumName : nil
      )

      // Load or save a cached asset for when network conditions are bad
      if search.count == 0 {
        return ImageEntry.handleError(for: cacheKey, error: .noAssetsAvailable)
      }

      entries.append(contentsOf: search)
    } catch {
      return ImageEntry.handleError(for: cacheKey)
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
