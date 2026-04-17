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
}
