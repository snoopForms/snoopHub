import { contactCache } from "@/lib/cache/contact";
import { updateAttributes } from "@/modules/ee/contacts/api/client/[environmentId]/contacts/[userId]/attributes/lib/attributes";
import { prisma } from "@formbricks/database";
import { getContactByUserIdWithAttributes } from "./contact";
import { getUserState } from "./user-state";

export const updateUser = async (
  environmentId: string,
  userId: string,
  device: "phone" | "desktop",
  attributes?: Record<string, string>
) => {
  let contact = await getContactByUserIdWithAttributes(environmentId, userId);

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        environment: {
          connect: {
            id: environmentId,
          },
        },
        attributes: {
          create: [
            {
              attributeKey: {
                connect: { key_environmentId: { key: "userId", environmentId } },
              },
              value: userId,
            },
          ],
        },
      },
      select: {
        id: true,
        attributes: {
          select: { attributeKey: { select: { key: true } }, value: true },
        },
      },
    });

    contactCache.revalidate({
      environmentId,
      userId,
      id: contact.id,
    });
  }

  let contactAttributes = contact.attributes.reduce(
    (acc, ctx) => {
      acc[ctx.attributeKey.key] = ctx.value;
      return acc;
    },
    {} as Record<string, string>
  );

  // update the contact attributes if needed:
  let messages: string[] = [];
  let language = contactAttributes.language;

  if (attributes && Object.keys(attributes).length > 0) {
    let shouldUpdate = false;
    const oldAttributes = contact.attributes.reduce(
      (acc, ctx) => {
        acc[ctx.attributeKey.key] = ctx.value;
        return acc;
      },
      {} as Record<string, string>
    );

    for (const [key, value] of Object.entries(attributes)) {
      if (value !== oldAttributes[key]) {
        shouldUpdate = true;
        break;
      }
    }

    if (shouldUpdate) {
      const { success, messages: updateAttrMessages } = await updateAttributes(
        contact.id,
        userId,
        environmentId,
        attributes
      );

      messages = updateAttrMessages ?? [];

      // If the attributes update was successful and the language attribute was provided, set the language
      if (success) {
        contactAttributes = {
          ...contactAttributes,
          ...attributes,
        };

        if (attributes.language) {
          language = attributes.language;
        }
      }
    }
  }

  const userState = await getUserState({
    environmentId,
    userId,
    contactId: contact.id,
    attributes: contactAttributes,
    device,
  });

  return {
    state: {
      ...userState,
      data: {
        ...userState.data,
        language,
      },
    },
    messages,
  };
};
