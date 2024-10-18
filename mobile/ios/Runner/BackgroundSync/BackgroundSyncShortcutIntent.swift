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

    // TODO: localized title and description
    static var title: LocalizedStringResource = "Sync gallery"

    static var openAppWhenRun: Bool = true

    static var isDiscoverable: Bool = true
    
    func perform() async throws -> some IntentResult {
        
        let backgroundWorker = BackgroundSyncWorker { _ in () }
        backgroundWorker.run(maxSeconds: nil)

        return .result()
    }
    
}
