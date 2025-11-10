import Network

class NetworkMonitor {
  static let shared = NetworkMonitor()
  private let monitor = NWPathMonitor()
  private(set) var isConnected = false
  private(set) var isExpensive = false

  private init() {
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self else { return }
      let wasConnected = self.isConnected
      self.isConnected = path.status == .satisfied
      self.isExpensive = path.isExpensive

      if !wasConnected && self.isConnected {
        NotificationCenter.default.post(name: .networkDidConnect, object: nil)
      }
    }
    monitor.start(queue: .global(qos: .utility))
  }
}
