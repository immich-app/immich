package app.alextran.immich.wallpaper

import org.junit.Assert.assertFalse
import org.junit.Test
import java.io.File

class ImmichWallpaperServiceTest {
  @Test
  fun `wallpaper service has no network fetch path`() {
    val source = File("src/main/kotlin/app/alextran/immich/wallpaper/ImmichWallpaperService.kt").readText()

    assertFalse(source.contains("ImmichAPI"))
    assertFalse(source.contains("fetchImage"))
    assertFalse(source.contains("HttpURLConnection"))
  }
}
