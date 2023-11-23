import { FormbricksAPI } from "@formbricks/api";
import { ResponseQueue } from "@formbricks/lib/responseQueue";
import SurveyState from "@formbricks/lib/surveyState";
import { renderSurveyModal } from "@formbricks/surveys";
import { TJSStateDisplay } from "@formbricks/types/js";
import { TResponseUpdate } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";
import { Config } from "./config";
import { ErrorHandler } from "./errors";
import { Logger } from "./logger";
import { filterPublicSurveys, sync } from "./sync";

const containerId = "formbricks-web-container";
const config = Config.getInstance();
const logger = Logger.getInstance();
const errorHandler = ErrorHandler.getInstance();
let surveyRunning = false;

export const renderWidget = (survey: TSurvey) => {
  if (surveyRunning) {
    logger.debug("A survey is already running. Skipping.");
    return;
  }
  surveyRunning = true;

  if (survey.delay) {
    logger.debug(`Delaying survey by ${survey.delay} seconds.`);
  }

  const product = config.get().state.product;

  const surveyState = new SurveyState(survey.id, null, null, config.get().state.person?.id);

  const responseQueue = new ResponseQueue(
    {
      apiHost: config.get().apiHost,
      environmentId: config.get().environmentId,
      retryAttempts: 2,
      onResponseSendingFailed: (response) => {
        alert(`Failed to send response: ${JSON.stringify(response, null, 2)}`);
      },
    },
    surveyState
  );

  const productOverwrites = survey.productOverwrites ?? {};
  const brandColor = productOverwrites.brandColor ?? product.brandColor;
  const highlightBorderColor = productOverwrites.highlightBorderColor ?? product.highlightBorderColor;
  const clickOutside = productOverwrites.clickOutsideClose ?? product.clickOutsideClose;
  const darkOverlay = productOverwrites.darkOverlay ?? product.darkOverlay;
  const placement = productOverwrites.placement ?? product.placement;
  const isBrandingEnabled = product.inAppSurveyBranding;

  setTimeout(() => {
    renderSurveyModal({
      survey: survey,
      brandColor,
      isBrandingEnabled: isBrandingEnabled,
      clickOutside,
      darkOverlay,
      highlightBorderColor,
      placement,
      onDisplay: async () => {
        // if config does not have a person, we store the displays in local storage
        if (!config.get().state.person || !config.get().state.person?.userId) {
          const localDisplay: TJSStateDisplay = {
            createdAt: new Date(),
            surveyId: survey.id,
            responded: false,
          };

          const existingDisplays = config.get().state.displays;
          const displays = existingDisplays ? [...existingDisplays, localDisplay] : [localDisplay];
          const previousConfig = config.get();
          let state = filterPublicSurveys({
            ...previousConfig.state,
            displays,
          });
          config.update({
            ...previousConfig,
            state,
          });
        }

        const api = new FormbricksAPI({
          apiHost: config.get().apiHost,
          environmentId: config.get().environmentId,
        });
        const res = await api.client.display.create({
          surveyId: survey.id,
          userId: config.get().state.person?.userId,
        });
        if (!res.ok) {
          throw new Error("Could not create display");
        }
        const { id } = res.data;

        surveyState.updateDisplayId(id);
        responseQueue.updateSurveyState(surveyState);
      },
      onResponse: (responseUpdate: TResponseUpdate) => {
        // if user is unidentified, update the display in local storage if not already updated
        if (!config.get().state.person || !config.get().state.person?.userId) {
          const displays = config.get().state.displays;
          const lastDisplay = displays && displays[displays.length - 1];
          if (!lastDisplay) {
            throw new Error("No lastDisplay found");
          }
          if (!lastDisplay.responded) {
            lastDisplay.responded = true;
            const previousConfig = config.get();
            let state = filterPublicSurveys({
              ...previousConfig.state,
              displays,
            });
            config.update({
              ...previousConfig,
              state,
            });
          }
        }

        if (config.get().state.person && config.get().state.person?.userId) {
          surveyState.updateUserId(config.get().state.person?.userId!);
        }
        responseQueue.updateSurveyState(surveyState);
        responseQueue.add({
          data: responseUpdate.data,
          finished: responseUpdate.finished,
        });
      },
      onClose: closeSurvey,
      onFileUpload: async (file: File, params) => {
        const api = new FormbricksAPI({
          apiHost: config.get().apiHost,
          environmentId: config.get().environmentId,
        });

        const uploadedUrl = await api.client.storage.uploadFile(file, params);
        console.log({
          uploadedUrl,
        });

        return uploadedUrl;
      },
    });
  }, survey.delay * 1000);
};

export const closeSurvey = async (): Promise<void> => {
  // remove container element from DOM
  document.getElementById(containerId)?.remove();
  addWidgetContainer();

  // if unidentified user, refilter the surveys
  if (!config.get().state.person || !config.get().state.person?.userId) {
    const state = config.get().state;
    const updatedState = filterPublicSurveys(state);
    config.update({
      ...config.get(),
      state: updatedState,
    });
    surveyRunning = false;
    return;
  }

  // for identified users we sync to get the latest surveys
  try {
    await sync({
      apiHost: config.get().apiHost,
      environmentId: config.get().environmentId,
      userId: config.get().state?.person?.userId,
    });
    surveyRunning = false;
  } catch (e) {
    errorHandler.handle(e);
  }
};

export const addWidgetContainer = (): void => {
  const containerElement = document.createElement("div");
  containerElement.id = containerId;
  document.body.appendChild(containerElement);
};
