/**
 * Central configuration + capability detection.
 *
 * The app is designed to run with ZERO configuration in DEMO_MODE. As you add
 * credentials, individual subsystems (Supabase, Helius, X, alert channels)
 * light up. Nothing here throws — callers check the booleans.
 */

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value.toLowerCase() !== "false" && value !== "0";
}

/**
 * Demo mode is ON by default and only turns OFF when explicitly set to "false"
 * AND Supabase is actually configured. This prevents a half-configured deploy
 * from showing an empty app.
 */
export function isDemoMode(): boolean {
  const flag = envFlag(process.env.NEXT_PUBLIC_DEMO_MODE, true);
  if (flag) return true;
  // Even if the flag says false, fall back to demo if Supabase is missing.
  return !hasSupabase();
}

export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseAdmin(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasHelius(): boolean {
  return Boolean(process.env.HELIUS_API_KEY);
}

export function hasBirdeye(): boolean {
  return Boolean(process.env.BIRDEYE_API_KEY);
}

export function hasX(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN);
}

export function hasTelegram(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export function hasDiscord(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export const config = {
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  solanaCronSecret: process.env.SOLANA_CRON_SECRET,
  heliusApiKey: process.env.HELIUS_API_KEY,
  heliusWebhookSecret: process.env.HELIUS_WEBHOOK_SECRET,
  heliusWebhookId: process.env.HELIUS_WEBHOOK_ID,
  birdeyeApiKey: process.env.BIRDEYE_API_KEY,
  xBearerToken: process.env.X_BEARER_TOKEN,
  twitterCronSecret: process.env.TWITTER_CRON_SECRET,
  adminPassword: process.env.ADMIN_PASSWORD || "change-me",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
} as const;

// Well-known Solana mints treated as "quote"/base assets (not a "buy" target).
export const QUOTE_MINTS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL", // wrapped SOL
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
};

export function isQuoteMint(mint: string): boolean {
  return mint in QUOTE_MINTS;
}
