//
//  BackgroundSyncAppShortcut.swift
//  Runner
//
//  Created by Encotric on 24/09/2024.
//

import AppIntents


@available(iOS 16.0, *)
struct BackgroundSyncAppShortcut: AppShortcutsProvider {
    
    @AppShortcutsBuilder static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: BackgroundSyncShortcutIntent(), phrases: [
            // TODO: localized title
            "Upload gallery using \(.applicationName)"], systemImageName: "square.and.arrow.up.on.square")
       }
    
}

