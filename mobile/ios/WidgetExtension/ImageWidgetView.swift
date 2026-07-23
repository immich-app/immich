import SwiftUI
import WidgetKit

extension Image {
  @ViewBuilder
  func tintedWidgetImageModifier() -> some View {
    if #available(iOS 18.0, *) {
      self
        .widgetAccentedRenderingMode(.accentedDesaturated)
    } else {
      self
    }
  }
}

struct ImmichWidgetView: View {
  var entry: ImageEntry

  var body: some View {
    if let image = entry.image {
      ImmichWidgetContentView(image: image, subtitle: entry.metadata.subtitle, deepLink: entry.metadata.deepLink)
    } else {
      ImmichWidgetLoadingView(message: entry.metadata.error?.errorDescription)
    }
  }
}

private struct ImmichWidgetLoadingView: View {
  let message: String?

  var body: some View {
    Image("LaunchImage")
      .tintedWidgetImageModifier()
      .overlay(alignment: .bottom) {
        if let message {
          Text(message)
            .minimumScaleFactor(0.25)
            .multilineTextAlignment(.center)
            .foregroundStyle(.secondary)
            .fixedSize()
            .alignmentGuide(.bottom) { dimensions in
              // Place the text below the bottom of the image
              dimensions[.top] - 8
            }
        }
      }
  }
}

private struct ImmichWidgetContentView: View {
  let image: UIImage
  let subtitle: String?
  let deepLink: URL?

  var body: some View {
    ZStack(alignment: .leading) {
      Color.clear.overlay(
        Image(uiImage: image)
          .resizable()
          .tintedWidgetImageModifier()
          .scaledToFill()
        )
        VStack {
          Spacer()
          if let subtitle = subtitle {
            Text(subtitle)
              .foregroundColor(.white)
              .padding(6)
              .background(ContainerRelativeShape().fill(Color.black.opacity(0.6)))
              .font(.system(size: 16))
          }
        }
          .padding(16)
        }
    .widgetURL(deepLink)
  }
}

#Preview(
  as: .systemMedium,
  widget: {
    ImmichRandomWidget()
  },
  timeline: {
    let date = Date()
    ImageEntry(
      date: date,
      image: UIImage(named: "LaunchImage"),
      metadata: EntryMetadata(
        subtitle: "1 year ago"
      )
    )
  }
)

#Preview(
  as: .systemSmall,
  widget: {
    ImmichRandomWidget()
  },
  timeline: {
    let date = Date()
    ImageEntry(
      date: date,
      image: UIImage(named: "LaunchImage"),
      metadata: EntryMetadata(
        subtitle: "Yesterday"
      )
    )
  }
)

#Preview(
  as: .systemLarge,
  widget: {
    ImmichRandomWidget()
  },
  timeline: {
    let date = Date()
    ImageEntry(
      date: date,
      image: UIImage(named: "LaunchImage"),
      metadata: EntryMetadata(
        subtitle: "2000 seconds ago"
      )
    )
  }
)
