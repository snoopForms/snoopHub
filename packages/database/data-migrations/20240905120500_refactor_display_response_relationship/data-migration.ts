/* eslint-disable no-console -- logging is allowed in migration scripts */
import { type Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;
const TRANSACTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

async function runMigration(): Promise<void> {
  const startTime = Date.now();
  console.log("Starting data migration...");

  await prisma.$transaction(
    async (transactionPrisma) => {
      let totalResponseTransformed = 0;
      let totalDisplaysDeleted = 0;
      let totalDisplaysUpdated = 0;
      let cursor: { id: string } | undefined;

      // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition -- intentional infinite loop until no more displays
      while (true) {
        // Define the type for displays
        interface DisplayWithResponseId {
          id: string;
          responseId: string | null;
        }

        // Fetch displays in batches using cursor-based pagination
        const displays: DisplayWithResponseId[] = await transactionPrisma.display.findMany({
          where: {
            responseId: {
              not: null,
            },
          },
          select: {
            id: true,
            responseId: true,
          },
          orderBy: {
            id: "asc",
          },
          take: BATCH_SIZE,
          cursor,
          skip: cursor ? 1 : 0, // Skip the cursor itself
        });

        if (displays.length === 0) {
          console.log("No more displays found");
          break;
        }

        console.log(`Processing batch of ${String(displays.length)} displays...`);

        // Collect responseIds, filter out any nulls
        const responseIds = displays
          .map((display) => display.responseId)
          .filter((id): id is string => id !== null);

        // Define the type for responses
        interface ResponseIdOnly {
          id: string;
        }

        // Fetch existing responses
        const responses: ResponseIdOnly[] = await transactionPrisma.response.findMany({
          where: {
            id: {
              in: responseIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingResponseIds = new Set(responses.map((response) => response.id));

        // Collect data for updates and deletions
        const updateResponsePromises: Promise<Prisma.Response>[] = [];
        const updateDisplayPromises: Promise<Prisma.Display>[] = [];
        const displayIdsToDelete: string[] = [];

        for (const display of displays) {
          const responseId = display.responseId;
          if (responseId && existingResponseIds.has(responseId)) {
            updateResponsePromises.push(
              transactionPrisma.response.update({
                where: { id: responseId },
                data: { display: { connect: { id: display.id } } },
              })
            );
            updateDisplayPromises.push(
              transactionPrisma.display.update({
                where: { id: display.id },
                data: { responseId: null },
              })
            );
          } else {
            displayIdsToDelete.push(display.id);
          }
        }

        // Execute updates and deletions in parallel
        await Promise.all([
          ...updateResponsePromises,
          ...updateDisplayPromises,
          displayIdsToDelete.length > 0
            ? transactionPrisma.display.deleteMany({
                where: {
                  id: {
                    in: displayIdsToDelete,
                  },
                },
              })
            : Promise.resolve(),
        ]);

        // Update total counts
        totalResponseTransformed += updateResponsePromises.length;
        totalDisplaysDeleted += displayIdsToDelete.length;
        totalDisplaysUpdated += updateDisplayPromises.length;

        console.log(
          `Batch processed: ${ 
            String(updateResponsePromises.length) 
            } responses transformed, ${ 
            String(displayIdsToDelete.length) 
            } displays deleted`
        );
        console.log(`Total displays updated so far: ${  String(totalDisplaysUpdated)}`);

        // Move to the next batch
        cursor = { id: displays[displays.length - 1].id };
      }

      console.log(`${String(totalResponseTransformed)  } total responses transformed`);
      console.log(`${String(totalDisplaysUpdated)  } total displays updated`);
      console.log(`${String(totalDisplaysDeleted)  } total displays deleted`);
    },
    {
      timeout: TRANSACTION_TIMEOUT,
    }
  );

  const endTime = Date.now();
  console.log(`Data migration completed. Total time: ${  ((endTime - startTime) / 1000).toFixed(2)  }s`);
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
