import { diffInDays } from "@formbricks/lib/utils/datetime";
import { TJsConfig, TJsState, TJsStateSync, TJsSyncParams } from "@formbricks/types/js";

import { Config, LOCAL_STORAGE_KEY } from "./config";
import { NetworkError, Result, err, ok, wrapThrows } from "./errors";
import { Logger } from "./logger";
import { getIsDebug } from "./utils";

const config = Config.getInstance();
const logger = Logger.getInstance();

let syncIntervalId: number | null = null;

const syncWithBackend = async (
  { apiHost, environmentId, userId }: TJsSyncParams,
  noCache: boolean
): Promise<Result<TJsStateSync, NetworkError>> => {
  const baseUrl = `${apiHost}/api/v1/client/${environmentId}/in-app/sync`;
  const urlSuffix = `?version=${import.meta.env.VERSION}`;

  let fetchOptions: RequestInit = {};

  if (noCache || getIsDebug()) {
    fetchOptions.cache = "no-cache";
    logger.debug("No cache option set for sync");
  }

  // if user id is not available

  if (!userId) {
    const url = baseUrl + urlSuffix;
    // public survey
    const response = await fetch(url, fetchOptions);

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

  const url = `${baseUrl}/${userId}${urlSuffix}`;

  const response = await fetch(url, fetchOptions);

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

  return ok(state as TJsStateSync);
};

export const sync = async (params: TJsSyncParams, noCache = false): Promise<void> => {
  try {
    const syncResult = await syncWithBackend(params, noCache);

    if (syncResult?.ok !== true) {
      let existingConfig: TJsConfig;

      // two cases:
      // 1. This is the first sync call, the config is not yet initialized
      // 2. The config is already initialized, but the sync call failed

      try {
        existingConfig = config.get();
      } catch (e) {
        // case 1 -> config is not yet initialized
        // we initialize the config with only a "status" field set to "error"
        // and an expiry time of 10 minutes in the future
        const initialErrorConfig: Partial<TJsConfig> = {
          status: "error",
          expiresAt: new Date(new Date().getTime() + 10 * 60000),
        };

        // can't use config.update here because the config is not yet initialized
        wrapThrows(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialErrorConfig)))();
        throw syncResult.error;
      }

      // case 2 -> config is already initialized, but the sync call failed
      if (existingConfig.state) {
        // just extending the config
        config.update(existingConfig);
      }

      throw syncResult.error;
    }

    let oldState: TJsState | undefined;
    try {
      oldState = config.get().state;
    } catch (e) {
      // ignore error
    }

    let state: TJsState = {
      surveys: syncResult.value.surveys,
      noCodeActionClasses: syncResult.value.noCodeActionClasses,
      product: syncResult.value.product,
      attributes: syncResult.value.person?.attributes || {},
    };

    if (!params.userId) {
      // unidentified user
      // set the displays and filter out surveys
      state = {
        ...state,
        displays: oldState?.displays || [],
      };
      state = filterPublicSurveys(state);

      const surveyNames = state.surveys.map((s) => s.name);
      logger.debug("Fetched " + surveyNames.length + " surveys during sync: " + surveyNames.join(", "));
    } else {
      const surveyNames = state.surveys.map((s) => s.name);
      logger.debug("Fetched " + surveyNames.length + " surveys during sync: " + surveyNames.join(", "));
    }

    config.update({
      apiHost: params.apiHost,
      environmentId: params.environmentId,
      userId: params.userId,
      state,
    });
  } catch (error) {
    logger.error(`Error during sync: ${error}`);
    throw error;
  }
};

export const filterPublicSurveys = (state: TJsState): TJsState => {
  const { displays, product } = state;

  let { surveys } = state;

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
      return displays.filter((display) => display.surveyId === survey.id && display.responded).length === 0;
    } else {
      throw Error("Invalid displayOption");
    }
  });

  const latestDisplay = displays.length > 0 ? displays[displays.length - 1] : undefined;

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

export const addExpiryCheckListener = (): void => {
  const updateInterval = 1000 * 30; // every 30 seconds
  // add event listener to check sync with backend on regular interval
  if (typeof window !== "undefined" && syncIntervalId === null) {
    syncIntervalId = window.setInterval(async () => {
      // check if the config has not expired yet
      if (config.get().expiresAt && new Date(config.get().expiresAt) >= new Date()) {
        return;
      }
      logger.debug("Config has expired. Starting sync.");
      await sync({
        apiHost: config.get().apiHost,
        environmentId: config.get().environmentId,
        userId: config.get().userId,
      });
    }, updateInterval);
  }
};

export const removeExpiryCheckListener = (): void => {
  if (typeof window !== "undefined" && syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);

    syncIntervalId = null;
  }
};
