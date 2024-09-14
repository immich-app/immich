import CryptoKit

class ImmichHostServiceImpl: ImmichHostService {
    func digestFiles(paths: [String], completion: @escaping (Result<[FlutterStandardTypedData?]?, Error>) -> Void) {
        let bufsize = 2 * 1024 * 1024
        // Private error to throw if file cannot be read
        enum DigestError: String, LocalizedError {
            case NoFileHandle = "Cannot Open File Handle"

            public var errorDescription: String? { self.rawValue }
        }
        
        // Compute hash in background thread
        DispatchQueue.global(qos: .background).async {
            var hashes: [FlutterStandardTypedData?] = Array(repeating: nil, count: paths.count)
            for i in (0 ..< paths.count) {
                do {
                    guard let file = FileHandle(forReadingAtPath: paths[i]) else { throw DigestError.NoFileHandle }
                    var hasher = Insecure.SHA1.init();
                    while autoreleasepool(invoking: {
                        let chunk = file.readData(ofLength: bufsize)
                        guard !chunk.isEmpty else { return false } // EOF
                        hasher.update(data: chunk)
                        return true // continue
                    }) { }
                    let digest = hasher.finalize()
                    hashes[i] = FlutterStandardTypedData(bytes: Data(Array(digest.makeIterator())))
                } catch {
                    print("Cannot calculate the digest of the file \(paths[i]) due to \(error.localizedDescription)")
                }
            }
            
            // Return result in main thread
            DispatchQueue.main.async {
                completion(.success(Array(hashes)))
            }
        }
    }
}
