import Foundation
import SwiftUI
import WidgetKit

enum WidgetError: Error {
  case noLogin
  case fetchFailed
  case unknown
  case albumNotFound
  case unableToResize
}

enum AssetType: String, Codable {
  case image = "IMAGE"
  case video = "VIDEO"
  case audio = "AUDIO"
  case other = "OTHER"
}

struct ServerWellKnown: Codable {
  struct APIInfo: Codable{
    let endpoint: String
  }
  
  let api: APIInfo
}

struct SearchResult: Codable {
  let id: String
  let type: AssetType
}

struct SearchFilters: Codable {
  var type: AssetType = .image
  let size: Int
  var albumIds: [String] = []
}

struct MemoryResult: Codable {
  let id: String
  var assets: [SearchResult]
  let type: String

  struct MemoryData: Codable {
    let year: Int
  }

  let data: MemoryData
}

struct Album: Codable {
  let id: String
  let albumName: String
}

// MARK: API

class ImmichAPI {
  struct ServerConfig {
    let serverEndpoint: String
    let sessionKey: String
  }
  let serverConfig: ServerConfig

  init() async throws {
    // fetch the credentials from the UserDefaults store that dart placed here
    guard let defaults = UserDefaults(suiteName: "group.app.immich.share"),
      var serverURL = defaults.string(forKey: "widget_server_url"),
      let sessionKey = defaults.string(forKey: "widget_auth_token")
    else {
      throw WidgetError.noLogin
    }

    if serverURL == "" || sessionKey == "" {
      throw WidgetError.noLogin
    }
        
    // migrate the server list value to a JSON array if it is not already
    if !serverURL.starts(with: "[") {
      let newServerList = "[\"\(serverURL)\"]"
      defaults.set(newServerList, forKey: "widget_server_url")
      serverURL = newServerList
    }
        
    guard let urls = try? JSONDecoder().decode([String].self, from: serverURL.data(using: .utf8)!) else {
      throw WidgetError.noLogin
    }
    
    for url in urls {
      guard let endpointURL = URL(string: url) else { continue }
      
      if let apiURL = await Self.validateServer(at: endpointURL) {
        serverConfig = ServerConfig(
          serverEndpoint: apiURL.absoluteString,
          sessionKey: sessionKey
        )
        return
      }
    }
    
    throw WidgetError.fetchFailed
  }

  private static func validateServer(at endpointURL: URL) async -> URL? {
    // build a URL that is only scheme, host, and port
    var components = URLComponents()
    components.scheme = endpointURL.scheme
    components.host = endpointURL.host
    components.port = endpointURL.port

    guard let baseURL = components.url else { return nil }
    
    var pingURL = baseURL
    pingURL.appendPathComponent(".well-known")
    pingURL.appendPathComponent("immich")
    
    guard let (serverPingJSON, _) = try? await URLSession.shared.data(from: pingURL) else { return nil }
    guard let apiInfo = try? JSONDecoder().decode(ServerWellKnown.self, from: serverPingJSON) else {  return nil }
    
    var apiURL = baseURL
    apiURL.appendPathComponent(apiInfo.api.endpoint)
    
    return apiURL
  }
  
  private func buildRequestURL(
    serverConfig: ServerConfig,
    endpoint: String,
    params: [URLQueryItem] = []
  ) -> URL? {
    guard let baseURL = URL(string: serverConfig.serverEndpoint) else {
      fatalError("Invalid base URL")
    }

    // Combine the base URL and API path
    let fullPath = baseURL.appendingPathComponent(
      endpoint.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    )

    // Add the session key as a query parameter
    var components = URLComponents(
      url: fullPath,
      resolvingAgainstBaseURL: false
    )
    components?.queryItems = [
      URLQueryItem(name: "sessionKey", value: serverConfig.sessionKey)
    ]
    components?.queryItems?.append(contentsOf: params)

    return components?.url
  }

  func fetchSearchResults(with filters: SearchFilters) async throws
    -> [SearchResult]
  {
    // get URL
    guard
      let searchURL = buildRequestURL(
        serverConfig: serverConfig,
        endpoint: "/search/random"
      )
    else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: searchURL)
    request.httpMethod = "POST"
    request.httpBody = try JSONEncoder().encode(filters)
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let (data, _) = try await URLSession.shared.data(for: request)

    // decode data
    return try JSONDecoder().decode([SearchResult].self, from: data)
  }

  func fetchMemory(for date: Date) async throws -> [MemoryResult] {
    // get URL
    let memoryParams = [URLQueryItem(name: "for", value: date.ISO8601Format())]
    guard
      let searchURL = buildRequestURL(
        serverConfig: serverConfig,
        endpoint: "/memories",
        params: memoryParams
      )
    else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: searchURL)
    request.httpMethod = "GET"

    let (data, _) = try await URLSession.shared.data(for: request)

    // decode data
    return try JSONDecoder().decode([MemoryResult].self, from: data)
  }

  func fetchImage(asset: SearchResult) async throws -> UIImage {
    let thumbnailParams = [URLQueryItem(name: "size", value: "preview")]
    let assetEndpoint = "/assets/" + asset.id + "/thumbnail"

    guard
      let fetchURL = buildRequestURL(
        serverConfig: serverConfig,
        endpoint: assetEndpoint,
        params: thumbnailParams
      )
    else {
      throw URLError(.badURL)
    }

    let (data, _) = try await URLSession.shared.data(from: fetchURL)

    guard let img = UIImage(data: data) else {
      throw URLError(.badServerResponse)
    }

    return img
  }

  func fetchAlbums() async throws -> [Album] {
    // get URL
    guard
      let searchURL = buildRequestURL(
        serverConfig: serverConfig,
        endpoint: "/albums"
      )
    else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: searchURL)
    request.httpMethod = "GET"

    let (data, _) = try await URLSession.shared.data(for: request)

    // decode data
    return try JSONDecoder().decode([Album].self, from: data)
  }
}

// We need a shared cache for albums to efficiently handle the album picker queries
actor AlbumCache {
  static let shared = AlbumCache()

  private var api: ImmichAPI? = nil
  private var albums: [Album]? = nil

  func getAlbums(refresh: Bool = false) async throws -> [Album] {
    // Check the API before we try to show cached albums
    // Sometimes iOS caches this object and keeps it around
    // even after nuking the timeline

    api = try? await ImmichAPI()

    guard api != nil else {
      throw WidgetError.noLogin
    }

    if let albums, !refresh {
      return albums
    }

    let fetched = try await api!.fetchAlbums()
    albums = fetched
    return fetched
  }
}
