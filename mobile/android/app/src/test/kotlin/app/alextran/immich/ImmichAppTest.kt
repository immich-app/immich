package app.alextran.immich

import okhttp3.Cookie
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
// Omit manifest providers so Application startup must initialize OkHttp itself.
@Config(application = ImmichApp::class, manifest = Config.NONE, sdk = [35])
class ImmichAppTest {
  @Test
  fun cookieDomainValidationWorksWithoutStartupProvider() {
    val url = "https://photos.example.co.uk/".toHttpUrl()

    val cookie = Cookie.parse(url, "session=test; Domain=example.co.uk; Path=/; Secure")
    assertNotNull(cookie)
    assertEquals("example.co.uk", cookie!!.domain)

    // Public suffixes must still be rejected, not bypassed to avoid the crash.
    assertNull(Cookie.parse(url, "session=test; Domain=co.uk; Path=/; Secure"))
  }
}
