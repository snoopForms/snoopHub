"use server";

import { getSurvey, getSurveys } from "@/app/(app)/environments/[environmentId]/surveys/lib/surveys";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client-middleware";
import {
  getOrganizationIdFromEnvironmentId,
  getOrganizationIdFromSurveyId,
  getOrganizationIdFromTagId,
  getProductIdFromEnvironmentId,
  getProductIdFromSurveyId,
} from "@/lib/utils/helper";
import { getEnvironment } from "@/lib/utils/services";
import { z } from "zod";
import { getUserProducts } from "@formbricks/lib/product/service";
import { copySurveyToOtherEnvironment, deleteSurvey } from "@formbricks/lib/survey/service";
import { createTag, getTagsBySurveyId } from "@formbricks/lib/tag/service";
import { addTagToSurvey, deleteTagOnSurvey } from "@formbricks/lib/tagOnSurvey/service";
import { generateSurveySingleUseId } from "@formbricks/lib/utils/singleUseSurveys";
import { ZId } from "@formbricks/types/common";
import { ResourceNotFoundError } from "@formbricks/types/errors";
import { ZSurveyFilterCriteria } from "@formbricks/types/surveys/types";

const ZGetSurveyAction = z.object({
  surveyId: ZId,
});

export const getSurveyAction = authenticatedActionClient
  .schema(ZGetSurveyAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          minPermission: "read",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
        },
      ],
    });

    return await getSurvey(parsedInput.surveyId);
  });

const ZCopySurveyToOtherEnvironmentAction = z.object({
  environmentId: ZId,
  surveyId: ZId,
  targetEnvironmentId: ZId,
});

export const copySurveyToOtherEnvironmentAction = authenticatedActionClient
  .schema(ZCopySurveyToOtherEnvironmentAction)
  .action(async ({ ctx, parsedInput }) => {
    const sourceEnvironment = await getEnvironment(parsedInput.environmentId);
    const targetEnvironment = await getEnvironment(parsedInput.targetEnvironmentId);

    if (!sourceEnvironment || !targetEnvironment) {
      throw new ResourceNotFoundError(
        "Environment",
        sourceEnvironment ? parsedInput.targetEnvironmentId : parsedInput.environmentId
      );
    }

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          minPermission: "readWrite",
          productId: sourceEnvironment.productId,
        },
      ],
    });

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          minPermission: "readWrite",
          productId: targetEnvironment.productId,
        },
      ],
    });

    return await copySurveyToOtherEnvironment(
      parsedInput.environmentId,
      parsedInput.surveyId,
      parsedInput.targetEnvironmentId,
      ctx.user.id
    );
  });

const ZGetProductsByEnvironmentIdAction = z.object({
  environmentId: ZId,
});

export const getProductsByEnvironmentIdAction = authenticatedActionClient
  .schema(ZGetProductsByEnvironmentIdAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          minPermission: "readWrite",
          productId: await getProductIdFromEnvironmentId(parsedInput.environmentId),
        },
      ],
    });

    return await getUserProducts(ctx.user.id, organizationId);
  });

const ZDeleteSurveyAction = z.object({
  surveyId: ZId,
});

export const deleteSurveyAction = authenticatedActionClient
  .schema(ZDeleteSurveyAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    await deleteSurvey(parsedInput.surveyId);
  });

const ZGenerateSingleUseIdAction = z.object({
  surveyId: ZId,
  isEncrypted: z.boolean(),
});

export const generateSingleUseIdAction = authenticatedActionClient
  .schema(ZGenerateSingleUseIdAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    return generateSurveySingleUseId(parsedInput.isEncrypted);
  });

const ZGetSurveysAction = z.object({
  environmentId: ZId,
  limit: z.number().optional(),
  offset: z.number().optional(),
  filterCriteria: ZSurveyFilterCriteria.optional(),
});

export const getSurveysAction = authenticatedActionClient
  .schema(ZGetSurveysAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      access: [
        {
          data: parsedInput.filterCriteria,
          schema: ZSurveyFilterCriteria,
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          minPermission: "read",
          productId: await getProductIdFromEnvironmentId(parsedInput.environmentId),
        },
      ],
    });

    return await getSurveys(
      parsedInput.environmentId,
      parsedInput.limit,
      parsedInput.offset,
      parsedInput.filterCriteria
    );
  });

const ZCreateTagAction = z.object({
  environmentId: ZId,
  tagName: z.string(),
});

export const createTagAction = authenticatedActionClient
  .schema(ZCreateTagAction)
  .action(async ({ parsedInput, ctx }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromEnvironmentId(parsedInput.environmentId),
          minPermission: "readWrite",
        },
      ],
    });

    return await createTag(parsedInput.environmentId, parsedInput.tagName);
  });

const ZCreateTagToSurveyAction = z.object({
  surveyId: ZId,
  tagId: ZId,
});

export const createTagToSurveyAction = authenticatedActionClient
  .schema(ZCreateTagToSurveyAction)
  .action(async ({ parsedInput, ctx }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromTagId(parsedInput.tagId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    const result = await addTagToSurvey(parsedInput.surveyId, parsedInput.tagId);

    return result;
  });

const ZGetTagsForSurveyAction = z.object({
  surveyId: z.string(),
});

const ZDeleteTagOnSurveyAction = z.object({
  surveyId: ZId,
  tagId: ZId,
});

export const deleteTagOnSurveyAction = authenticatedActionClient
  .schema(ZDeleteTagOnSurveyAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    return await deleteTagOnSurvey(parsedInput.surveyId, parsedInput.tagId);
  });

export const getTagsForSurveyAction = authenticatedActionClient
  .schema(ZGetTagsForSurveyAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromSurveyId(parsedInput.surveyId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "productTeam",
          productId: await getProductIdFromSurveyId(parsedInput.surveyId),
          minPermission: "readWrite",
        },
      ],
    });

    return await getTagsBySurveyId(parsedInput.surveyId);
  });
