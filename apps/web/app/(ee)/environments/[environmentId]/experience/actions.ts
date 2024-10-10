"use server";

import { getStats } from "@/app/(ee)/environments/[environmentId]/experience/lib/stats";
import { ZStatsPeriod } from "@/app/(ee)/environments/[environmentId]/experience/types/stats";
import { z } from "zod";
import { authenticatedActionClient } from "@formbricks/lib/actionClient";
import { checkAuthorization } from "@formbricks/lib/actionClient/utils";
import { getInsights } from "@formbricks/lib/insight/service";
import { getOrganizationIdFromEnvironmentId } from "@formbricks/lib/organization/utils";
import { ZId } from "@formbricks/types/common";

const ZGetInsightsAction = z.object({
  environmentId: ZId,
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const getInsightsAction = authenticatedActionClient
  .schema(ZGetInsightsAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorization({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      rules: ["response", "read"],
    });

    return await getInsights(parsedInput.environmentId, parsedInput.limit, parsedInput.offset);
  });

const ZGetStatsAction = z.object({
  environmentId: ZId,
  timeRange: ZStatsPeriod,
});

export const getStatsAction = authenticatedActionClient
  .schema(ZGetStatsAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorization({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      rules: ["response", "read"],
    });

    return await getStats(parsedInput.environmentId, parsedInput.timeRange);
  });
