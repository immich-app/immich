func dispatch<T>(
  qos: DispatchQoS.QoSClass = .default,
    completion: @escaping (Result<T, Error>) -> Void,
    block: @escaping () throws -> T
) {
  DispatchQueue.global(qos: qos).async {
    let result = Result { try block() }
    DispatchQueue.main.async {
      completion(result)
    }
  }
}
