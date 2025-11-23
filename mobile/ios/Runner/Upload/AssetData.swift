import StructuredFieldValues

struct AssetData: StructuredFieldValue {
  static let structuredFieldType: StructuredFieldType = .dictionary

  let deviceAssetId: String
  let deviceId: String
  let fileCreatedAt: String
  let fileModifiedAt: String
  let fileName: String
  let isFavorite: Bool
  let livePhotoVideoId: String?

  static let boundary = "Boundary-\(UUID().uuidString)"
  static let deviceAssetIdField = "--\(boundary)\r\nContent-Disposition: form-data; name=\"deviceAssetId\"\r\n\r\n"
    .data(using: .utf8)!
  static let deviceIdField = "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"deviceId\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileCreatedAtField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"fileCreatedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let fileModifiedAtField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"fileModifiedAt\"\r\n\r\n"
    .data(using: .utf8)!
  static let isFavoriteField = "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"isFavorite\"\r\n\r\n"
    .data(using: .utf8)!
  static let livePhotoVideoIdField =
    "\r\n--\(boundary)\r\nContent-Disposition: form-data; name=\"livePhotoVideoId\"\r\n\r\n"
    .data(using: .utf8)!
  static let trueData = "true".data(using: .utf8)!
  static let falseData = "false".data(using: .utf8)!
  static let footer = "\r\n--\(boundary)--\r\n".data(using: .utf8)!
  static let contentType = "multipart/form-data; boundary=\(boundary)"

  func multipart() -> (Data, Data) {
    var header = Data()
    header.append(Self.deviceAssetIdField)
    header.append(deviceAssetId.data(using: .utf8)!)

    header.append(Self.deviceIdField)
    header.append(deviceId.data(using: .utf8)!)

    header.append(Self.fileCreatedAtField)
    header.append(fileCreatedAt.data(using: .utf8)!)

    header.append(Self.fileModifiedAtField)
    header.append(fileModifiedAt.data(using: .utf8)!)

    header.append(Self.isFavoriteField)
    header.append(isFavorite ? Self.trueData : Self.falseData)

    if let livePhotoVideoId {
      header.append(Self.livePhotoVideoIdField)
      header.append(livePhotoVideoId.data(using: .utf8)!)
    }
    header.append(
      "\r\n--\(Self.boundary)\r\nContent-Disposition: form-data; name=\"assetData\"; filename=\"\(fileName)\"\r\nContent-Type: application/octet-stream\r\n\r\n"
        .data(using: .utf8)!
    )
    return (header, Self.footer)
  }
}
