package app.alextran.immich.wallpaper

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DynamicWallpaperRotationTest {
  @Test
  fun `deduplicates asset ids while preserving order`() {
    val ids = DynamicWallpaperRotation.deduplicatePreservingOrder(listOf("b", "a", "b", "", "c", "a"))

    assertEquals(listOf("b", "a", "c"), ids)
  }

  @Test
  fun `rotates to next available asset and loops`() {
    val config = DynamicWallpaperConfig(
      enabled = true,
      assetRefs = DynamicWallpaperRotation.refsFromAssetIds(listOf("a", "b", "c")),
      activeIndex = 2,
      configVersion = kDynamicWallpaperConfigVersion,
    )

    val next = DynamicWallpaperRotation.nextAvailableIndex(config) { assetId -> assetId == "a" }

    assertEquals(0, next)
  }

  @Test
  fun `skips missing asset`() {
    val config = DynamicWallpaperConfig(
      enabled = true,
      assetRefs = DynamicWallpaperRotation.refsFromAssetIds(listOf("a", "b", "c")),
      activeIndex = 0,
      configVersion = kDynamicWallpaperConfigVersion,
    )

    val next = DynamicWallpaperRotation.nextAvailableIndex(config) { assetId -> assetId == "c" }

    assertEquals(2, next)
  }

  @Test
  fun `returns null when no local image is available`() {
    val config = DynamicWallpaperConfig(
      enabled = true,
      assetRefs = DynamicWallpaperRotation.refsFromAssetIds(listOf("a", "b")),
      activeIndex = 0,
      configVersion = kDynamicWallpaperConfigVersion,
    )

    val next = DynamicWallpaperRotation.nextAvailableIndex(config) { false }

    assertNull(next)
  }
}
