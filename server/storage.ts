import { type User, type InsertUser, users, analysisLogs, type AnalysisLog } from "@shared/schema";
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
}

export const storage = new DatabaseStorage();
