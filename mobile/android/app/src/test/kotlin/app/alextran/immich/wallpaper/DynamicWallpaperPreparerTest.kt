package app.alextran.immich.wallpaper

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.IOException
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class DynamicWallpaperPreparerTest {
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
  fun `prefers local original when a non-edited asset has a local id`() = runBlocking {
    var localCalls = 0
    var remoteCalls = 0
    val asset = DynamicWallpaperAssetRef(remoteId = "remote-a", localId = "123", isEdited = false)
    val preparer = DynamicWallpaperPreparer(
      context,
      remoteBitmapLoader = { _, _, _ ->
        remoteCalls++
        bitmap()
      },
      localBitmapLoader = { _, _, _ ->
        localCalls++
        bitmap()
      },
    )
    DynamicWallpaperConfigStore.writeSelection(context, listOf(asset))

    val status = preparer.prepare(listOf(asset), force = true)

    assertEquals(1, localCalls)
    assertEquals(0, remoteCalls)
    assertEquals(1, status.preparedCount)
    assertTrue(DynamicWallpaperConfigStore.hasPreparedFile(context, "remote-a"))
  }

  @Test
  fun `falls back to remote original when local original cannot be loaded`() = runBlocking {
    var localCalls = 0
    var remoteCalls = 0
    val asset = DynamicWallpaperAssetRef(remoteId = "remote-a", localId = "123", isEdited = false)
    val preparer = DynamicWallpaperPreparer(
      context,
      remoteBitmapLoader = { _, _, _ ->
        remoteCalls++
        bitmap()
      },
      localBitmapLoader = { _, _, _ ->
        localCalls++
        throw IOException("local missing")
      },
    )
    DynamicWallpaperConfigStore.writeSelection(context, listOf(asset))

    val status = preparer.prepare(listOf(asset), force = true)

    assertEquals(1, localCalls)
    assertEquals(1, remoteCalls)
    assertEquals(1, status.preparedCount)
    assertTrue(DynamicWallpaperConfigStore.hasPreparedFile(context, "remote-a"))
  }

  @Test
  fun `skips local original for edited assets`() = runBlocking {
    var localCalls = 0
    var remoteCalls = 0
    val asset = DynamicWallpaperAssetRef(remoteId = "remote-a", localId = "123", isEdited = true)
    val preparer = DynamicWallpaperPreparer(
      context,
      remoteBitmapLoader = { _, _, _ ->
        remoteCalls++
        bitmap()
      },
      localBitmapLoader = { _, _, _ ->
        localCalls++
        bitmap()
      },
    )
    DynamicWallpaperConfigStore.writeSelection(context, listOf(asset))

    val status = preparer.prepare(listOf(asset), force = true)

    assertEquals(0, localCalls)
    assertEquals(1, remoteCalls)
    assertEquals(1, status.preparedCount)
    assertTrue(DynamicWallpaperConfigStore.hasPreparedFile(context, "remote-a"))
  }

  @Test
  fun `applies rotation and crop to prepared bitmap`() = runBlocking {
    val asset = DynamicWallpaperAssetRef(
      remoteId = "remote-a",
      localId = null,
      isEdited = false,
      layout = DynamicWallpaperAssetLayout(
        rotationDegrees = 90L,
        cropLeft = 0.0,
        cropTop = 0.0,
        cropRight = 1.0,
        cropBottom = 0.5,
      ),
    )
    val preparer = DynamicWallpaperPreparer(
      context,
      remoteBitmapLoader = { _, _, _ -> Bitmap.createBitmap(4, 2, Bitmap.Config.ARGB_8888) },
    )
    DynamicWallpaperConfigStore.writeSelection(context, listOf(asset))

    preparer.prepare(listOf(asset), force = true)

    val prepared = BitmapFactory.decodeFile(DynamicWallpaperConfigStore.preparedFile(context, "remote-a").absolutePath)
    assertEquals(2, prepared.width)
    assertEquals(2, prepared.height)
    prepared.recycle()
  }

  @Test
  fun `prepares only forced asset when missing preparation is disabled`() = runBlocking {
    val assetA = DynamicWallpaperAssetRef(remoteId = "remote-a", localId = null, isEdited = false)
    val assetB = DynamicWallpaperAssetRef(remoteId = "remote-b", localId = null, isEdited = false)
    val prepared = mutableListOf<String>()
    val preparer = DynamicWallpaperPreparer(
      context,
      remoteBitmapLoader = { remoteId, _, _ ->
        prepared.add(remoteId)
        bitmap()
      },
    )
    DynamicWallpaperConfigStore.writeSelection(context, listOf(assetA, assetB))

    preparer.prepare(listOf(assetA, assetB), force = false, forcePrepareIds = setOf("remote-b"), prepareMissing = false)

    assertEquals(listOf("remote-b"), prepared)
    assertTrue(DynamicWallpaperConfigStore.hasPreparedFile(context, "remote-b"))
  }

  private fun bitmap(): Bitmap {
    return Bitmap.createBitmap(32, 32, Bitmap.Config.ARGB_8888)
  }
}
