import "server-only";
import { cookies } from "next/headers";

export async function visitorId() {
  return (await cookies()).get("sefikh_vid")?.value ?? null;
}
