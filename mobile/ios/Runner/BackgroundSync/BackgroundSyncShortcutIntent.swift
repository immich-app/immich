//
//  BackgroundSyncShortcutIntent.swift
//  Runner
//
//  Created by Encotric on 24/09/2024.
//

import AppIntents
import SwiftUI

@available(iOS 16.0, *)
struct BackgroundSyncShortcutIntent: AppIntent {

    static var title: LocalizedStringResource = "Sync gallery"
    
    func perform() async throws -> some IntentResult {
        
        let backgroundWorker = BackgroundSyncWorker { _ in () }
        backgroundWorker.run(maxSeconds: nil)

        return .result()
    }
    
}
