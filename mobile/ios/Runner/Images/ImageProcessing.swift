import Foundation

enum ImageProcessing {
  static let queue = DispatchQueue(label: "thumbnail.processing", qos: .userInitiated, attributes: .concurrent)
  static let semaphore = DispatchSemaphore(value: ProcessInfo.processInfo.activeProcessorCount * 2)
  static let cancelledResult = Result<[String: Int64]?, any Error>.success(nil)
}
