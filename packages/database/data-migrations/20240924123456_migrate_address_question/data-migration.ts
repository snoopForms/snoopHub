/* eslint-disable no-console -- logging is allowed in migration scripts */
import { PrismaClient } from "@prisma/client";
import {
  type TSurveyAddressQuestion,
  type TSurveyQuestion,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";

const prisma = new PrismaClient();
const TRANSACTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

async function runMigration(): Promise<void> {
  const startTime = Date.now();
  console.log("Starting data migration...");

  await prisma.$transaction(
    async (transactionPrisma) => {
      console.log("Starting data migration");

      const surveysWithAddressQuestion = await transactionPrisma.survey.findMany({
        where: {
          questions: {
            array_contains: [{ type: "address" }],
          },
        },
      });

      console.log(`Found ${surveysWithAddressQuestion.length.toString()} surveys with address questions`);

      const updationPromises = surveysWithAddressQuestion.map((survey) => {
        const updatedQuestions = survey.questions.map((question: TSurveyQuestion) => {
          if (question.type === TSurveyQuestionTypeEnum.Address) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- addressLine1 is not defined in TSurveyQuestin
            if (question.addressLine1 !== undefined) {
              return question;
            }

            const {
              isAddressLine1Required,
              isAddressLine2Required,
              isCityRequired,
              isStateRequired,
              isZipRequired,
              isCountryRequired,
              ...rest
            } = question as TSurveyAddressQuestion & {
              isAddressLine1Required: boolean;
              isAddressLine2Required: boolean;
              isCityRequired: boolean;
              isStateRequired: boolean;
              isZipRequired: boolean;
              isCountryRequired: boolean;
            };

            return {
              ...rest,
              addressLine1: { show: true, required: isAddressLine1Required },
              addressLine2: { show: true, required: isAddressLine2Required },
              city: { show: true, required: isCityRequired },
              state: { show: true, required: isStateRequired },
              zip: { show: true, required: isZipRequired },
              country: { show: true, required: isCountryRequired },
            };
          }

          return question;
        });

        return transactionPrisma.survey.update({
          where: {
            id: survey.id,
          },
          data: {
            questions: updatedQuestions,
          },
        });
      });

      await Promise.all(updationPromises);

      console.log("Data migration completed");
    },
    {
      timeout: TRANSACTION_TIMEOUT,
    }
  );

  const endTime = Date.now();
  console.log(`Data migration completed. Total time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
}

function handleError(error: unknown): void {
  console.error("An error occurred during migration:", error);
  process.exit(1);
}

function handleDisconnectError(): void {
  console.error("Failed to disconnect Prisma client");
  process.exit(1);
}

function main(): void {
  runMigration()
    .catch(handleError)
    .finally(() => {
      prisma.$disconnect().catch(handleDisconnectError);
    });
}

main();
