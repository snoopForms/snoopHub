import { responses } from "@/lib/api/response";
import { transformErrorToDetails } from "@/lib/api/validator";
import { prisma } from "@formbricks/database";
import { WEBAPP_URL } from "@formbricks/lib/constants";
import { createAttributeClass, getAttributeClassByNameCached } from "@formbricks/lib/services/attributeClass";
import { getPersonCached } from "@formbricks/lib/services/person";
import { TJsState, ZJsPeopleAttributeInput } from "@formbricks/types/v1/js";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function OPTIONS(): Promise<NextResponse> {
  return responses.successResponse({}, true);
}

export async function POST(req: Request, { params }): Promise<NextResponse> {
  try {
    const { personId } = params;
    const jsonInput = await req.json();

    // validate using zod
    const inputValidation = ZJsPeopleAttributeInput.safeParse(jsonInput);

    if (!inputValidation.success) {
      return responses.badRequestResponse(
        "Fields are missing or incorrectly formatted",
        transformErrorToDetails(inputValidation.error),
        true
      );
    }

    const { environmentId, sessionId, key, value } = inputValidation.data;

    const existingPerson = await getPersonCached(personId);

    if (!existingPerson) {
      return responses.notFoundResponse("Person", personId, true);
    }

    let attributeClass = await getAttributeClassByNameCached(environmentId, key);

    // create new attribute class if not found
    if (attributeClass === null) {
      attributeClass = await createAttributeClass(environmentId, key, "code");
    }

    if (!attributeClass) {
      return responses.internalServerErrorResponse("Unable to create attribute class", true);
    }

    // upsert attribute (update or create)
    await prisma.attribute.upsert({
      where: {
        attributeClassId_personId: {
          attributeClassId: attributeClass.id,
          personId,
        },
      },
      update: {
        value,
      },
      create: {
        attributeClass: {
          connect: {
            id: attributeClass.id,
          },
        },
        person: {
          connect: {
            id: personId,
          },
        },
        value,
      },
    });

    // revalidate person
    revalidateTag(personId);

    const syncRes = await fetch(`${WEBAPP_URL}/api/v1/js/sync`, {
      method: "POST",
      body: JSON.stringify({
        environmentId,
        personId,
        sessionId,
      }),
    });

    if (!syncRes.ok) {
      throw new Error("Unable to get latest state from sync");
    }

    const syncJson = await syncRes.json();
    const state: TJsState = syncJson.data;

    return responses.successResponse({ ...state }, true);
  } catch (error) {
    console.error(error);
    return responses.internalServerErrorResponse(
      "Unable to complete response. See server logs for details.",
      true
    );
  }
}
