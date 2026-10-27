// Package jwtutil implements a minimal HS256 JWT (sign/parse) without external
// dependencies — small attack surface & zero extra RAM on the SBC.
package jwtutil

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

// ErrExpired signals a token past its "exp" claim.
var ErrExpired = errors.New("jwt expired")

// Claims is the payload we embed (matches what our login handler issues).
type Claims struct {
	UserID  string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	IsAdmin bool   `json:"isAdmin"`
	Issued  int64  `json:"iat"`
	Expiry  int64  `json:"exp"`
}

// Sign produces a compact HS256 JWT valid until time.Now()+lifetime.
func Sign(secret []byte, c Claims, lifetime time.Duration) (string, error) {
	c.Issued = time.Now().Unix()
	c.Expiry = time.Now().Add(lifetime).Unix()

	header := base64URL([]byte(`{"alg":"HS256","typ":"JWT"}`))
	payload, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	signingInput := header + "." + base64URL(payload)
	sig := sign(secret, signingInput)
	return signingInput + "." + base64URL(sig), nil
}

// Parse verifies signature & expiry, returning the claims on success.
func Parse(secret []byte, token string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token")
	}
	signingInput := parts[0] + "." + parts[1]
	wantSig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, errors.New("malformed signature")
	}
	if !hmac.Equal(wantSig, sign(secret, signingInput)) {
		return nil, errors.New("bad signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("malformed payload")
	}
	var c Claims
	if err := json.Unmarshal(payload, &c); err != nil {
		return nil, errors.New("malformed claims")
	}
	if time.Now().Unix() >= c.Expiry {
		return nil, ErrExpired
	}
	return &c, nil
}

func sign(secret []byte, input string) []byte {
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(input))
	return m.Sum(nil)
}

func base64URL(b []byte) string {
	return base64.RawURLEncoding.EncodeToString(b)
}
