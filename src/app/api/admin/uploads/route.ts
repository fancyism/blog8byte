import { type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import {
  apiBadRequest,
  apiSuccess,
  apiUnauthorized,
} from "~/lib/with-error-handler";
import { listRecentUploads, uploadImageToR2 } from "~/server/r2";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 12;

  if (Number.isNaN(limit) || limit < 1 || limit > 48) {
    return apiBadRequest("Limit must be between 1 and 48");
  }

  try {
    const items = await listRecentUploads(limit);
    return apiSuccess({ items });
  } catch (error) {
    return apiBadRequest(
      error instanceof Error ? error.message : "Failed to load uploads",
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return apiBadRequest("Image file is required");
  }

  try {
    const uploaded = await uploadImageToR2(fileEntry);
    return apiSuccess(uploaded);
  } catch (error) {
    return apiBadRequest(
      error instanceof Error ? error.message : "Upload failed",
    );
  }
}
