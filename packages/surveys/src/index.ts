import { h, render } from "preact";
import { Survey } from "./components/Survey";
import { SurveyModal } from "./components/SurveyModal";
import { addStylesToDom } from "./lib/styles";
import { SurveyInlineProps, SurveyModalProps } from "./types/props";

export const renderSurveyInline = (props: SurveyInlineProps) => {
  addStylesToDom();
  const { containerId, ...surveyProps } = props;
  const element = document.getElementById(containerId);
  if (!element) {
    throw new Error(`renderSurvey: Element with id ${containerId} not found.`);
  }
  render(h(Survey, surveyProps), element);
};

export const renderSurveyModal = (props: SurveyModalProps) => {
  addStylesToDom();
  // add container element to DOM
  const element = document.createElement("div");
  element.id = "formbricks-modal-container";
  document.body.appendChild(element);
  render(h(SurveyModal, props), element);
};
