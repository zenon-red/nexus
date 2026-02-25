export interface ChallengeNonce {
  nonce: string;
  address: string;
  challenge: string;
  createdAt: number;
  expiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
}
