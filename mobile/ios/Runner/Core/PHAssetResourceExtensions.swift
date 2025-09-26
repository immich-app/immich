
import Photos

extension PHAssetResource {
  var isCurrent: Bool {
    return value(forKey: "isCurrent") as? Bool ?? false
  }
  
  var isMediaResource: Bool {
    var isMedia = type != .adjustmentData
    if #available(iOS 17, *) {
      isMedia = isMedia && type != .photoProxy
    }
    return isMedia
  }
}
