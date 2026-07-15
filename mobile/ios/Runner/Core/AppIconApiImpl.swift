import UIKit

/// Switches between the alternate app icons bundled in the asset catalog
/// (`AppIconMidnight`, `AppIconOcean`, ...). The "classic" id maps to the
/// primary `AppIcon`.
class AppIconApiImpl: AppIconApi {
  private static let defaultIcon = "classic"
  private static let assetPrefix = "AppIcon"

  private func assetName(for iconId: String) -> String? {
    guard iconId != Self.defaultIcon else { return nil }
    return Self.assetPrefix + iconId.prefix(1).uppercased() + String(iconId.dropFirst())
  }

  func setAppIcon(iconId: String, completion: @escaping (Result<Void, Error>) -> Void) {
    let iconName = assetName(for: iconId)
    DispatchQueue.main.async {
      guard UIApplication.shared.supportsAlternateIcons else {
        completion(
          .failure(
            PigeonError(
              code: "unsupported",
              message: "Alternate icons are not supported on this device",
              details: nil
            )))
        return
      }
      UIApplication.shared.setAlternateIconName(iconName) { error in
        if let error = error {
          completion(
            .failure(
              PigeonError(code: "set_icon_failed", message: error.localizedDescription, details: nil)
            ))
        } else {
          completion(.success(()))
        }
      }
    }
  }

  func getAppIcon() throws -> String {
    guard let name = UIApplication.shared.alternateIconName else { return Self.defaultIcon }
    return String(name.dropFirst(Self.assetPrefix.count)).lowercased()
  }
}
