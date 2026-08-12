import AppIntents
import SwiftUI
import WidgetKit

// MARK: Widget Configuration

struct MemoryConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Memories" }
  static var description: IntentDescription {
    "See memories from Immich."
  }

  @Parameter(title: "Always Display in Full Color", default: false)
  var forceFullColor: Bool
}

// MARK: Provider

struct ImmichMemoryProvider: AppIntentTimelineProvider {
  func getYearDifferenceSubtitle(assetYear: Int) -> String {
    let currentYear = Calendar.current.component(.year, from: Date.now)
    // construct a "X years ago" subtitle
    let yearDifference = currentYear - assetYear

    return "\(yearDifference) year\(yearDifference == 1 ? "" : "s") ago"
  }

  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(date: Date(), image: nil)
  }

  func snapshot(
    for configuration: MemoryConfigurationAppIntent,
    in context: Context
  ) async -> ImageEntry {
    let cacheKey = "memory_\(context.family.rawValue)"

    guard let api = try? await ImmichAPI() else {
      return ImageEntry.handleError(for: cacheKey, error: .noLogin).entries
        .first!
    }

    guard let memories = try? await api.fetchMemory(for: Date.now) else {
      return ImageEntry.handleError(for: cacheKey).entries.first!
    }

    for memory in memories {
      if let asset = memory.assets.first(where: { $0.type == .image }),
        let entry = try? await ImageEntry.build(
          api: api,
          asset: asset,
          dateOffset: 0,
          subtitle: getYearDifferenceSubtitle(assetYear: memory.data.year),
          forceFullColor: configuration.forceFullColor
        )
      {
        return entry
      }
    }

    // fallback to random image
    guard
      let randomImage = try? await api.fetchSearchResults().first,
      let imageEntry = try? await ImageEntry.build(
        api: api,
        asset: randomImage,
        dateOffset: 0,
        forceFullColor: configuration.forceFullColor
      )
    else {
      return ImageEntry.handleError(for: cacheKey).entries.first!
    }

    return imageEntry
  }

  func timeline(
    for configuration: MemoryConfigurationAppIntent,
    in context: Context
  ) async 
    -> Timeline<ImageEntry> 
  {
    var entries: [ImageEntry] = []
    let now = Date()

    let cacheKey = "memory_\(context.family.rawValue)"

    guard let api = try? await ImmichAPI() else {
      return ImageEntry.handleError(for: cacheKey, error: .noLogin)
    }

    let memories: [MemoryResult]
    do {
      memories = try await api.fetchMemory(for: Date.now)

      await withTaskGroup(of: ImageEntry?.self) { group in
        var totalAssets = 0

        for memory in memories {
          for asset in memory.assets {
            if asset.type == .image && totalAssets < 12 {
              group.addTask {
                try? await ImageEntry.build(
                  api: api,
                  asset: asset,
                  dateOffset: totalAssets,
                  subtitle: getYearDifferenceSubtitle(
                    assetYear: memory.data.year
                  ),
                  forceFullColor: configuration.forceFullColor
                )
              }

              totalAssets += 1
            }
          }
        }

        for await result in group {
          if let entry = result {
            entries.append(entry)
          }
        }
      }

    } catch {
      return ImageEntry.handleError(for: cacheKey)
    }

    // If we didn't add any memory images (some failure occurred or no images in memory),
    // default to 12 hours of random photos
    if entries.count == 0 {
      // this must be a do/catch since we need to
      // distinguish between a network fail and an empty search
      do {
        let search = try await generateRandomEntries(
          api: api,
          now: now,
          count: 12,
          forceFullColor: configuration.forceFullColor
        )

        // Load or save a cached asset for when network conditions are bad
        if search.count == 0 {
          return ImageEntry.handleError(for: cacheKey, error: .noAssetsAvailable)
        }

        entries.append(contentsOf: search)
      } catch {
        return ImageEntry.handleError(for: cacheKey)
      }
    }

    // cache the last image
    try? entries.last!.cache(for: cacheKey)

    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct ImmichMemoryWidget: Widget {
  let kind: String = "com.immich.widget.memory"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: MemoryConfigurationAppIntent.self,
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
