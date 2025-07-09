import SwiftUI
import WidgetKit

struct ImmichWidgetView: View {
  var entry: ImageEntry

  var body: some View {
    if entry.image == nil {
      VStack {
        Image("LaunchImage")
        Text(entry.metadata.error?.errorDescription ?? "")
          .minimumScaleFactor(0.25)
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)
      }
      .padding(16)
    } else {
      ZStack(alignment: .leading) {
        Color.clear.overlay(
          Image(uiImage: entry.image!)
            .resizable()
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
