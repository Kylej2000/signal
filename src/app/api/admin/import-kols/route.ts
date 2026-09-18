import { NextResponse } from "next/server";
import { checkAdminAuth, slugify } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { syncHeliusWatchlist } from "@/lib/solana/helius";

export const dynamic = "force-dynamic";

// Snapshot of the public KOLScan leaderboard on 2026-09-18. These are
// community attributions, not claims that the account owner verified them.
const KOLS = [
  ["Letterbomb", "BtMBMPkoNbnLF9Xn552guQq528KKXcsNBNNBre3oaQtr"],
  ["Cented", "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o"],
  ["asta", "AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL"],
  ["LJC", "6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2"],
  ["Latuche", "GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65"],
  ["narc", "CxgPWvH2GoEDENELne2XKAR2z2Fr4shG2uaeyqZceGve"],
  ["Hugo Fartingale", "Au1GUWfcadx7jMzhsg6gHGUgViYJrnPfL1vbdqnvLK4i"],
  ["gr3g", "J23qr98GjGJJqKq9CBEnyRhHbmkaVxtTJNNxKu597wsA"],
  ["Mr. Frog", "4DdrfiDHpmx55i4SPssxVzS9ZaKLb8qr45NKY9Er9nNh"],
  ["Megga", "H31vEBxSJk1nQdUN11qZgZyhScyShhscKhvhZZU3dQoU"],
  ["trunoest", "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT"],
  ["decu", "4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9"],
  ["OGAntD", "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP"],
  ["Pain", "J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa"],
  ["Trenchman", "Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7"],
  ["Chairman ²", "Be24Gbf5KisDk1LcWWZsBn8dvB816By7YzYF5zWZnRR6"],
  ["DustNukes", "FzVQSzj8JJr6WMGqbUHzx2XH1KkrfxRrRPv6WcbbZmND"],
  ["Spuno", "GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH"],
  ["Lynk", "CkPFGv2Wv1vwdWjtXioEgb8jhZQfs3eVZez3QCetu7xD"],
  ["slingoor", "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij"],
  ["Kev", "BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd"],
  ["Esee06257", "4uCT4g7YHH4xxfmfNfKUDenwGrRNGoZ9Ay1XFxfUGhQG"],
  ["King Solomon", "DEdEW3SMPU2dCfXEcgj2YppmX9H3bnMDJaU4ctn2BQDQ"],
  ["cap", "CAPn1yH4oSywsxGU456jfgTrSSUidf9jgeAnHceNUJdw"],
  ["Ramset ✟", "71PCu3E4JP5RDBoY6wJteqzxkKNXLyE1byg5BTAL9UtQ"],
  ["Zef", "EjtQrPTbcMevStBkpnjsH23NfUCMhGHusTYsHuGVQZp2"],
  ["brunowsky", "GvTXquDAJbfrFrEGTPRPUj3WM5Bzub5yeTFzkLVHpjfD"],
  ["yeekidd", "88e2kBDJoN7eQCBj2sxT15etUZ3jPNzD4ijCs1TNySWJ"],
  ["Rilsio", "4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu"],
  ["samsrep", "CUHBzSPSaNS3tArEtM3maSV6pNdJhHJFYZpurPPK9P7H"],
  ["Flames", "6aXFYXbFob1ZKAEDCcqZnX2vooA3TgEqDoy5dAQbeWoV"],
  ["Cooker", "8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6"],
  ["Dior", "87rRdssFiTJKY4MGARa4G5vQ31hmR7MxSmhzeaJ5AAxJ"],
  ["dv", "BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd"],
  ["Art", "CgaA9a1JwAXJyfHuvZ7VW8YfTVRkdiT5mjBBSKcg7Rz5"],
  ["cryptovillain26", "5sNnKuWKUtZkdC1eFNyqz3XHpNoCRQ1D1DfHcNHMV7gn"],
  ["theo", "Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt"],
  ["Limfork.eth", "BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB"],
  ["zeropnl", "4xY9T1Q7foJzJsJ6YZDSsfp9zkzeZsXnxd45SixduMmr"],
  ["Jidn", "3h65MmPZksoKKyEpEjnWU2Yk2iYT5oZDNitGy5cTaxoE"],
  ["Gucci", "YvEsBWpHK5PJ6Q8m4YrocwKeWys1NG67pbgi73UPnuX"],
  ["bandit", "5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X"],
  ["Smokez", "5t9xBNuDdGTGpjaPTx6hKd7sdRJbvtKS8Mhq6qVbo8Qz"],
  ["Wugi", "862TYSvRYoiHAK3F3WwTRYAfuGiQaGdxedN9AGvRGWo2"],
  ["xander", "B3wagQZiZU2hKa5pUCj6rrdhWsX3Q6WfTTnki9PjwzMh"],
  ["Kadenox", "B32QbbdDAyhvUQzjcaM5j6ZVKwjCxAwGH5Xgvb9SJqnC"],
  ["0xWinged", "HrCPnDvDgbpbFxKxer6Pw3qEcfAQQNNjb6aJNFWgTEng"],
  ["0xEthan", "6yVb4pxNwDfr6rovwNnBg3SyKSvDcHGD4WdFPN1JJBqm"],
  ["peacefuldestroy", "8AtQ4ka3dgtrH1z4Uq3Tm4YdMN3cK5RRj1eKuGNnvenm"],
  ["Schoen", "5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM"],
] as const;

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isDemoMode()) return NextResponse.json({ error: "Disable demo mode first." }, { status: 400 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const influencerRows = KOLS.map(([name]) => ({
    name,
    slug: slugify(name),
    category: "Solana KOL",
    description: "Public wallet attribution from the KOLScan leaderboard (2026-09-18).",
    active: true,
  }));
  const { error: influencerError } = await supabase
    .from("influencers")
    .upsert(influencerRows, { onConflict: "slug" });
  if (influencerError) return NextResponse.json({ error: influencerError.message }, { status: 400 });

  const slugs = influencerRows.map((row) => row.slug);
  const { data: influencers, error: selectError } = await supabase
    .from("influencers")
    .select("id,slug")
    .in("slug", slugs);
  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 400 });
  const ids = new Map((influencers ?? []).map((row) => [row.slug, row.id]));

  const walletRows = KOLS.map(([name, address]) => ({
    influencer_id: ids.get(slugify(name)),
    address,
    chain: "solana" as const,
    label: "KOLScan leaderboard",
    verification_status: "community_reported" as const,
    verification_source: `https://kolscan.io/account/${address}`,
    active: true,
  })).filter((row) => row.influencer_id);

  const { error: walletError } = await supabase
    .from("wallets")
    .upsert(walletRows, { onConflict: "address,chain" });
  if (walletError) return NextResponse.json({ error: walletError.message }, { status: 400 });

  const { data: active } = await supabase
    .from("wallets")
    .select("address")
    .eq("active", true)
    .eq("chain", "solana");
  const sync = await syncHeliusWatchlist((active ?? []).map((wallet) => wallet.address));

  return NextResponse.json({
    message: `Imported ${walletRows.length} ranked KOL wallets.${sync.ok ? ` ${sync.message}` : ""}`,
    imported: walletRows.length,
    helius: sync,
  });
}
