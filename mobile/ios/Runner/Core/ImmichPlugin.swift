func dispatch<T>(
  qos: DispatchQoS.QoSClass = .default,
    completion: @escaping (Result<T, Error>) -> Void,
    block: @escaping () throws -> T
) {
  DispatchQueue.global(qos: qos).async {
    completion(Result { try block() })
  }
}
