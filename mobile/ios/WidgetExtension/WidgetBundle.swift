import SwiftUI
import WidgetKit

@main
struct ImmichWidgetBundle: WidgetBundle {
  var body: some Widget {
    ImmichRandomWidget()
    ImmichMemoryWidget()
  }
}
