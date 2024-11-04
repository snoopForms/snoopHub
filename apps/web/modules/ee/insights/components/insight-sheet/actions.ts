"use server";

import { checkAuthorizationUpdated } from "@/lib/utils/action-client-middleware";
import {
  getOrganizationIdFromInsightId,
  getProductIdFromInsightId,
  getProductIdFromSurveyId,
} from "@/lib/utils/helper";
import {
  getDocumentsByInsightId,
  getDocumentsByInsightIdSurveyIdQuestionId,
} from "@/modules/ee/insights/components/insight-sheet/lib/documents";
import { z } from "zod";
import { authenticatedActionClient } from "@formbricks/lib/actionClient";
import { ZId } from "@formbricks/types/common";
import { ZDocumentFilterCriteria } from "@formbricks/types/documents";
import { ZSurveyQuestionId } from "@formbricks/types/surveys/types";

const ZGetDocumentsByInsightIdSurveyIdQuestionIdAction = z.object({
  insightId: ZId,
  surveyId: ZId,
  questionId: ZSurveyQuestionId,
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const getDocumentsByInsightIdSurveyIdQuestionIdAction = authenticatedActionClient
  .schema(ZGetDocumentsByInsightIdSurveyIdQuestionIdAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromInsightId(parsedInput.insightId),
      access: [
        {
          type: "organization",
          rules: ["response", "read"],
        },
        {
          type: "product",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
        },
      ],
    });

    return await getDocumentsByInsightIdSurveyIdQuestionId(
      parsedInput.insightId,
      parsedInput.surveyId,
      parsedInput.questionId,
      parsedInput.limit,
      parsedInput.offset
    );
  });

const ZGetDocumentsByInsightIdAction = z.object({
  insightId: ZId,
  limit: z.number().optional(),
  offset: z.number().optional(),
  filterCriteria: ZDocumentFilterCriteria.optional(),
});

export const getDocumentsByInsightIdAction = authenticatedActionClient
  .schema(ZGetDocumentsByInsightIdAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromInsightId(parsedInput.insightId),
      access: [
        {
          type: "organization",
          rules: ["response", "read"],
        },
        {
          type: "product",
          productId: await getProductIdFromInsightId(parsedInput.insightId),
        },
      ],
    });

    return await getDocumentsByInsightId(
      parsedInput.insightId,
      parsedInput.limit,
      parsedInput.offset,
      parsedInput.filterCriteria
    );
  });
