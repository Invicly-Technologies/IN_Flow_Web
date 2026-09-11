export interface AuthUserDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  isSuperAdmin: boolean;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResultDTO {
  user: AuthUserDTO;
  tokens: AuthTokensDTO;
  /** Workspaces auto-joined via a pending invite matched at registration — empty on login. */
  joinedWorkspaces?: { id: string; name: string }[];
}
