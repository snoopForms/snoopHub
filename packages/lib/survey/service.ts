import "server-only";
import { Prisma } from "@prisma/client";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { TActionClass } from "@formbricks/types/action-classes";
import { ZOptionalNumber } from "@formbricks/types/common";
import { ZId } from "@formbricks/types/environment";
import { DatabaseError, InvalidInputError, ResourceNotFoundError } from "@formbricks/types/errors";
import { TLegacySurvey } from "@formbricks/types/legacy-surveys";
import { TPerson } from "@formbricks/types/people";
import { TSegment, ZSegmentFilters } from "@formbricks/types/segment";
import { TSurvey, TSurveyFilterCriteria, TSurveyInput, ZSurvey } from "@formbricks/types/surveys/types";
import { getActionsByPersonId } from "../action/service";
import { getActionClasses } from "../actionClass/service";
import { attributeCache } from "../attribute/cache";
import { getAttributes } from "../attribute/service";
import { cache } from "../cache";
import { ITEMS_PER_PAGE } from "../constants";
import { displayCache } from "../display/cache";
import { getDisplaysByPersonId } from "../display/service";
import { reverseTranslateSurvey } from "../i18n/reverseTranslation";
import { subscribeOrganizationMembersToSurveyResponses } from "../organization/service";
import { personCache } from "../person/cache";
import { getPerson } from "../person/service";
import { structuredClone } from "../pollyfills/structuredClone";
import { productCache } from "../product/cache";
import { getProductByEnvironmentId } from "../product/service";
import { responseCache } from "../response/cache";
import { segmentCache } from "../segment/cache";
import { createSegment, deleteSegment, evaluateSegment, getSegment, updateSegment } from "../segment/service";
import { transformSegmentFiltersToAttributeFilters } from "../segment/utils";
import { diffInDays } from "../utils/datetime";
import { validateInputs } from "../utils/validate";
import { surveyCache } from "./cache";
import { anySurveyHasFilters, buildOrderByClause, buildWhereClause, transformPrismaSurvey } from "./utils";

interface TriggerUpdate {
  create?: Array<{ actionClassId: string }>;
  deleteMany?: {
    actionClassId: {
      in: string[];
    };
  };
}

export const selectSurvey = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  type: true,
  environmentId: true,
  createdBy: true,
  status: true,
  welcomeCard: true,
  questions: true,
  thankYouCard: true,
  hiddenFields: true,
  displayOption: true,
  recontactDays: true,
  displayLimit: true,
  autoClose: true,
  runOnDate: true,
  closeOnDate: true,
  delay: true,
  displayPercentage: true,
  autoComplete: true,
  isVerifyEmailEnabled: true,
  redirectUrl: true,
  productOverwrites: true,
  styling: true,
  surveyClosedMessage: true,
  singleUse: true,
  pin: true,
  resultShareKey: true,
  showLanguageSwitch: true,
  languages: {
    select: {
      default: true,
      enabled: true,
      language: {
        select: {
          id: true,
          code: true,
          alias: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
  triggers: {
    select: {
      actionClass: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          environmentId: true,
          name: true,
          description: true,
          type: true,
          key: true,
          noCodeConfig: true,
        },
      },
    },
  },
  segment: {
    include: {
      surveys: {
        select: {
          id: true,
        },
      },
    },
  },
};

const checkTriggersValidity = (triggers: TSurvey["triggers"], actionClasses: TActionClass[]) => {
  if (!triggers) return;

  // check if all the triggers are valid
  triggers.forEach((trigger) => {
    if (!actionClasses.find((actionClass) => actionClass.id === trigger.actionClass.id)) {
      throw new InvalidInputError("Invalid trigger id");
    }
  });

  // check if all the triggers are unique
  const triggerIds = triggers.map((trigger) => trigger.actionClass.id);

  if (new Set(triggerIds).size !== triggerIds.length) {
    throw new InvalidInputError("Duplicate trigger id");
  }
};

const handleTriggerUpdates = (
  updatedTriggers: TSurvey["triggers"],
  currentTriggers: TSurvey["triggers"],
  actionClasses: TActionClass[]
) => {
  if (!updatedTriggers) return {};
  checkTriggersValidity(updatedTriggers, actionClasses);

  const currentTriggerIds = currentTriggers.map((trigger) => trigger.actionClass.id);
  const updatedTriggerIds = updatedTriggers.map((trigger) => trigger.actionClass.id);

  // added triggers are triggers that are not in the current triggers and are there in the new triggers
  const addedTriggers = updatedTriggers.filter(
    (trigger) => !currentTriggerIds.includes(trigger.actionClass.id)
  );

  // deleted triggers are triggers that are not in the new triggers and are there in the current triggers
  const deletedTriggers = currentTriggers.filter(
    (trigger) => !updatedTriggerIds.includes(trigger.actionClass.id)
  );

  // Construct the triggers update object
  const triggersUpdate: TriggerUpdate = {};

  if (addedTriggers.length > 0) {
    triggersUpdate.create = addedTriggers.map((trigger) => ({
      actionClassId: trigger.actionClass.id,
    }));
  }

  if (deletedTriggers.length > 0) {
    // disconnect the public triggers from the survey
    triggersUpdate.deleteMany = {
      actionClassId: {
        in: deletedTriggers.map((trigger) => trigger.actionClass.id),
      },
    };
  }

  [...addedTriggers, ...deletedTriggers].forEach((trigger) => {
    surveyCache.revalidate({
      actionClassId: trigger.actionClass.id,
    });
  });

  return triggersUpdate;
};

export const getSurvey = reactCache(
  (surveyId: string): Promise<TSurvey | null> =>
    cache(
      async () => {
        validateInputs([surveyId, ZId]);

        let surveyPrisma;
        try {
          surveyPrisma = await prisma.survey.findUnique({
            where: {
              id: surveyId,
            },
            select: selectSurvey,
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
            throw new DatabaseError(error.message);
          }
          throw error;
        }

        if (!surveyPrisma) {
          return null;
        }

        return transformPrismaSurvey(surveyPrisma);
      },
      [`getSurvey-${surveyId}`],
      {
        tags: [surveyCache.tag.byId(surveyId)],
      }
    )()
);

export const getSurveysByActionClassId = reactCache(
  (actionClassId: string, page?: number): Promise<TSurvey[]> =>
    cache(
      async () => {
        validateInputs([actionClassId, ZId], [page, ZOptionalNumber]);

        let surveysPrisma;
        try {
          surveysPrisma = await prisma.survey.findMany({
            where: {
              triggers: {
                some: {
                  actionClass: {
                    id: actionClassId,
                  },
                },
              },
            },
            select: selectSurvey,
            take: page ? ITEMS_PER_PAGE : undefined,
            skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
            throw new DatabaseError(error.message);
          }

          throw error;
        }

        const surveys: TSurvey[] = [];

        for (const surveyPrisma of surveysPrisma) {
          const transformedSurvey = transformPrismaSurvey(surveyPrisma);
          surveys.push(transformedSurvey);
        }

        return surveys;
      },
      [`getSurveysByActionClassId-${actionClassId}-${page}`],
      {
        tags: [surveyCache.tag.byActionClassId(actionClassId)],
      }
    )()
);

export const getSurveys = reactCache(
  (
    environmentId: string,
    limit?: number,
    offset?: number,
    filterCriteria?: TSurveyFilterCriteria
  ): Promise<TSurvey[]> =>
    cache(
      async () => {
        validateInputs([environmentId, ZId], [limit, ZOptionalNumber], [offset, ZOptionalNumber]);
        let surveysPrisma;

        try {
          surveysPrisma = await prisma.survey.findMany({
            where: {
              environmentId,
              ...buildWhereClause(filterCriteria),
            },
            select: selectSurvey,
            orderBy: buildOrderByClause(filterCriteria?.sortBy),
            take: limit ? limit : undefined,
            skip: offset ? offset : undefined,
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
            throw new DatabaseError(error.message);
          }

          throw error;
        }

        const surveys: TSurvey[] = [];

        for (const surveyPrisma of surveysPrisma) {
          const transformedSurvey = transformPrismaSurvey(surveyPrisma);
          surveys.push(transformedSurvey);
        }
        return surveys;
      },
      [`getSurveys-${environmentId}-${limit}-${offset}-${JSON.stringify(filterCriteria)}`],
      {
        tags: [surveyCache.tag.byEnvironmentId(environmentId)],
      }
    )()
);

export const transformToLegacySurvey = async (
  survey: TSurvey,
  languageCode?: string
): Promise<TLegacySurvey> => {
  const targetLanguage = languageCode ?? "default";

  // workaround to handle triggers for legacy surveys
  // because we dont wanna do this in the `reverseTranslateSurvey` function
  const surveyToTransform: any = {
    ...structuredClone(survey),
    triggers: survey.triggers.map((trigger) => trigger.actionClass.name),
  };

  const transformedSurvey = reverseTranslateSurvey(surveyToTransform as TSurvey, targetLanguage);
  return transformedSurvey;
};

export const getSurveyCount = reactCache(
  (environmentId: string): Promise<number> =>
    cache(
      async () => {
        validateInputs([environmentId, ZId]);
        try {
          const surveyCount = await prisma.survey.count({
            where: {
              environmentId: environmentId,
            },
          });

          return surveyCount;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
            throw new DatabaseError(error.message);
          }

          throw error;
        }
      },
      [`getSurveyCount-${environmentId}`],
      {
        tags: [surveyCache.tag.byEnvironmentId(environmentId)],
      }
    )()
);

export const updateSurvey = async (updatedSurvey: TSurvey): Promise<TSurvey> => {
  validateInputs([updatedSurvey, ZSurvey]);

  try {
    const surveyId = updatedSurvey.id;
    let data: any = {};

    const actionClasses = await getActionClasses(updatedSurvey.environmentId);
    const currentSurvey = await getSurvey(surveyId);

    if (!currentSurvey) {
      throw new ResourceNotFoundError("Survey", surveyId);
    }

    const { triggers, environmentId, segment, questions, languages, type, ...surveyData } = updatedSurvey;

    if (languages) {
      // Process languages update logic here
      // Extract currentLanguageIds and updatedLanguageIds
      const currentLanguageIds = currentSurvey.languages
        ? currentSurvey.languages.map((l) => l.language.id)
        : [];
      const updatedLanguageIds =
        languages.length > 1 ? updatedSurvey.languages.map((l) => l.language.id) : [];
      const enabledLanguageIds = languages.map((language) => {
        if (language.enabled) return language.language.id;
      });

      // Determine languages to add and remove
      const languagesToAdd = updatedLanguageIds.filter((id) => !currentLanguageIds.includes(id));
      const languagesToRemove = currentLanguageIds.filter((id) => !updatedLanguageIds.includes(id));

      const defaultLanguageId = updatedSurvey.languages.find((l) => l.default)?.language.id;

      // Prepare data for Prisma update
      data.languages = {};

      // Update existing languages for default value changes
      data.languages.updateMany = currentSurvey.languages.map((surveyLanguage) => ({
        where: { languageId: surveyLanguage.language.id },
        data: {
          default: surveyLanguage.language.id === defaultLanguageId,
          enabled: enabledLanguageIds.includes(surveyLanguage.language.id),
        },
      }));

      // Add new languages
      if (languagesToAdd.length > 0) {
        data.languages.create = languagesToAdd.map((languageId) => ({
          languageId: languageId,
          default: languageId === defaultLanguageId,
          enabled: enabledLanguageIds.includes(languageId),
        }));
      }

      // Remove languages no longer associated with the survey
      if (languagesToRemove.length > 0) {
        data.languages.deleteMany = languagesToRemove.map((languageId) => ({
          languageId: languageId,
          enabled: enabledLanguageIds.includes(languageId),
        }));
      }
    }

    if (triggers) {
      data.triggers = handleTriggerUpdates(triggers, currentSurvey.triggers, actionClasses);
    }

    // if the survey body has type other than "app" but has a private segment, we delete that segment, and if it has a public segment, we disconnect from to the survey
    if (segment) {
      if (type === "app") {
        // parse the segment filters:
        const parsedFilters = ZSegmentFilters.safeParse(segment.filters);
        if (!parsedFilters.success) {
          throw new InvalidInputError("Invalid user segment filters");
        }

        try {
          await updateSegment(segment.id, segment);
        } catch (error) {
          console.error(error);
          throw new Error("Error updating survey");
        }
      } else {
        if (segment.isPrivate) {
          await deleteSegment(segment.id);
        } else {
          await prisma.survey.update({
            where: {
              id: surveyId,
            },
            data: {
              segment: {
                disconnect: true,
              },
            },
          });
        }
      }

      segmentCache.revalidate({
        id: segment.id,
        environmentId: segment.environmentId,
      });
    }
    data.questions = questions.map((question) => {
      const { isDraft, ...rest } = question;
      return rest;
    });

    surveyData.updatedAt = new Date();

    data = {
      ...surveyData,
      ...data,
      type,
    };

    // Remove scheduled status when runOnDate is not set
    if (data.status === "scheduled" && data.runOnDate === null) {
      data.status = "inProgress";
    }
    // Set scheduled status when runOnDate is set and in the future on completed surveys
    if (
      (data.status === "completed" || data.status === "paused" || data.status === "inProgress") &&
      data.runOnDate &&
      data.runOnDate > new Date()
    ) {
      data.status = "scheduled";
    }

    const prismaSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data,
      select: selectSurvey,
    });

    let surveySegment: TSegment | null = null;
    if (prismaSurvey.segment) {
      surveySegment = {
        ...prismaSurvey.segment,
        surveys: prismaSurvey.segment.surveys.map((survey) => survey.id),
      };
    }

    // TODO: Fix this, this happens because the survey type "web" is no longer in the zod types but its required in the schema for migration
    // @ts-expect-error
    const modifiedSurvey: TSurvey = {
      ...prismaSurvey, // Properties from prismaSurvey
      displayPercentage: Number(prismaSurvey.displayPercentage) || null,
      segment: surveySegment,
    };

    surveyCache.revalidate({
      id: modifiedSurvey.id,
      environmentId: modifiedSurvey.environmentId,
      segmentId: modifiedSurvey.segment?.id,
      resultShareKey: modifiedSurvey.resultShareKey ?? undefined,
    });

    return modifiedSurvey;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const deleteSurvey = async (surveyId: string) => {
  validateInputs([surveyId, ZId]);

  try {
    const deletedSurvey = await prisma.survey.delete({
      where: {
        id: surveyId,
      },
      select: selectSurvey,
    });

    if (deletedSurvey.type === "app" && deletedSurvey.segment?.isPrivate) {
      const deletedSegment = await prisma.segment.delete({
        where: {
          id: deletedSurvey.segment.id,
        },
      });

      if (deletedSegment) {
        segmentCache.revalidate({
          id: deletedSegment.id,
          environmentId: deletedSurvey.environmentId,
        });
      }
    }

    responseCache.revalidate({
      surveyId,
      environmentId: deletedSurvey.environmentId,
    });
    surveyCache.revalidate({
      id: deletedSurvey.id,
      environmentId: deletedSurvey.environmentId,
      resultShareKey: deletedSurvey.resultShareKey ?? undefined,
    });

    if (deletedSurvey.segment?.id) {
      segmentCache.revalidate({
        id: deletedSurvey.segment.id,
        environmentId: deletedSurvey.environmentId,
      });
    }

    // Revalidate public triggers by actionClassId
    deletedSurvey.triggers.forEach((trigger) => {
      surveyCache.revalidate({
        actionClassId: trigger.actionClass.id,
      });
    });

    return deletedSurvey;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const createSurvey = async (environmentId: string, surveyBody: TSurveyInput): Promise<TSurvey> => {
  validateInputs([environmentId, ZId]);

  try {
    const createdBy = surveyBody.createdBy;
    delete surveyBody.createdBy;

    const actionClasses = await getActionClasses(environmentId);
    const data: Omit<Prisma.SurveyCreateInput, "environment"> = {
      ...surveyBody,
      // TODO: Create with attributeFilters
      triggers: surveyBody.triggers
        ? handleTriggerUpdates(surveyBody.triggers, [], actionClasses)
        : undefined,
      attributeFilters: undefined,
    };

    if ((surveyBody.type === "website" || surveyBody.type === "app") && data.thankYouCard) {
      data.thankYouCard.buttonLabel = undefined;
      data.thankYouCard.buttonLink = undefined;
    }

    if (createdBy) {
      data.creator = {
        connect: {
          id: createdBy,
        },
      };
    }

    const survey = await prisma.survey.create({
      data: {
        ...data,
        environment: {
          connect: {
            id: environmentId,
          },
        },
      },
      select: selectSurvey,
    });

    // if the survey created is an "app" survey, we also create a private segment for it.
    if (survey.type === "app") {
      const newSegment = await createSegment({
        environmentId,
        surveyId: survey.id,
        filters: [],
        title: survey.id,
        isPrivate: true,
      });

      await prisma.survey.update({
        where: {
          id: survey.id,
        },
        data: {
          segment: {
            connect: {
              id: newSegment.id,
            },
          },
        },
      });

      segmentCache.revalidate({
        id: newSegment.id,
        environmentId: survey.environmentId,
      });
    }

    // TODO: Fix this, this happens because the survey type "web" is no longer in the zod types but its required in the schema for migration
    // @ts-expect-error
    const transformedSurvey: TSurvey = {
      ...survey,
      ...(survey.segment && {
        segment: {
          ...survey.segment,
          surveys: survey.segment.surveys.map((survey) => survey.id),
        },
      }),
    };

    surveyCache.revalidate({
      id: survey.id,
      environmentId: survey.environmentId,
      resultShareKey: survey.resultShareKey ?? undefined,
    });

    if (createdBy) {
      await subscribeOrganizationMembersToSurveyResponses(survey.id, createdBy);
    }

    return transformedSurvey;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const duplicateSurvey = async (environmentId: string, surveyId: string, userId: string) => {
  validateInputs([environmentId, ZId], [surveyId, ZId]);

  try {
    const existingSurvey = await getSurvey(surveyId);
    const currentDate = new Date();
    if (!existingSurvey) {
      throw new ResourceNotFoundError("Survey", surveyId);
    }

    const defaultLanguageId = existingSurvey.languages.find((l) => l.default)?.language.id;

    // create new survey with the data of the existing survey
    const newSurvey = await prisma.survey.create({
      data: {
        ...existingSurvey,
        id: undefined, // id is auto-generated
        environmentId: undefined, // environmentId is set below
        createdAt: currentDate,
        updatedAt: currentDate,
        createdBy: undefined,
        name: `${existingSurvey.name} (copy)`,
        status: "draft",
        questions: structuredClone(existingSurvey.questions),
        thankYouCard: structuredClone(existingSurvey.thankYouCard),
        languages: {
          create: existingSurvey.languages?.map((surveyLanguage) => ({
            languageId: surveyLanguage.language.id,
            default: surveyLanguage.language.id === defaultLanguageId,
          })),
        },
        triggers: {
          create: existingSurvey.triggers.map((trigger) => ({
            actionClassId: trigger.actionClass.id,
          })),
        },
        environment: {
          connect: {
            id: environmentId,
          },
        },
        creator: {
          connect: {
            id: userId,
          },
        },
        surveyClosedMessage: existingSurvey.surveyClosedMessage
          ? structuredClone(existingSurvey.surveyClosedMessage)
          : Prisma.JsonNull,
        singleUse: existingSurvey.singleUse ? structuredClone(existingSurvey.singleUse) : Prisma.JsonNull,
        productOverwrites: existingSurvey.productOverwrites
          ? structuredClone(existingSurvey.productOverwrites)
          : Prisma.JsonNull,
        styling: existingSurvey.styling ? structuredClone(existingSurvey.styling) : Prisma.JsonNull,
        // we'll update the segment later
        segment: undefined,
      },
    });

    // if the existing survey has an inline segment, we copy the filters and create a new inline segment and connect it to the new survey
    if (existingSurvey.segment) {
      if (existingSurvey.segment.isPrivate) {
        const newInlineSegment = await createSegment({
          environmentId,
          title: `${newSurvey.id}`,
          isPrivate: true,
          surveyId: newSurvey.id,
          filters: existingSurvey.segment.filters,
        });

        await prisma.survey.update({
          where: {
            id: newSurvey.id,
          },
          data: {
            segment: {
              connect: {
                id: newInlineSegment.id,
              },
            },
          },
        });

        segmentCache.revalidate({
          id: newInlineSegment.id,
          environmentId: newSurvey.environmentId,
        });
      } else {
        await prisma.survey.update({
          where: {
            id: newSurvey.id,
          },
          data: {
            segment: {
              connect: {
                id: existingSurvey.segment.id,
              },
            },
          },
        });

        segmentCache.revalidate({
          id: existingSurvey.segment.id,
          environmentId: newSurvey.environmentId,
        });
      }
    }

    surveyCache.revalidate({
      id: newSurvey.id,
      environmentId: newSurvey.environmentId,
      resultShareKey: newSurvey.resultShareKey ?? undefined,
    });

    existingSurvey.triggers.forEach((trigger) => {
      surveyCache.revalidate({
        actionClassId: trigger.actionClass.id,
      });
    });

    return newSurvey;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const getSyncSurveys = reactCache(
  (
    environmentId: string,
    personId: string,
    deviceType: "phone" | "desktop" = "desktop",
    options?: {
      version?: string;
    }
  ): Promise<TSurvey[] | TLegacySurvey[]> =>
    cache(
      async () => {
        validateInputs([environmentId, ZId]);
        try {
          const product = await getProductByEnvironmentId(environmentId);

          if (!product) {
            throw new Error("Product not found");
          }

          const person = personId === "legacy" ? ({ id: "legacy" } as TPerson) : await getPerson(personId);

          if (!person) {
            throw new Error("Person not found");
          }

          let surveys: TSurvey[] | TLegacySurvey[] = await getSurveys(environmentId);

          // filtered surveys for running and web
          surveys = surveys.filter((survey) => survey.status === "inProgress" && survey.type === "app");

          // if no surveys are left, return an empty array
          if (surveys.length === 0) {
            return [];
          }

          const displays = await getDisplaysByPersonId(person.id);

          // filter surveys that meet the displayOption criteria
          surveys = surveys.filter((survey) => {
            switch (survey.displayOption) {
              case "respondMultiple":
                return true;
              case "displayOnce":
                return displays.filter((display) => display.surveyId === survey.id).length === 0;
              case "displayMultiple":
                return (
                  displays
                    .filter((display) => display.surveyId === survey.id)
                    .filter((display) => display.responseId).length === 0
                );
              case "displaySome":
                if (survey.displayLimit === null) {
                  return true;
                }

                if (
                  displays
                    .filter((display) => display.surveyId === survey.id)
                    .some((display) => display.responseId)
                ) {
                  return false;
                }

                return (
                  displays.filter((display) => display.surveyId === survey.id).length < survey.displayLimit
                );
              default:
                throw Error("Invalid displayOption");
            }
          });

          const latestDisplay = displays[0];

          // filter surveys that meet the recontactDays criteria
          surveys = surveys.filter((survey) => {
            if (!latestDisplay) {
              return true;
            } else if (survey.recontactDays !== null) {
              const lastDisplaySurvey = displays.filter((display) => display.surveyId === survey.id)[0];
              if (!lastDisplaySurvey) {
                return true;
              }
              return diffInDays(new Date(), new Date(lastDisplaySurvey.createdAt)) >= survey.recontactDays;
            } else if (product.recontactDays !== null) {
              return diffInDays(new Date(), new Date(latestDisplay.createdAt)) >= product.recontactDays;
            } else {
              return true;
            }
          });

          // if no surveys are left, return an empty array
          if (surveys.length === 0) {
            return [];
          }

          // if no surveys have segment filters, return the surveys
          if (!anySurveyHasFilters(surveys)) {
            return surveys;
          }

          const personActions = await getActionsByPersonId(person.id);
          const personActionClassIds = Array.from(
            new Set(personActions?.map((action) => action.actionClass?.id ?? ""))
          );

          const attributes = await getAttributes(person.id);
          const personUserId = person.userId;

          // the surveys now have segment filters, so we need to evaluate them
          const surveyPromises = surveys.map(async (survey) => {
            const { segment } = survey;
            // if the survey has no segment, or the segment has no filters, we return the survey
            if (!segment || !segment.filters?.length) {
              return survey;
            }

            // backwards compatibility for older versions of the js package
            // if the version is not provided, we will use the old method of evaluating the segment, which is attribute filters
            // transform the segment filters to attribute filters and evaluate them
            if (!options?.version) {
              const attributeFilters = transformSegmentFiltersToAttributeFilters(segment.filters);

              // if the attribute filters are null, it means the segment filters don't match the expected format for attribute filters, so we skip this survey
              if (attributeFilters === null) {
                return null;
              }

              // if there are no attribute filters, we return the survey
              if (!attributeFilters.length) {
                return survey;
              }

              // we check if the person meets the attribute filters for all the attribute filters
              const isEligible = attributeFilters.every((attributeFilter) => {
                const personAttributeValue = attributes[attributeFilter.attributeClassName];
                if (!personAttributeValue) {
                  return false;
                }

                if (attributeFilter.operator === "equals") {
                  return personAttributeValue === attributeFilter.value;
                } else if (attributeFilter.operator === "notEquals") {
                  return personAttributeValue !== attributeFilter.value;
                } else {
                  // if the operator is not equals or not equals, we skip the survey, this means that new segment filter options are being used
                  return false;
                }
              });

              return isEligible ? survey : null;
            }

            // Evaluate the segment filters
            const result = await evaluateSegment(
              {
                attributes: attributes ?? {},
                actionIds: personActionClassIds,
                deviceType,
                environmentId,
                personId: person.id,
                userId: personUserId,
              },
              segment.filters
            );

            return result ? survey : null;
          });

          const resolvedSurveys = await Promise.all(surveyPromises);
          surveys = resolvedSurveys.filter((survey) => !!survey) as TSurvey[];

          if (!surveys) {
            throw new ResourceNotFoundError("Survey", environmentId);
          }
          return surveys;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
            throw new DatabaseError(error.message);
          }

          throw error;
        }
      },
      [`getSyncSurveys-${environmentId}-${personId}`],
      {
        tags: [
          personCache.tag.byEnvironmentId(environmentId),
          personCache.tag.byId(personId),
          displayCache.tag.byPersonId(personId),
          surveyCache.tag.byEnvironmentId(environmentId),
          productCache.tag.byEnvironmentId(environmentId),
          attributeCache.tag.byPersonId(personId),
        ],
      }
    )()
);

export const getSurveyIdByResultShareKey = reactCache(
  (resultShareKey: string): Promise<string | null> =>
    cache(
      async () => {
        try {
          const survey = await prisma.survey.findFirst({
            where: {
              resultShareKey,
            },
            select: {
              id: true,
            },
          });

          if (!survey) {
            return null;
          }

          return survey.id;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DatabaseError(error.message);
          }

          throw error;
        }
      },
      [`getSurveyIdByResultShareKey-${resultShareKey}`],
      {
        tags: [surveyCache.tag.byResultShareKey(resultShareKey)],
      }
    )()
);

export const loadNewSegmentInSurvey = async (surveyId: string, newSegmentId: string): Promise<TSurvey> => {
  validateInputs([surveyId, ZId], [newSegmentId, ZId]);
  try {
    const currentSurvey = await getSurvey(surveyId);
    if (!currentSurvey) {
      throw new ResourceNotFoundError("survey", surveyId);
    }

    const currentSegment = await getSegment(newSegmentId);
    if (!currentSegment) {
      throw new ResourceNotFoundError("segment", newSegmentId);
    }

    const prismaSurvey = await prisma.survey.update({
      where: {
        id: surveyId,
      },
      select: selectSurvey,
      data: {
        segment: {
          connect: {
            id: newSegmentId,
          },
        },
      },
    });

    segmentCache.revalidate({ id: newSegmentId });
    surveyCache.revalidate({ id: surveyId });

    let surveySegment: TSegment | null = null;
    if (prismaSurvey.segment) {
      surveySegment = {
        ...prismaSurvey.segment,
        surveys: prismaSurvey.segment.surveys.map((survey) => survey.id),
      };
    }

    // TODO: Fix this, this happens because the survey type "web" is no longer in the zod types but its required in the schema for migration
    // @ts-expect-error
    const modifiedSurvey: TSurvey = {
      ...prismaSurvey, // Properties from prismaSurvey
      segment: surveySegment,
    };

    return modifiedSurvey;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const getSurveysBySegmentId = reactCache(
  (segmentId: string): Promise<TSurvey[]> =>
    cache(
      async () => {
        try {
          const surveysPrisma = await prisma.survey.findMany({
            where: { segmentId },
            select: selectSurvey,
          });

          const surveys: TSurvey[] = [];

          for (const surveyPrisma of surveysPrisma) {
            const transformedSurvey = transformPrismaSurvey(surveyPrisma);
            surveys.push(transformedSurvey);
          }

          return surveys;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DatabaseError(error.message);
          }

          throw error;
        }
      },
      [`getSurveysBySegmentId-${segmentId}`],
      {
        tags: [surveyCache.tag.bySegmentId(segmentId), segmentCache.tag.byId(segmentId)],
      }
    )()
);
