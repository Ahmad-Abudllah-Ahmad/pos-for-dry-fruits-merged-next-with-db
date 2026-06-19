import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

const SECRET_KEY = process.env.SECRET_KEY || "change_this_secret_key";
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "HS256";
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "60", 10);

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

export function createAccessToken(subject, claims = {}) {
  const payload = { sub: subject, ...claims };
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_EXPIRE_MINUTES * 60,
  });
}

export function decodeAccessToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [JWT_ALGORITHM] });
  } catch {
    throw new Error("Invalid authentication token");
  }
}

export async function getCurrentUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  let payload;
  try {
    payload = decodeAccessToken(token);
  } catch {
    return null;
  }
  const userId = parseInt(payload.sub, 10);
  if (isNaN(userId)) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.is_active) return null;
  return user;
}

export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { error: "Could not validate credentials", status: 401 };
  }
  return { user };
}

export async function requireAdmin(request) {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user.role !== "Admin") {
    return { error: "Admin access is required", status: 403 };
  }
  return result;
}

export async function requireWorkspaceAccess(workspaceId, user) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { error: "Workspace not found", status: 404 };
  }
  if (user.role === "Admin") return { workspace };

  const membership = await prisma.workspaceMember.findUnique({
    where: { uq_workspace_user: { workspace_id: workspaceId, user_id: user.id } },
  });
  if (!membership) {
    return { error: "Workspace access is required", status: 403 };
  }
  return { workspace };
}
