import Accelerate
import Foundation

enum ImageProcessing {
  static let queue = {
    let q = OperationQueue()
    q.name = "thumbnail.processing"
    q.qualityOfService = .userInitiated
    q.maxConcurrentOperationCount = ProcessInfo.processInfo.activeProcessorCount * 2
    return q
  }()
  static let cancelledResult = Result<[String: Int64]?, any Error>.success(nil)
  // Impeller shrinks each side to the GPU texture limit on its own, which squishes long images.
  static let maxPixelSize = 16384

  static func rgbaBuffer(_ image: CGImage, format: vImage_CGImageFormat) throws -> vImage_Buffer {
    guard image.bitsPerComponent == 10 else {
      return try vImage_Buffer(cgImage: image, format: format)
    }

    // vImage can't convert packed 10-bit images.
    let buffer = try vImage_Buffer(width: image.width, height: image.height, bitsPerPixel: format.bitsPerPixel)
    guard let context = CGContext(data: buffer.data, width: image.width, height: image.height, bitsPerComponent: Int(format.bitsPerComponent), bytesPerRow: buffer.rowBytes, space: format.colorSpace.takeUnretainedValue(), bitmapInfo: format.bitmapInfo.rawValue) else {
      buffer.free()
      throw vImage.Error.invalidImageFormat
    }

    context.setRenderingIntent(format.renderingIntent)
    context.setBlendMode(.copy)
    context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    return buffer
  }
}
