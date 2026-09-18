import { NextResponse } from "next/server";
import { checkAdminAuth, slugify } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

const PEOPLE = [
  ["Ansem", "blknoiz06", "Solana, altcoins, memecoins"],
  ["Crypto God John", "CryptoGodJohn", "Altcoins, on-chain plays, trading"],
  ["Alex Becker", "ZssBecker", "Altcoins, gaming, AI/crypto"],
  ["Cobie", "cobie", "Crypto markets, narratives"],
  ["Murad Mahmudov", "MustStopMurad", "Memecoins, crypto narratives"],
  ["Arthur Hayes", "CryptoHayes", "Macro, BTC, altcoin theses"],
  ["Andrew Kang", "Rewkang", "Trading, DeFi, altcoins"],
  ["Miles Deutscher", "milesdeutscher", "Altcoins, narratives, research"],
  ["Threadguy", "notthreadguy", "Crypto culture, NFTs, memecoins"],
  ["Luca Netz", "LucaNetz", "NFTs, consumer crypto, Pudgy Penguins"],
  ["GCR", "GCRClassic", "Trading, macro, contrarian calls"],
  ["Hsaka", "HsakaTrades", "Crypto trading"],
  ["DonAlt", "CryptoDonAlt", "Trading, BTC/altcoins"],
  ["Daan Crypto Trades", "DaanCrypto", "Trading, market structure"],
  ["The Flow Horse", "TheFlowHorse", "Trading, market psychology"],
  ["Pentosh1", "Pentosh1", "BTC/altcoin trading"],
  ["CryptoCred", "CryptoCred", "Technical analysis/trading"],
  ["Santiago R. Santos", "santiagoroel", "DeFi, investing, narratives"],
  ["DeFi Ignas", "DefiIgnas", "DeFi, research, emerging protocols"],
  ["Zeneca", "Zeneca", "NFTs, crypto culture"],
  ["Raoul Pal", "RaoulGMI", "Macro, crypto markets"],
  ["Anthony Pompliano", "APompliano", "Bitcoin, macro"],
  ["Michael Saylor", "saylor", "Bitcoin"],
  ["Vitalik Buterin", "VitalikButerin", "Ethereum, blockchain"],
  ["CZ", "cz_binance", "Crypto industry, BNB/Binance ecosystem"],
  ["Brian Armstrong", "brian_armstrong", "Crypto industry, Coinbase"],
  ["Balaji Srinivasan", "balajis", "Crypto, technology, macro"],
  ["Willy Woo", "woonomic", "Bitcoin/on-chain analysis"],
  ["PlanB", "100trillionUSD", "Bitcoin/macroeconomic models"],
  ["Rekt Capital", "rektcapital", "BTC/altcoin technical analysis"],
] as const;

const WALLETS = [
  {
    name: "Ansem", address: "AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm", chain: "solana",
    source: "https://m.theblockbeats.info/en/news/54727", label: "Widely reported public wallet",
  },
  {
    name: "Crypto God John", address: "5GmQHd4vQ2eeGHTr6ifEDYG8aHNxBiv14XK9cQvNvfGS", chain: "solana",
    source: "https://app.cielo.finance/profile/5GmQHd4vQ2eeGHTr6ifEDYG8aHNxBiv14XK9cQvNvfGS/activity", label: "Cielo community attribution",
  },
  ...["ethereum", "bnb", "avalanche", "base", "arbitrum", "optimism", "polygon"].map((chain) => ({
    name: "Vitalik Buterin", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chain,
    source: "https://vitalik.eth.limo/general/2024/12/03/wallets.html", label: "Publicly disclosed address",
  })),
];

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isDemoMode()) return NextResponse.json({ error: "Disable demo mode first." }, { status: 400 });
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const rows = PEOPLE.map(([name, x_handle, category]) => ({
    name, slug: slugify(name), x_handle, category,
    description: `${category}. Included in Kyle's personal watchlist.`, active: true,
  }));
  const slugs = rows.map((row) => row.slug);

  // Remove social-only/test data: this app is now a wallet-buy monitor.
  await supabase.from("signals").delete().in("signal_type", ["social_mention", "correlated"]);
  await supabase.from("social_posts").delete().not("id", "is", null);

  const { error: upsertError } = await supabase.from("influencers").upsert(rows, { onConflict: "slug" });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  const { data: removed, error: removeError } = await supabase
    .from("influencers").delete().not("slug", "in", `(${slugs.join(",")})`).select("id");
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 });

  const { data: people, error: selectError } = await supabase.from("influencers").select("id,slug").in("slug", slugs);
  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 400 });
  const ids = new Map((people ?? []).map((person: any) => [person.slug, person.id]));
  const walletRows = WALLETS.map((wallet) => ({
    influencer_id: ids.get(slugify(wallet.name)), address: wallet.address, chain: wallet.chain,
    label: wallet.label, verification_status: wallet.name === "Vitalik Buterin" ? "publicly_disclosed" : "community_reported",
    verification_source: wallet.source, verified_at: wallet.name === "Vitalik Buterin" ? new Date().toISOString() : null, active: true,
  })).filter((wallet) => wallet.influencer_id);
  const { error: walletError } = await supabase.from("wallets").upsert(walletRows, { onConflict: "address,chain" });
  if (walletError) return NextResponse.json({ error: walletError.message }, { status: 400 });

  return NextResponse.json({
    message: `Curated watchlist ready: 30 recognisable names, ${walletRows.length} sourced wallet-chain records, ${removed?.length ?? 0} old profiles removed.`,
    profiles: rows.length, walletRecords: walletRows.length, removed: removed?.length ?? 0,
  });
}
