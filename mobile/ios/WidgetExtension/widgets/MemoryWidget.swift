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

  func getSnapshot(
    in context: Context,
    completion: @escaping @Sendable (ImageEntry) -> Void
  ) {
    let cacheKey = "memory_\(context.family.rawValue)"

    Task {
      guard let api = try? await ImmichAPI() else {
        completion(
          ImageEntry.handleError(for: cacheKey, error: .noLogin).entries.first!
        )
        return
      }

      guard let memories = try? await api.fetchMemory(for: Date.now)
      else {
        completion(ImageEntry.handleError(for: cacheKey).entries.first!)
        return
      }

      for memory in memories {
        if let asset = memory.assets.first(where: { $0.type == .image }),
          let entry = try? await ImageEntry.build(
            api: api,
            asset: asset,
            dateOffset: 0,
            subtitle: getYearDifferenceSubtitle(assetYear: memory.data.year)
          )
        {
          completion(entry)
          return
        }
      }

      // fallback to random image
      guard
        let randomImage = try? await api.fetchSearchResults().first,
        let imageEntry = try? await ImageEntry.build(
          api: api,
          asset: randomImage,
          dateOffset: 0
        )
      else {
        completion(ImageEntry.handleError(for: cacheKey).entries.first!)
        return
      }

      completion(imageEntry)
    }
  }

  func getTimeline(
    in context: Context,
    completion: @escaping @Sendable (Timeline<ImageEntry>) -> Void
  ) {
    Task {
      var entries: [ImageEntry] = []
      let now = Date()

      let cacheKey = "memory_\(context.family.rawValue)"

      guard let api = try? await ImmichAPI() else {
        completion(
          ImageEntry.handleError(for: cacheKey, error: .noLogin)
        )
        return
      }

      let memories = try await api.fetchMemory(for: Date.now)

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
                  )
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

      // If we didnt add any memory images (some failure occured or no images in memory),
      // default to 12 hours of random photos
      if entries.count == 0 {
        // this must be a do/catch since we need to
        // distinguish between a network fail and an empty search
        do {
          let search = try await generateRandomEntries(
            api: api,
            now: now,
            count: 12
          )

          // Load or save a cached asset for when network conditions are bad
          if search.count == 0 {
            completion(
              ImageEntry.handleError(for: cacheKey, error: .noAssetsAvailable)
            )
            return
          }

          entries.append(contentsOf: search)
        } catch {
          completion(ImageEntry.handleError(for: cacheKey))
          return
        }
      }

      // cache the last image
      try? entries.last!.cache(for: cacheKey)

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
