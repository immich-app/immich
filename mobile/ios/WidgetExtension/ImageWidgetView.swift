import SwiftUI
import WidgetKit


struct ImageEntry: TimelineEntry {
  let date: Date
  let image: UIImage?
  var subtitle: String? = nil
  var error: WidgetError? = nil
}

struct ImmichWidgetView : View {
  var entry: ImageEntry
  
  func getErrorText(_ error: WidgetError?) -> String {
    switch (error) {
      case .noLogin:
        return "Login to Immich"
      
      case .fetchFailed:
        return "Unable to connect to your Immich instance"
        
      default:
        return "An unknown error occured"
    }
  }
  
  var body: some View {
    if (entry.image == nil) {
      VStack {
        Image("LaunchImage")
        Text(getErrorText(entry.error))
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
        VStack() {
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
    }
  }
}


#Preview(as: .systemMedium, widget: {
  ImmichRandomWidget()
}, timeline: {
  let date = Date()
  ImageEntry(date: date, image: UIImage(named: "ImmichLogo"), subtitle: "1 year ago")
})
