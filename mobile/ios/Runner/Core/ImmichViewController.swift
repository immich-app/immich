import Flutter
import UIKit

class ImmichViewController: FlutterViewController {
  private lazy var systemOcclusionsApi = SystemOcclusionsFlutterApi(binaryMessenger: binaryMessenger)

  private var lastOcclusions: [CGRect]?

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    guard #available(iOS 27.1, *) else {
        return
    }

    // Devices like iPhone Duo have a corner status bar that Flutter needs to respond to
    let occlusions = view.reservedRegions(kind: .occlusion).filter(\.isActive).map(\.frame)

    guard occlusions != lastOcclusions else {
        return
    }

    lastOcclusions = occlusions

    // Send to Flutter
    let rects = occlusions.map { OcclusionRect(left: $0.minX, top: $0.minY, right: $0.maxX, bottom: $0.maxY) }
    systemOcclusionsApi.onChanged(occlusions: rects) { _ in }
  }
}
