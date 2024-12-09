"use server";

import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client-middleware";
import { getOrganizationIdFromProjectId } from "@/lib/utils/helper";
import { getRemoveBrandingPermission } from "@/modules/ee/license-check/lib/utils";
import { updateProjectBranding } from "@/modules/ee/whitelabel/remove-branding/lib/project";
import { ZProjectUpdateBrandingInput } from "@/modules/ee/whitelabel/remove-branding/types/project";
import { z } from "zod";
import { getOrganization } from "@formbricks/lib/organization/service";
import { ZId } from "@formbricks/types/common";
import { OperationNotAllowedError } from "@formbricks/types/errors";

const ZUpdateProjectAction = z.object({
  projectId: ZId,
  data: ZProjectUpdateBrandingInput,
});

export const updateProjectBrandingAction = authenticatedActionClient
  .schema(ZUpdateProjectAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromProjectId(parsedInput.projectId);

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          projectId: parsedInput.projectId,
          minPermission: "manage",
        },
      ],
    });

    if (
      parsedInput.data.inAppSurveyBranding !== undefined ||
      parsedInput.data.linkSurveyBranding !== undefined
    ) {
      const organization = await getOrganization(organizationId);

      if (!organization) {
        throw new Error("Organization not found");
      }
      const isWhitelabelEnabled = await getRemoveBrandingPermission(organization);

      if (parsedInput.data.inAppSurveyBranding !== undefined) {
        if (!isWhitelabelEnabled) {
          throw new OperationNotAllowedError("You are not allowed to remove in-app branding");
        }
      }

      if (parsedInput.data.linkSurveyBranding !== undefined) {
        if (!isWhitelabelEnabled) {
          throw new OperationNotAllowedError("You are not allowed to remove link survey branding");
        }
      }
    }

    return await updateProjectBranding(parsedInput.projectId, parsedInput.data);
  });
