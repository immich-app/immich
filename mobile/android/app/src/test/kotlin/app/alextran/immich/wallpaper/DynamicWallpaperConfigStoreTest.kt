package app.alextran.immich.wallpaper

import android.content.Context
import com.google.gson.Gson
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class DynamicWallpaperConfigStoreTest {
  private val context: Context = RuntimeEnvironment.getApplication()

  @After
  fun tearDown() {
    context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
    DynamicWallpaperConfigStore.preparedDirectory(context).deleteRecursively()
  }

  @Test
  fun `writes and reads dedicated config`() {
    DynamicWallpaperConfigStore.writeSelection(
      context,
      listOf(
        DynamicWallpaperAssetRef(remoteId = "a", localId = "local-a", isEdited = false),
        DynamicWallpaperAssetRef(remoteId = "b", localId = null, isEdited = true),
        DynamicWallpaperAssetRef(remoteId = "a", localId = "duplicate", isEdited = true),
      ),
    )
    DynamicWallpaperConfigStore.writeActiveIndex(context, 1)

    val config = DynamicWallpaperConfigStore.read(context)

    assertTrue(config.enabled)
    assertEquals(listOf("a", "b"), config.assetIds)
    assertEquals("local-a", config.assetRefs[0].localId)
    assertFalse(config.assetRefs[0].isEdited)
    assertEquals(null, config.assetRefs[1].localId)
    assertTrue(config.assetRefs[1].isEdited)
    assertEquals(1, config.activeIndex)
    assertEquals(kDynamicWallpaperConfigVersion, config.configVersion)
  }

  @Test
  fun `migrates old config version and clamps active index`() {
    context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE)
      .edit()
      .putBoolean("enabled", true)
      .putString("assetIds", Gson().toJson(listOf("a", "b")))
      .putInt("activeIndex", 9)
      .putInt("configVersion", 1)
      .commit()

    val config = DynamicWallpaperConfigStore.read(context)

    assertEquals(kDynamicWallpaperConfigVersion, config.configVersion)
    assertEquals(
      listOf(
        DynamicWallpaperAssetRef(remoteId = "a", localId = null, isEdited = false),
        DynamicWallpaperAssetRef(remoteId = "b", localId = null, isEdited = false),
      ),
      config.assetRefs,
    )
    assertEquals(1, config.activeIndex)
    assertEquals(kDynamicWallpaperConfigVersion, context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE).getInt("configVersion", 0))
  }

  @Test
  fun `clears prepared cache when migrating to a new config version`() {
    context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE)
      .edit()
      .putBoolean("enabled", true)
      .putString("assetRefs", Gson().toJson(listOf(mapOf("remoteId" to "a"))))
      .putString("assetIds", Gson().toJson(listOf("a")))
      .putInt("configVersion", kDynamicWallpaperConfigVersion - 1)
      .commit()
    DynamicWallpaperConfigStore.preparedFile(context, "a").writeText("stale")

    DynamicWallpaperConfigStore.read(context)

    assertFalse(DynamicWallpaperConfigStore.hasPreparedFile(context, "a"))
  }

  @Test
  fun `can refresh refs without resetting active index`() {
    DynamicWallpaperConfigStore.writeSelection(context, DynamicWallpaperRotation.refsFromAssetIds(listOf("a", "b", "c")))
    DynamicWallpaperConfigStore.writeActiveIndex(context, 2)

    DynamicWallpaperConfigStore.writeSelection(
      context,
      listOf(
        DynamicWallpaperAssetRef(remoteId = "a", localId = "local-a", isEdited = false),
        DynamicWallpaperAssetRef(remoteId = "b", localId = null, isEdited = false),
        DynamicWallpaperAssetRef(remoteId = "c", localId = "local-c", isEdited = false),
      ),
      resetActiveIndex = false,
    )

    val config = DynamicWallpaperConfigStore.read(context)

    assertEquals(2, config.activeIndex)
    assertEquals("local-c", config.assetRefs[2].localId)
  }

  @Test
  fun `reports missing and available local files`() {
    DynamicWallpaperConfigStore.writeSelection(context, DynamicWallpaperRotation.refsFromAssetIds(listOf("a", "b")))
    DynamicWallpaperConfigStore.preparedFile(context, "a").writeText("prepared")

    val status = DynamicWallpaperConfigStore.status(context)

    assertEquals(2, status.selectedCount)
    assertEquals(1, status.preparedCount)
    assertEquals(1, status.missingCount)
    assertFalse(DynamicWallpaperConfigStore.hasPreparedFile(context, "b"))
  }
}
