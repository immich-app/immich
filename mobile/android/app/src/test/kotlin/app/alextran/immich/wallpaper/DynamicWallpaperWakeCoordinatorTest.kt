package app.alextran.immich.wallpaper

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DynamicWallpaperWakeCoordinatorTest {
  @Test
  fun `screen wake without visible wallpaper waits until wallpaper becomes visible`() {
    val coordinator = DynamicWallpaperWakeCoordinator()

    assertFalse(coordinator.onWakeSignal(hasVisibleWallpaper = false, nowElapsed = 1_000L))
    assertTrue(coordinator.onWallpaperVisible(nowElapsed = 1_100L))
  }

  @Test
  fun `screen wake and user present within debounce rotate once`() {
    val coordinator = DynamicWallpaperWakeCoordinator()

    assertTrue(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 1_000L))
    assertFalse(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 1_100L))
  }

  @Test
  fun `screen wake and user present after debounce still rotate once per wake cycle`() {
    val coordinator = DynamicWallpaperWakeCoordinator()

    assertTrue(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 1_000L))
    assertFalse(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 2_500L))
  }

  @Test
  fun `screen off resets wake cycle`() {
    val coordinator = DynamicWallpaperWakeCoordinator()

    assertTrue(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 1_000L))
    coordinator.onScreenOff()
    assertTrue(coordinator.onWakeSignal(hasVisibleWallpaper = true, nowElapsed = 2_500L))
  }

  @Test
  fun `wallpaper visibility without wake signal does not rotate`() {
    val coordinator = DynamicWallpaperWakeCoordinator()

    assertFalse(coordinator.onWallpaperVisible(nowElapsed = 1_000L))
  }
}
