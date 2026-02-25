# Deployment

## Deno Deploy

The simplest deployment option. Deno KV is built-in with zero configuration.

```bash
deployctl deploy --prod
```

Set environment variables in the Deno Deploy dashboard:
- `JWT_PRIVATE_KEY` - PKCS8-encoded EC private key
- `JWT_PUBLIC_KEY` - SPKI-encoded EC public key
- `JWT_KEY_ID` - Key identifier (e.g., `key-id-1`)
- `ISSUER_URL` - Your deployment URL
- `CORS_ORIGIN` - Allowed origins (default: `*`)

## Self-Hosted

### Requirements

- Deno 2.x
- ES256 keypair (P-256 curve)

### Generate Keypair

```bash
openssl ecparam -name prime256v1 -genkey -noout -out private_ec.pem
openssl pkcs8 -topk8 -nocrypt -in private_ec.pem -out private_ec_pkcs8.pem
openssl ec -in private_ec.pem -pubout -out public_ec.pem
```

### Environment Variables

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `ISSUER_URL` | Public URL of this server | `http://localhost:3001` |
| `JWT_PRIVATE_KEY` | PKCS8 EC private key | (required) |
| `JWT_PUBLIC_KEY` | SPKI EC public key | (required) |
| `JWT_KEY_ID` | Key identifier | `key-id-1` |
| `TOKEN_TTL` | JWT lifetime in seconds | `2592000` (30 days) |
| `CHALLENGE_TTL` | Challenge expiry in seconds | `300` (5 min) |
| `RATE_LIMIT_REQUESTS` | Max requests per window | `10` |
| `RATE_LIMIT_WINDOW` | Rate limit window in seconds | `60` |
| `TRUST_PROXY` | Trust `x-forwarded-for` for client IP (`true`/`false`) | `false` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

### Run

```bash
deno task start
```

For development with auto-reload:

```bash
deno task dev
```

## Docker

Create a `Dockerfile` (not included in repo):

```dockerfile
FROM denoland/deno:2.6.10

WORKDIR /app
COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["task", "start"]
```

```bash
docker build -t nexus-oidc .
docker run -p 3001:3001 --env-file .env nexus-oidc
```

Override port at runtime: `docker run -p 8080:8080 -e PORT=8080 --env-file .env nexus-oidc`

## CORS Notes

CORS only affects browser-based requests. `probe` CLI and SpacetimeDB's server-side JWKS fetch ignore CORS. Set `CORS_ORIGIN=*` unless a browser frontend directly calls this API.

## Storage

Deno KV stores data in `~/.cache/deno/kv/` locally. On Deno Deploy, KV uses their managed infrastructure with automatic replication and backups.
