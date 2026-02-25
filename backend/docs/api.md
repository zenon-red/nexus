# API Reference

## Endpoints

### Health Check

```http
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "kv": "connected",
  "version": "1.0.0"
}
```

---

### OIDC Discovery

```http
GET /.well-known/openid-configuration
```

Returns OpenID Connect discovery document.

**Response:**
```json
{
  "issuer": "https://oidc.zenon.red",
  "wallet_challenge_endpoint": "https://oidc.zenon.red/auth/challenge",
  "token_endpoint": "https://oidc.zenon.red/auth/token",
  "jwks_uri": "https://oidc.zenon.red/.well-known/jwks.json",
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["ES256"],
  "grant_types_supported": ["urn:zenon:params:oauth:grant-type:wallet_signature"]
}
```

Note: This server currently exposes a wallet-signature exchange flow for machine clients and does not provide a browser `authorization_endpoint` yet.

---

### JWKS

```http
GET /.well-known/jwks.json
```

Returns JSON Web Key Set for JWT verification.

**Response:**
```json
{
  "keys": [{
    "kty": "EC",
    "kid": "key-id-1",
    "use": "sig",
    "alg": "ES256",
    "crv": "P-256",
    "x": "...",
    "y": "..."
  }]
}
```

---

### Create Challenge

```http
POST /auth/challenge
Content-Type: application/json

{
  "address": "z1q..."
}
```

Generates a challenge nonce for wallet authentication.

**Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Zenon address (z1...) |

**Response:**
```json
{
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "challenge": "Sign to authenticate with https://oidc.zenon.red: 550e8400-...",
  "expires_at": 1234567890
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | `invalid_json`, `invalid_request`, `invalid_address` |
| 429 | `rate_limited` - Too many requests |

---

### Exchange Token

```http
POST /auth/token
Content-Type: application/json

{
  "address": "z1q...",
  "public_key": "32-byte hex string",
  "signature": "64-byte hex string",
  "nonce": "uuid from challenge"
}
```

Exchanges a signed challenge for a JWT.

**Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Zenon address |
| `public_key` | string | 32-byte Ed25519 public key (hex) |
| `signature` | string | 64-byte Ed25519 signature (hex) |
| `nonce` | string | UUID from challenge response |

**Response:**
```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1pZC0xIn0...",
  "id_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1pZC0xIn0...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "scope": "openid profile"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | `invalid_json`, `invalid_request`, `invalid_address`, `invalid_public_key`, `invalid_signature`, `invalid_nonce`, `expired_nonce`, `address_mismatch` |
| 401 | `address_key_mismatch`, `invalid_signature` |

---

## JWT Claims

| Claim | Value |
|-------|-------|
| `iss` | Issuer URL |
| `sub` | Zenon address |
| `aud` | `spacetimedb` |
| `iat` | Issued at timestamp |
| `exp` | Expiration timestamp |
| `jti` | Unique JWT ID |
| `zenon_address` | Zenon address |

## Rate Limiting

Default: 10 requests per 60 seconds per IP. Configurable via:
- `RATE_LIMIT_REQUESTS`
- `RATE_LIMIT_WINDOW`
