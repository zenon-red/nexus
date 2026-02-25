export interface ChallengeResponse {
  nonce: string;
  challenge: string;
  expires_at: number;
}

export interface TokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
