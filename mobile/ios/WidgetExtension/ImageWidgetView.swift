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
    if entry.image == nil {
      Image("LaunchImage")
        .tintedWidgetImageModifier()
        .overlay(alignment: .bottom) {
          if let error = entry.metadata.error?.errorDescription {
            Text(error)
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
    } else {
      ZStack(alignment: .leading) {
        Color.clear.overlay(
          Image(uiImage: entry.image!)
            .resizable()
            .tintedWidgetImageModifier()
            .scaledToFill()

        )
        VStack {
          Spacer()
          if let subtitle = entry.metadata.subtitle {
            Text(subtitle)
              .foregroundColor(.white)
              .padding(8)
              .background(Color.black.opacity(0.6))
              .cornerRadius(8)
              .font(.system(size: 16))
          }
        }
        .padding(16)
      }
      .widgetURL(entry.metadata.deepLink)
    }
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
      image: UIImage(named: "ImmichLogo"),
      metadata: EntryMetadata(
        subtitle: "1 year ago"
      )
    )
  }
)
