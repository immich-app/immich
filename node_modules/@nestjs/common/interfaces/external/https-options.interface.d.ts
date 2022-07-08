/**
 * Interface describing Https Options that can be set.
 *
 * @see https://nodejs.org/api/tls.html
 *
 * @publicApi
 */
export interface HttpsOptions {
    /**
     * PFX or PKCS12 encoded private key and certificate chain. pfx is an alternative
     * to providing key and cert individually. PFX is usually encrypted, if it is,
     * passphrase will be used to decrypt it. Multiple PFX can be provided either
     * as an array of unencrypted PFX buffers, or an array of objects in the form
     * {buf: <string|buffer>[, passphrase: <string>]}. The object form can only
     * occur in an array. object.passphrase is optional. Encrypted PFX will be decrypted
     * with object.passphrase if provided, or options.passphrase if it is not.
     */
    pfx?: any;
    /**
     * Private keys in PEM format. PEM allows the option of private keys being encrypted.
     * Encrypted keys will be decrypted with options.passphrase. Multiple keys using
     * different algorithms can be provided either as an array of unencrypted key
     * strings or buffers, or an array of objects in the form {pem: <string|buffer>[, passphrase: <string>]}.
     * The object form can only occur in an array. object.passphrase is optional.
     * Encrypted keys will be decrypted with object.passphrase if provided, or options.passphrase
     * if it is not
     */
    key?: any;
    /**
     * Shared passphrase used for a single private key and/or a PFX.
     */
    passphrase?: string;
    /**
     * Cert chains in PEM format. One cert chain should be provided per private key.
     * Each cert chain should consist of the PEM formatted certificate for a provided
     * private key, followed by the PEM formatted intermediate certificates (if any),
     * in order, and not including the root CA (the root CA must be pre-known to the
     * peer, see ca). When providing multiple cert chains, they do not have to be
     * in the same order as their private keys in key. If the intermediate certificates
     * are not provided, the peer will not be able to validate the certificate, and
     * the handshake will fail.
     */
    cert?: any;
    /**
     * Optionally override the trusted CA certificates. Default is to trust the well-known
     * CAs curated by Mozilla. Mozilla's CAs are completely replaced when CAs are
     * explicitly specified using this option. The value can be a string or Buffer,
     * or an Array of strings and/or Buffers. Any string or Buffer can contain multiple
     * PEM CAs concatenated together. The peer's certificate must be chainable to
     * a CA trusted by the server for the connection to be authenticated. When using
     * certificates that are not chainable to a well-known CA, the certificate's CA
     * must be explicitly specified as a trusted or the connection will fail to authenticate.
     * If the peer uses a certificate that doesn't match or chain to one of the default
     * CAs, use the ca option to provide a CA certificate that the peer's certificate
     * can match or chain to. For self-signed certificates, the certificate is its
     * own CA, and must be provided. For PEM encoded certificates, supported types
     * are "TRUSTED CERTIFICATE", "X509 CERTIFICATE", and "CERTIFICATE". See also tls.rootCertificates.
     */
    ca?: any;
    /**
     * PEM formatted CRLs (Certificate Revocation Lists).
     */
    crl?: any;
    /**
     * Cipher suite specification, replacing the default. For more information, see
     * modifying the default cipher suite. Permitted ciphers can be obtained via tls.getCiphers().
     * Cipher names must be uppercased in order for OpenSSL to accept them.
     */
    ciphers?: string;
    /**
     * Attempt to use the server's cipher suite preferences instead of the client's.
     * When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be set in secureOptions,
     * see OpenSSL Options for more information.
     */
    honorCipherOrder?: boolean;
    /**
     * If true the server will request a certificate from clients that connect and
     * attempt to verify that certificate. Default: false.
     */
    requestCert?: boolean;
    /**
     * If not false the server will reject any connection which is not authorized
     * with the list of supplied CAs. This option only has an effect if requestCert is true. Default: true
     */
    rejectUnauthorized?: boolean;
    /**
     * An array or Buffer of possible NPN protocols. (Protocols should be ordered
     * by their priority).
     */
    NPNProtocols?: any;
    /**
     * A function that will be called if the client supports SNI TLS extension. Two
     * arguments will be passed when called: servername and cb. SNICallback should
     * invoke cb(null, ctx), where ctx is a SecureContext instance. (tls.createSecureContext(...)
     * can be used to get a proper SecureContext.) If SNICallback wasn't provided
     * the default callback with high-level API will be used.
     */
    SNICallback?: (servername: string, cb: (err: Error, ctx: any) => any) => any;
}
