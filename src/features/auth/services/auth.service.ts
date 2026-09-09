import { ApiError } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateRefreshToken, signAccessToken } from "@/lib/jwt";
import { userRepository } from "@/features/auth/repositories/user.repository";
import { workspaceRepository } from "@/features/auth/repositories/workspace.repository";
import { sessionRepository } from "@/features/auth/repositories/session.repository";
import type { RegisterInput, LoginInput } from "@/validations/auth.validations";
import type { AuthResultDTO, AuthUserDTO } from "@/types/auth";
import type { User } from "@prisma/client";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";

function toAuthUserDTO(user: User): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
  };
}

async function issueTokens(
  user: User,
  context: { userAgent?: string | null; ipAddress?: string | null }
): Promise<AuthResultDTO> {
  const session = await sessionRepository.createSession(
    user.id,
    context.userAgent,
    context.ipAddress
  );
  const { token, tokenHash } = generateRefreshToken();
  await sessionRepository.issueRefreshToken(session.id, user.id, tokenHash);

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return {
    user: toAuthUserDTO(user),
    tokens: { accessToken, refreshToken: token, expiresIn: ACCESS_EXPIRES_IN },
  };
}

export const authService = {
  async register(
    input: RegisterInput,
    context: { userAgent?: string | null; ipAddress?: string | null }
  ): Promise<AuthResultDTO> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError("CONFLICT", "An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });

    await workspaceRepository.createWithOwner(
      input.workspaceName?.trim() || `${input.fullName}'s Workspace`,
      user.id
    );

    return issueTokens(user, context);
  },

  async login(
    input: LoginInput,
    context: { userAgent?: string | null; ipAddress?: string | null }
  ): Promise<AuthResultDTO> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Invalid email or password");
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new ApiError("UNAUTHORIZED", "Invalid email or password");
    }

    return issueTokens(user, context);
  },

  async refresh(refreshToken: string): Promise<AuthResultDTO> {
    const existing = await sessionRepository.findActiveByToken(refreshToken);
    if (!existing) {
      throw new ApiError("UNAUTHORIZED", "Refresh token is invalid or expired");
    }

    const user = await userRepository.findById(existing.userId);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Refresh token is invalid or expired");
    }

    const { token, tokenHash } = generateRefreshToken();
    await sessionRepository.rotate(existing.id, existing.sessionId, user.id, tokenHash);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    return {
      user: toAuthUserDTO(user),
      tokens: { accessToken, refreshToken: token, expiresIn: ACCESS_EXPIRES_IN },
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await sessionRepository.revokeByToken(refreshToken);
  },

  async getCurrentUser(userId: string): Promise<AuthUserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found");
    }
    return toAuthUserDTO(user);
  },
};
