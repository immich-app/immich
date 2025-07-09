package app.alextran.immich.certificates

import android.content.Context

import java.security.KeyStore
import java.security.cert.X509Certificate
import java.util.Base64


class UserCertificatesApiImpl(context: Context) : UserCertificatesApi {
  override fun getUserPemCertificatesByName(callback: (Result<Map<String, String>>) -> Unit) {
    // Code for fetching user certificates vendorered from
    // <https://github.com/johnstef99/flutter_user_certificates_android/>
    val userInstalledCaCertificates: List<X509Certificate> = try {
      val keyStore = KeyStore.getInstance("AndroidCAStore")
      keyStore.load(null, null)
      val aliasList = keyStore.aliases().toList().filter { it.startsWith("user") }
      aliasList.map { keyStore.getCertificate(it) as X509Certificate }
    } catch (e: Exception) {
      emptyList()
    }

    val mapOfBytes = userInstalledCaCertificates.associate { it.issuerX500Principal.name to toPem(it) }
    callback(Result.success(mapOfBytes))
  }

  private fun toPem(cert: X509Certificate): String {
    val out = StringBuilder();
    val encoder = Base64.getMimeEncoder(64, "\n".toByteArray())
    out.appendLine("-----BEGIN CERTIFICATE-----")
    out.appendLine(encoder.encodeToString(cert.encoded))
    out.appendLine("-----END CERTIFICATE-----")
    return out.toString();
  }
}
