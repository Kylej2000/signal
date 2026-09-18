import { NextResponse } from "next/server";
import { checkAdminAuth, slugify } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

type SupportedChain = "ethereum" | "bnb" | "avalanche" | "base" | "arbitrum" | "optimism" | "polygon";

const EVM_KOLS: Array<{
  name: string;
  xHandle?: string;
  address: string;
  chains: SupportedChain[];
  status: "publicly_disclosed" | "community_reported";
  source: string;
}> = [
  {
    name: "Vitalik Buterin",
    xHandle: "VitalikButerin",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chains: ["ethereum", "bnb", "avalanche", "base", "arbitrum", "optimism", "polygon"],
    status: "publicly_disclosed",
    source: "https://vitalik.eth.limo/general/2024/12/03/wallets.html",
  },
  {
    name: "Machi Big Brother",
    xHandle: "machibigbrother",
    address: "0x020cA66C30beC2c4Fe3861a94E4DB4A498A35872",
    chains: ["ethereum"],
    status: "community_reported",
    source: "https://etherscan.io/address/0x020ca66c30bec2c4fe3861a94e4db4a498a35872",
  },
  {
    name: "Pranksy",
    xHandle: "pranksy",
    address: "0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459",
    chains: ["ethereum", "bnb", "avalanche", "base", "arbitrum", "optimism"],
    status: "community_reported",
    source: "https://etherscan.io/address/0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459",
  },
  {
    name: "Dingaling",
    address: "0x54BE3a794282C030b15E43aE2bB182E14c409C5e",
    chains: ["ethereum", "bnb", "avalanche", "base", "arbitrum", "optimism", "polygon"],
    status: "community_reported",
    source: "https://etherscan.io/address/dingaling.eth",
  },
  {
    name: "Gary Vaynerchuk",
    xHandle: "garyvee",
    address: "0x5ea9681c3ab9b5739810f8b91ae65ec47de62119",
    chains: ["ethereum"],
    status: "community_reported",
    source: "https://etherscan.io/address/0x5ea9681c3ab9b5739810f8b91ae65ec47de62119",
  },
  {
    name: "Chicken Genius",
    address: "0xeb2eb5c68156250c368914761bb8f1208d56acd0",
    chains: ["ethereum"],
    status: "community_reported",
    source: "https://etherscan.io/address/0xeb2eb5c68156250c368914761bb8f1208d56acd0",
  },
];

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isDemoMode()) return NextResponse.json({ error: "Disable demo mode first." }, { status: 400 });
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const influencerRows = EVM_KOLS.map((kol) => ({
    name: kol.name,
    slug: slugify(kol.name),
    x_handle: kol.xHandle ?? null,
    category: "Cross-chain KOL",
    description: "Publicly attributable EVM wallet with source evidence.",
    active: true,
  }));
  const { error: influencerError } = await supabase
    .from("influencers")
    .upsert(influencerRows, { onConflict: "slug" });
  if (influencerError) return NextResponse.json({ error: influencerError.message }, { status: 400 });

  const { data: influencers, error: selectError } = await supabase
    .from("influencers")
    .select("id,slug")
    .in("slug", influencerRows.map((row) => row.slug));
  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 400 });
  const ids = new Map((influencers ?? []).map((row) => [row.slug, row.id]));

  const walletRows = EVM_KOLS.flatMap((kol) =>
    kol.chains.map((chain) => ({
      influencer_id: ids.get(slugify(kol.name)),
      address: kol.address,
      chain,
      label: "Public EVM attribution",
      verification_status: kol.status,
      verification_source: kol.source,
      verified_at: kol.status === "publicly_disclosed" ? new Date().toISOString() : null,
      active: true,
    })),
  ).filter((row) => row.influencer_id);

  const { error: walletError } = await supabase
    .from("wallets")
    .upsert(walletRows, { onConflict: "address,chain" });
  if (walletError) return NextResponse.json({ error: walletError.message }, { status: 400 });

  return NextResponse.json({
    message: `Imported ${walletRows.length} sourced EVM wallet-chain records for ${EVM_KOLS.length} influencers.`,
    influencers: EVM_KOLS.length,
    wallets: walletRows.length,
  });
}
