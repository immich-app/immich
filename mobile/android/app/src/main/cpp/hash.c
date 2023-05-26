#include <openssl/sha.h>
#include <stdio.h>
#include <openssl/evp.h>

uint8_t* sha1bytes(const uint8_t* data, int64_t len) {
//   sha256_ctx ctx;
//   sha256_init(&ctx);
//   sha256_update(&ctx, data, len);
//   uint8_t buf[SHA256_BLOCK_SIZE];
//   sha256_final(&ctx, buf);
//   char* result = (char*)malloc(1 + 2 * SHA256_BLOCK_SIZE);
//   result[2 * SHA256_BLOCK_SIZE] = 0;
//   char lookup[16] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};
//   for (int i = 0; i < SHA256_BLOCK_SIZE; ++i) {
//     result[2*i] = lookup[buf[i] / 16];
//     result[2*i+1] = lookup[buf[i] % 16];
//   }
//   return result;

    SHA_CTX ctx;
  SHA1_Init(&ctx);
  uint8_t* hash;
  SHA1_Update(&ctx, data, len);

    // do {
    //         len = fread(buffer, 1, BUFSIZ, f);
    //         SHA1_Update(&ctx, buffer, len);
    // } while (len == BUFSIZ);
    hash = malloc(SHA_DIGEST_LENGTH);
    SHA1_Final(hash, &ctx);
    return hash;
}


uint8_t* sha1file(const char* path) {
    SHA_CTX ctx;
    FILE *f;
    size_t len;
  SHA1_Init(&ctx);
  uint8_t buffer[BUFSIZ];
  uint8_t* hash;

  f = fopen(path, "r");
  do {
          len = fread(buffer, 1, BUFSIZ, f);
          SHA1_Update(&ctx, buffer, len);
  } while (len == BUFSIZ);

    hash = malloc(SHA_DIGEST_LENGTH);
    SHA1_Final(hash, &ctx);
    return hash;
}

uint8_t* sha1evp(const char* path) {
	EVP_MD_CTX *mdctx;
      FILE *f;
    size_t len;
  uint8_t buffer[BUFSIZ];
  unsigned char * hash;


	if((mdctx = EVP_MD_CTX_new()) == NULL)
		return NULL;

	if(1 != EVP_DigestInit_ex(mdctx, EVP_sha1(), NULL))
		return NULL;

  f = fopen(path, "r");
  do {
          len = fread(buffer, 1, BUFSIZ, f);
          EVP_DigestUpdate(mdctx, buffer, len);
  } while (len == BUFSIZ);

	if((hash = malloc(EVP_MD_size(EVP_sha1()))) == NULL)
		return NULL;

	if(1 != EVP_DigestFinal(mdctx, hash, NULL))
		return NULL;

	EVP_MD_CTX_free(mdctx);
  return hash;
}

uint8_t* sha1evpBytes(const uint8_t* data, int64_t len) {
	EVP_MD_CTX *mdctx;
  unsigned char * hash;


	if((mdctx = EVP_MD_CTX_new()) == NULL)
		return NULL;

	if(1 != EVP_DigestInit_ex(mdctx, EVP_sha1(), NULL))
		return NULL;

 EVP_DigestUpdate(mdctx, data, len);

	if((hash = malloc(EVP_MD_size(EVP_sha1()))) == NULL)
		return NULL;

	if(1 != EVP_DigestFinal(mdctx, hash, NULL))
		return NULL;

	EVP_MD_CTX_free(mdctx);
  return hash;
}
