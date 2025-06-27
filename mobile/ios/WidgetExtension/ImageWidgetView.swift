import SwiftUI
import WidgetKit

struct ImageEntry: TimelineEntry {
  let date: Date
  var image: UIImage?
  var subtitle: String? = nil
  var error: WidgetError? = nil
  var deepLink: URL? = nil

  // Resizes the stored image to a maximum width of 450 pixels
  mutating func resize() {
    if (image == nil || image!.size.height < 450 || image!.size.width < 450 ) {
      return
    }
    
    image = image?.resized(toWidth: 450)
    
    if image == nil {
      error = .unableToResize
    }
  }
}

struct ImmichWidgetView: View {
  var entry: ImageEntry

  var body: some View {
    if entry.image == nil {
      VStack {
        Image("LaunchImage")
        Text(entry.error?.errorDescription ?? "")
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
          if let subtitle = entry.subtitle {
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
      .widgetURL(entry.deepLink)
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
      subtitle: "1 year ago"
    )
  }
)
