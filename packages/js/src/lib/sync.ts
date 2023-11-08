import { TJsState, TJsSyncParams } from "@formbricks/types/js";
import { Config } from "./config";
import { NetworkError, Result, err, ok } from "./errors";
import { Logger } from "./logger";

const config = Config.getInstance();
const logger = Logger.getInstance();

let syncIntervalId: number | null = null;

const diffInDays = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const syncWithBackend = async ({
  apiHost,
  environmentId,
  userId,
}: TJsSyncParams): Promise<Result<TJsState, NetworkError>> => {
  const url = `${apiHost}/api/v1/client/in-app/${environmentId}/${userId}`;
  const publicUrl = `${apiHost}/api/v1/client/in-app/${environmentId}`;

  // if user id is available

  if (!userId) {
    // public survey
    const response = await fetch(publicUrl);

    if (!response.ok) {
      const jsonRes = await response.json();

      return err({
        code: "network_error",
        status: response.status,
        message: "Error syncing with backend",
        url,
        responseMessage: jsonRes.message,
      });
    }

    return ok((await response.json()).data as TJsState);
  }

  // userId is available, call the api with the `userId` param

  const response = await fetch(url);

  if (!response.ok) {
    const jsonRes = await response.json();

    return err({
      code: "network_error",
      status: response.status,
      message: "Error syncing with backend",
      url,
      responseMessage: jsonRes.message,
    });
  }

  const data = await response.json();
  const { data: state } = data;

  return ok(state as TJsState);
};

export const sync = async (params: TJsSyncParams): Promise<void> => {
  try {
    const syncResult = await syncWithBackend(params);
    if (syncResult?.ok !== true) {
      logger.error(`Sync failed: ${JSON.stringify(syncResult.error)}`);
      return;
    }

    const state = syncResult.value;
    let oldState: TJsState | undefined;
    try {
      oldState = config.get().state;
    } catch (e) {
      // ignore error
    }

    config.update({
      apiHost: params.apiHost,
      environmentId: params.environmentId,
      state,
    });

    // before finding the surveys, check for public use

    if (!state.person?.id) {
      // unidentified user
      // set the displays and filter out surveys
      const publicState = {
        ...state,
        displays: oldState?.displays || [],
      };

      const filteredState = filterPublicSurveys(publicState);

      // update config
      config.update({
        apiHost: params.apiHost,
        environmentId: params.environmentId,
        state: filteredState,
      });

      const surveyNames = filteredState.surveys.map((s) => s.name);
      logger.debug("Fetched " + surveyNames.length + " surveys during sync: " + surveyNames.join(", "));
    } else {
      const surveyNames = state.surveys.map((s) => s.name);
      logger.debug("Fetched " + surveyNames.length + " surveys during sync: " + surveyNames.join(", "));
    }
  } catch (error) {
    logger.error(`Error during sync: ${error}`);
  }
};

export const filterPublicSurveys = (state: TJsState): TJsState => {
  const { displays, product } = state;

  let { surveys } = state;
  surveys = surveys.filter((survey) => survey.status === "inProgress" && survey.type === "web");

  if (!displays) {
    return state;
  }

  // filter surveys that meet the displayOption criteria
  let filteredSurveys = surveys.filter((survey) => {
    if (survey.displayOption === "respondMultiple") {
      return true;
    } else if (survey.displayOption === "displayOnce") {
      return displays.filter((display) => display.surveyId === survey.id).length === 0;
    } else if (survey.displayOption === "displayMultiple") {
      return (
        displays.filter((display) => display.surveyId === survey.id && display.responseId !== null).length ===
        0
      );
    } else {
      throw Error("Invalid displayOption");
    }
  });

  const latestDisplay = displays[0];

  // filter surveys that meet the recontactDays criteria
  filteredSurveys = filteredSurveys.filter((survey) => {
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

  return {
    ...state,
    surveys: filteredSurveys,
  };
};

export const addSyncEventListener = (debug: boolean = false): void => {
  const updateInterval = debug ? 1000 * 60 : 1000 * 60 * 5; // 5 minutes in production, 1 minute in debug mode
  // add event listener to check sync with backend on regular interval
  if (typeof window !== "undefined" && syncIntervalId === null) {
    syncIntervalId = window.setInterval(async () => {
      await sync({
        apiHost: config.get().apiHost,
        environmentId: config.get().environmentId,
        userId: config.get().state?.person?.userId,
        // personId: config.get().state?.person?.id,
      });
    }, updateInterval);
  }
};

export const removeSyncEventListener = (): void => {
  if (typeof window !== "undefined" && syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);

    syncIntervalId = null;
  }
};
