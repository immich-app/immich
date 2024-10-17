import CryptoKit

class ImHostServiceImpl: ImHostService {
    func digestFiles(paths: [String], completion: @escaping (Result<[FlutterStandardTypedData?], Error>) -> Void) {
        let bufsize = 2 * 1024 * 1024
        
        // Compute hash in background thread
        DispatchQueue.global(qos: .background).async {
            let hashes = paths.map { path -> FlutterStandardTypedData? in
                do {
                    guard let file = FileHandle(forReadingAtPath: path) else {
                        throw NSError(domain: "ImHostServiceImpl", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot Open File Handle"])
                    }
                    defer { file.closeFile() }
                    
                    var hasher = Insecure.SHA1()
                    while autoreleasepool(invoking: {
                        let chunk = file.readData(ofLength: bufsize)
                        guard !chunk.isEmpty else { return false } // EOF
                        hasher.update(data: chunk)
                        return true // continue
                    }) { }
                    
                    let digest = hasher.finalize()
                    return FlutterStandardTypedData(bytes: Data(digest))
                } catch {
                    print("Cannot calculate the digest of the file \(path) due to \(error.localizedDescription)")
                    return nil
                }
            }
            
            // Return result in main thread
            DispatchQueue.main.async {
                completion(.success(hashes))
            }
        }
    }
}
