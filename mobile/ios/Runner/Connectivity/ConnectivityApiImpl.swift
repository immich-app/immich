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
    
    // Determine if connection is unmetered from the OS metered flags rather than
    // the interface type, so wired ethernet (iPhone USB adapters, Apple Silicon
    // Macs) is treated as unmetered like Wi-Fi:
    // - Not on cellular
    // - Not expensive (also rules out cellular and personal hotspot)
    // - Not constrained (Low Data Mode)
    // Note: VPN over cellular stays metered because the path is still expensive.
    let isOnCellular = path.usesInterfaceType(.cellular)

    if !isOnCellular && !path.isExpensive && !path.isConstrained {
      capabilities.append(.unmetered)
    }
    
    return capabilities
  }
}
