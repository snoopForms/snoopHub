"use server";

import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client-middleware";
import {
  getOrganizationIdFromEnvironmentId,
  getOrganizationIdFromPersonId,
  getProjectIdFromEnvironmentId,
  getProjectIdFromPersonId,
} from "@/lib/utils/helper";
import { z } from "zod";
import { deletePerson, getPeople } from "@formbricks/lib/person/service";
import { ZId } from "@formbricks/types/common";

const ZGetPersonsAction = z.object({
  environmentId: ZId,
  offset: z.number().int().nonnegative(),
  searchValue: z.string().optional(),
});

export const getPersonsAction = authenticatedActionClient
  .schema(ZGetPersonsAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromEnvironmentId(parsedInput.environmentId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          minPermission: "read",
          projectId: await getProjectIdFromEnvironmentId(parsedInput.environmentId),
        },
      ],
    });

    return getPeople(parsedInput.environmentId, parsedInput.offset, parsedInput.searchValue);
  });

const ZPersonDeleteAction = z.object({
  personId: ZId,
});

export const deletePersonAction = authenticatedActionClient
  .schema(ZPersonDeleteAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: await getOrganizationIdFromPersonId(parsedInput.personId),
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          minPermission: "readWrite",
          projectId: await getProjectIdFromPersonId(parsedInput.personId),
        },
      ],
    });

    return await deletePerson(parsedInput.personId);
  });
