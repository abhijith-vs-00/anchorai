import { ok, serverError } from "@/lib/api/response";
import { listResources } from "@/lib/repositories/resource.repository";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const resources = await listResources({ category, tags });
    return ok({ resources });
  } catch (err) {
    console.error("[resources]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
