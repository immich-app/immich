class ViewIntentApiImpl: ViewIntentHostApi {
  func consumeViewIntent(completion: @escaping (Result<ViewIntentPayload?, any Error>) -> Void) {
    completion(.success(nil))
  }
}
