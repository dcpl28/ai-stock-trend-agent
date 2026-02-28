import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  disabled: boolean("disabled").default(false).notNull(),
  lastIp: text("last_ip"),
  lastLoginAt: timestamp("last_login_at"),
  requestCount: integer("request_count").default(0).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionStatus: text("subscription_status"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const analysisLogs = pgTable("analysis_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userEmail: text("user_email").notNull(),
  symbol: text("symbol").notNull(),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalysisLog = typeof analysisLogs.$inferSelect;

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

export const blockedIps = pgTable("blocked_ips", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ip: text("ip").notNull().unique(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  blockedAt: timestamp("blocked_at"),
});

export type BlockedIp = typeof blockedIps.$inferSelect;

export const ipRules = pgTable("ip_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  startIp: text("start_ip").notNull(),
  endIp: text("end_ip").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type IpRule = typeof ipRules.$inferSelect;

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFavourites = pgTable("user_favourites", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("user_favourites_user_symbol").on(table.userId, table.symbol),
]);

export const insertFavouriteSchema = createInsertSchema(userFavourites).pick({
  symbol: true,
  displayName: true,
});

export type InsertFavourite = z.infer<typeof insertFavouriteSchema>;
export type UserFavourite = typeof userFavourites.$inferSelect;

export const emailLogs = pgTable("email_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userEmail: text("user_email").notNull(),
  subject: text("subject").notNull(),
  stocksIncluded: text("stocks_included").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
