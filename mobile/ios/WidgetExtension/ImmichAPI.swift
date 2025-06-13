
import Foundation
import WidgetKit
import SwiftUI

enum WidgetError {
  case noLogin
  case fetchFailed
  case unknown
}

struct SearchResult: Codable {
  let id: String
  let type: String
}

struct SearchRequest: Codable {
  var type: String = "IMAGE"
  let size: Int
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

struct ServerConfig {
  let serverEndpoint: String
  let sessionKey: String
}

func buildRequestURL(serverConfig: ServerConfig, endpoint: String, params: [URLQueryItem] = []) -> URL? {
  guard let baseURL = URL(string: serverConfig.serverEndpoint) else {
      fatalError("Invalid base URL")
  }

  // Combine the base URL and API path
  let fullPath = baseURL.appendingPathComponent(endpoint.trimmingCharacters(in: CharacterSet(charactersIn: "/")))

  // Add the session key as a query parameter
  var components = URLComponents(url: fullPath, resolvingAgainstBaseURL: false)
  components?.queryItems = [
    URLQueryItem(name: "sessionKey", value: serverConfig.sessionKey)
  ]
  components?.queryItems?.append(contentsOf: params)

  return components?.url
}

func fetchSearchResults(serverConfig: ServerConfig, searchRequest: SearchRequest) async throws -> [SearchResult] {
  // get URL
  guard let searchURL = buildRequestURL(serverConfig: serverConfig, endpoint: "/search/random") else {
    throw URLError(.badURL)
  }
  
  var request = URLRequest(url: searchURL)
  request.httpMethod = "POST"
  request.httpBody = try JSONEncoder().encode(searchRequest);
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  
  
  let (data, _) = try await URLSession.shared.data(for: request)
      
  // decode data
  return try JSONDecoder().decode([SearchResult].self, from: data)
}

func fetchMemory(serverConfig: ServerConfig, for date: Date) async throws -> [MemoryResult] {
  // get URL
  let memoryParams = [URLQueryItem(name: "for", value: date.ISO8601Format())]
  guard let searchURL = buildRequestURL(serverConfig: serverConfig, endpoint: "/memories", params: memoryParams) else {
    throw URLError(.badURL)
  }
  
  var request = URLRequest(url: searchURL)
  request.httpMethod = "GET"
  
  let (data, _) = try await URLSession.shared.data(for: request)
      
  // decode data
  return try JSONDecoder().decode([MemoryResult].self, from: data)
}

func fetchImage(serverConfig: ServerConfig, asset: SearchResult) async throws -> UIImage {
  let thumbnailParams = [URLQueryItem(name: "size", value: "thumbnail")]
  let assetEndpoint = "/assets/" + asset.id + "/thumbnail"
  
  guard let fetchURL = buildRequestURL(serverConfig: serverConfig, endpoint: assetEndpoint, params: thumbnailParams) else {
    throw URLError(.badURL)
  }
          
  let (data, _) = try await URLSession.shared.data(from: fetchURL);
  
  guard let img = UIImage(data: data) else {
    throw URLError(.badServerResponse)
  }
  
  return img
}

func getServerConfig() -> ServerConfig? {
  // first grab search results
  guard let defaults = UserDefaults(suiteName: "group.bwees.immich"),
        let serverURL = defaults.string(forKey: "widget_server_url"),
        let sessionKey = defaults.string(forKey: "widget_auth_token")
  else {
    return nil
  }
  
  if (serverURL == "" || sessionKey == "") {
    return nil
  }
  
  return ServerConfig(serverEndpoint: serverURL, sessionKey: sessionKey)
}


