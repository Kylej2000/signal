import { config } from "@/lib/config";

/** MVP-grade admin auth: shared password via the x-admin-password header. */
export function checkAdminAuth(req: Request): boolean {
  const provided = req.headers.get("x-admin-password");
  if (!provided) return false;
  const expected = config.adminPassword;
  if (provided.length !== expected.length) return false;
  let out = 0;
  for (let i = 0; i < provided.length; i++) out |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return out === 0;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
