import { type User, type InsertUser, users, analysisLogs, type AnalysisLog, appSettings, blockedIps, type BlockedIp, ipRules, type IpRule } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, gte } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  updateLoginInfo(id: string, ip: string): Promise<void>;
  incrementRequestCount(id: string): Promise<void>;
  toggleUserDisabled(id: string, disabled: boolean): Promise<User | undefined>;
  logAnalysisRequest(email: string, symbol: string, ip: string | null): Promise<void>;
  getAnalysisLogs(limit?: number): Promise<AnalysisLog[]>;
  getUserRequestCountLastHour(email: string): Promise<number>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  recordFailedLogin(ip: string): Promise<{ blocked: boolean; attempts: number }>;
  resetFailedLogins(ip: string): Promise<void>;
  isIpBlocked(ip: string): Promise<boolean>;
  getBlockedIps(): Promise<BlockedIp[]>;
  unblockIp(id: number): Promise<void>;
  getIpRules(): Promise<IpRule[]>;
  addIpRule(type: string, startIp: string, endIp: string, description?: string): Promise<IpRule>;
  deleteIpRule(id: number): Promise<void>;
  isIpAllowed(ip: string): Promise<{ allowed: boolean; reason?: string }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      email: insertUser.email.toLowerCase(),
      password: hashedPassword,
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: Partial<{ email: string; password: string }> = {};
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.password) updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updateLoginInfo(id: string, ip: string): Promise<void> {
    await db.update(users).set({
      lastIp: ip,
      lastLoginAt: new Date(),
    }).where(eq(users.id, id));
  }

  async incrementRequestCount(id: string): Promise<void> {
    await db.update(users).set({
      requestCount: sql`${users.requestCount} + 1`,
    }).where(eq(users.id, id));
  }

  async toggleUserDisabled(id: string, disabled: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ disabled }).where(eq(users.id, id)).returning();
    return user;
  }

  async logAnalysisRequest(email: string, symbol: string, ip: string | null): Promise<void> {
    await db.insert(analysisLogs).values({ userEmail: email, symbol, ip });
  }

  async getAnalysisLogs(limit: number = 100): Promise<AnalysisLog[]> {
    return db.select().from(analysisLogs).orderBy(desc(analysisLogs.createdAt)).limit(limit);
  }

  async getUserRequestCountLastHour(email: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(analysisLogs)
      .where(sql`${analysisLogs.userEmail} = ${email} AND ${analysisLogs.createdAt} >= ${oneHourAgo}`);
    return result[0]?.count || 0;
  }
  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings).values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value } });
  }

  async recordFailedLogin(ip: string): Promise<{ blocked: boolean; attempts: number }> {
    const [existing] = await db.select().from(blockedIps).where(eq(blockedIps.ip, ip));
    if (existing && existing.blocked) {
      return { blocked: true, attempts: existing.failedAttempts };
    }
    const newAttempts = (existing?.failedAttempts || 0) + 1;
    const shouldBlock = newAttempts >= 3;
    if (existing) {
      await db.update(blockedIps).set({
        failedAttempts: newAttempts,
        lastAttemptAt: new Date(),
        blocked: shouldBlock,
        blockedAt: shouldBlock ? new Date() : null,
      }).where(eq(blockedIps.ip, ip));
    } else {
      await db.insert(blockedIps).values({
        ip,
        failedAttempts: newAttempts,
        blocked: shouldBlock,
        lastAttemptAt: new Date(),
        blockedAt: shouldBlock ? new Date() : null,
      });
    }
    return { blocked: shouldBlock, attempts: newAttempts };
  }

  async resetFailedLogins(ip: string): Promise<void> {
    await db.delete(blockedIps).where(eq(blockedIps.ip, ip));
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const [row] = await db.select().from(blockedIps).where(eq(blockedIps.ip, ip));
    return row?.blocked || false;
  }

  async getBlockedIps(): Promise<BlockedIp[]> {
    return db.select().from(blockedIps).orderBy(desc(blockedIps.lastAttemptAt));
  }

  async unblockIp(id: number): Promise<void> {
    await db.delete(blockedIps).where(eq(blockedIps.id, id));
  }

  async getIpRules(): Promise<IpRule[]> {
    return db.select().from(ipRules).orderBy(desc(ipRules.createdAt));
  }

  async addIpRule(type: string, startIp: string, endIp: string, description?: string): Promise<IpRule> {
    const [rule] = await db.insert(ipRules).values({ type, startIp, endIp, description: description || null }).returning();
    return rule;
  }

  async deleteIpRule(id: number): Promise<void> {
    await db.delete(ipRules).where(eq(ipRules.id, id));
  }

  async isIpAllowed(ip: string): Promise<{ allowed: boolean; reason?: string }> {
    const rules = await db.select().from(ipRules);
    if (rules.length === 0) return { allowed: true };

    const whitelistRules = rules.filter(r => r.type === "whitelist");
    const blockRules = rules.filter(r => r.type === "block");

    const ipNum = ipToNumber(ip);
    if (ipNum === null) {
      if (whitelistRules.length > 0) {
        return { allowed: false, reason: "Your IP address is not in the allowed list. Only authorized IP addresses can access this system. Please contact the admin." };
      }
      return { allowed: true };
    }

    const blocked = blockRules.some(r => {
      const start = ipToNumber(r.startIp);
      const end = ipToNumber(r.endIp);
      return start !== null && end !== null && ipNum >= start && ipNum <= end;
    });
    if (blocked) {
      return { allowed: false, reason: "Your IP address is not allowed to access this system. Please contact the admin." };
    }

    if (whitelistRules.length > 0) {
      const whitelisted = whitelistRules.some(r => {
        const start = ipToNumber(r.startIp);
        const end = ipToNumber(r.endIp);
        return start !== null && end !== null && ipNum >= start && ipNum <= end;
      });
      if (!whitelisted) {
        return { allowed: false, reason: "Your IP address is not in the allowed list. Only authorized IP addresses can access this system. Please contact the admin." };
      }
    }

    return { allowed: true };
  }
}

function ipToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(p => parseInt(p, 10));
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

export const storage = new DatabaseStorage();
