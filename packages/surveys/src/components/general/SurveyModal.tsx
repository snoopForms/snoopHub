import Modal from "@/components/wrappers/Modal";
import { SurveyModalProps } from "@/types/props";
import { useState } from "preact/hooks";

import { ResponseErrorComponent } from "./ResponseErrorComponent";
import { Survey } from "./Survey";

export function SurveyModal({
  survey,
  isBrandingEnabled,
  activeQuestionId,
  brandColor,
  placement,
  clickOutside,
  darkOverlay,
  highlightBorderColor,
  onDisplay = () => {},
  onActiveQuestionChange = () => {},
  onResponse = () => {},
  onClose = () => {},
  onFinished = () => {},
  onFileUpload,
  isRedirectDisabled = false,
  getHasFailedResponses = () => false,
  getResponseAccumulator,
  responseCount,
}: SurveyModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showResponseErrorComponent, setShowResponseErrorComponent] = useState(false);

  const responseAccumulator = getResponseAccumulator?.();

  const ErrorComponent = responseAccumulator ? (
    <ResponseErrorComponent
      responses={responseAccumulator.data}
      questions={survey.questions}
      brandColor={brandColor}
      supportEmail={survey.supportEmail}
    />
  ) : undefined;

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      const hasFailedResponses = getHasFailedResponses();
      if (hasFailedResponses && !showResponseErrorComponent) {
        setShowResponseErrorComponent(true);
        setIsOpen(true);
      } else {
        onClose();
      }
    }, 1000); // wait for animation to finish}
  };

  return (
    <div id="fbjs" className="formbricks-form">
      <Modal
        placement={placement}
        clickOutside={clickOutside}
        darkOverlay={darkOverlay}
        highlightBorderColor={highlightBorderColor}
        isOpen={isOpen}
        onClose={close}>
        <Survey
          survey={survey}
          isBrandingEnabled={isBrandingEnabled}
          brandColor={brandColor}
          activeQuestionId={activeQuestionId}
          onDisplay={onDisplay}
          onActiveQuestionChange={onActiveQuestionChange}
          onResponse={onResponse}
          onClose={close}
          onFinished={() => {
            onFinished();
            setTimeout(() => {
              if (!survey.redirectUrl) {
                close();
              }
            }, 3000); // close modal automatically after 3 seconds
          }}
          onFileUpload={onFileUpload}
          isRedirectDisabled={isRedirectDisabled}
          showErrorComponent={showResponseErrorComponent}
          errorComponent={ErrorComponent}
          responseCount={responseCount}
        />
      </Modal>
    </div>
  );
}
