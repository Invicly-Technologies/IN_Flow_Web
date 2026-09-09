export interface AuthUserDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResultDTO {
  user: AuthUserDTO;
  tokens: AuthTokensDTO;
}
