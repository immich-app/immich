import Network

class ConnectivityApiImpl: ConnectivityApi {
  private let monitor = NWPathMonitor()
  private let queue = DispatchQueue(label: "ConnectivityMonitor")
  private var currentPath: NWPath?
  
  init() {
    monitor.pathUpdateHandler = { [weak self] path in
      self?.currentPath = path
    }
    monitor.start(queue: queue)
    // Get initial state synchronously
    currentPath = monitor.currentPath
  }
  
  deinit {
    monitor.cancel()
  }
  
  func getCapabilities() throws -> [NetworkCapability] {
    guard let path = currentPath else {
      return []
    }
    
    guard path.status == .satisfied else {
      return []
    }
    
    var capabilities: [NetworkCapability] = []
    
    if path.usesInterfaceType(.wifi) {
      capabilities.append(.wifi)
    }
    
    if path.usesInterfaceType(.cellular) {
      capabilities.append(.cellular)
    }
    
    // Check for VPN - iOS reports VPN as .other interface type in many cases
    // or through the path's expensive property when on cellular with VPN
    if path.usesInterfaceType(.other) {
      capabilities.append(.vpn)
    }
    
    // Determine if connection is unmetered:
    // - Must be on WiFi (not cellular)
    // - Must not be expensive (rules out personal hotspot)
    // - Must not be constrained (Low Data Mode)
    // Note: VPN over cellular should still be considered metered
    let isOnCellular = path.usesInterfaceType(.cellular)
    let isOnWifi = path.usesInterfaceType(.wifi)
    
    if isOnWifi && !isOnCellular && !path.isExpensive && !path.isConstrained {
      capabilities.append(.unmetered)
    }
    
    return capabilities
  }
}
