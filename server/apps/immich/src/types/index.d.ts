declare module 'crypto' {
  namespace webcrypto {
    const subtle: SubtleCrypto;
  }
}