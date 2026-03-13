# Shared Spaces — Mobile Integration Test Plan

Manual test cases for shared spaces on mobile. To be automated once the integration test framework is in place.

## Spaces List Page

1. **View spaces** — Library tab → Spaces shows list with names, descriptions, asset counts, member counts
2. **Create space** — FAB (+) → enter name + optional description → Create. New space appears in list
3. **Pull to refresh** — Pull down on list to refresh spaces
4. **Navigate to detail** — Tap a space → opens detail page. When returning, list refreshes

## Space Detail Page

5. **View photos** — Shows space assets in Timeline grid
6. **Empty state** — Space with no photos shows "No photos yet" + Add Photos button (if editor/owner)
7. **Add photos** — Tap camera+ icon (editor/owner only) → asset selection → photos added, toast shown
8. **Remove photos** — Long-press photos → bottom sheet → "Remove from Space" button
9. **Toggle timeline visibility** — Tap eye icon → toggles "show in timeline" with toast confirmation
10. **Delete space** — Owner sees menu → Delete Space → confirmation dialog → deletes & navigates back
11. **Members button** — Tap people icon → navigates to members page

## Space Members Page

12. **View members** — Shows list with name, email, role chip (owner/editor/viewer)
13. **Add members** — Owner sees + icon → navigates to member selection
14. **Change role** — Owner taps non-owner member → bottom sheet → Set as Editor/Viewer
15. **Remove member** — Owner taps non-owner → bottom sheet → Remove from Space (with confirmation)
16. **Leave space** — Non-owner taps own entry → Leave Space (with confirmation, navigates back)

## Member Selection Page

17. **Select users** — Shows all server users (minus current user, minus existing members). Tap to select, chip appears above list
18. **Add selected** — Tap "Add" → adds selected users as members → toast + navigates back

## Role-Based UI Gating

19. **Owner** — Sees: add photos, delete space, manage members (add/remove/change roles), timeline toggle
20. **Editor** — Sees: add photos, timeline toggle. No delete, no member management
21. **Viewer** — Sees: timeline toggle only. No add photos, no delete, no member management
