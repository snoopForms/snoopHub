import { responses } from "@/app/lib/api/response";
import createSubscription from "@formbricks/ee/billing/api/create-subscription";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const responseInput = await request.json();
    const { teamId, failureUrl, priceNickname } = responseInput;
    const { status, data, newPlan, url } = await createSubscription(teamId, failureUrl, priceNickname);

    return responses.successResponse({ status, data, newPlan, url }, true);
  } catch (error) {
    console.error(error);
    return responses.internalServerErrorResponse(
      "Unable to complete response. See server logs for details.",
      true
    );
  }
}
