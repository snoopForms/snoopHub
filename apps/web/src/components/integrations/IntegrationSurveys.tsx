import {
  SegmentLogoImage,
  MixpanelLogoImage,
  AmplitudeLogoImage,
  PosthogLogoImage,
  JuneLogoImage,
  HeapLogoImage,
  HubspotLogoImage,
  SalesforceLogoImage,
  CustomerIOLogoImage,
  BrazeLogoImage,
} from "./LogoImages";
import IconCheckbox from "./IconCheckbox";
import ThankYouPage from "./ThankYouPage";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../LoadingSpinner";
import { FormbricksEngine } from "@formbricks/engine-react";

export const DataInSurvey = () => {
  const { data: session, status } = useSession();
  if (status === "loading") return <LoadingSpinner />;

  return (
    <FormbricksEngine
      formbricksUrl={
        process.env.NODE_ENV === "production" ? "https://app.formbricks.com" : "https://app.formbricks.com"
      }
      formId={
        process.env.NODE_ENV === "production" ? "cldudpq050000po0h2mdz0t6d" : "cldudpq050000po0h2mdz0t6d"
      }
      customer={{ email: session.user.email }}
      schema={{
        config: {
          progressBar: false,
        },
        pages: [
          {
            id: "DataInPage",
            config: {
              autoSubmit: false,
            },
            elements: [
              {
                id: "dataIn",
                type: "radio",
                name: "dataIn",
                options: [
                  { label: "Segment", value: "segment", frontend: { icon: SegmentLogoImage } },
                  {
                    label: "Mixpanel",
                    value: "mixpanel",
                    frontend: { icon: MixpanelLogoImage },
                  },
                  { label: "Amplitude", value: "amplitude", frontend: { icon: AmplitudeLogoImage } },
                  { label: "PostHog", value: "posthog", frontend: { icon: PosthogLogoImage } },
                  { label: "Heap", value: "heap", frontend: { icon: HeapLogoImage } },
                  { label: "June", value: "june", frontend: { icon: JuneLogoImage } },
                ],
                component: IconCheckbox,
              },
            ],
          },
          {
            id: "thankYouPage",
            endScreen: true,
            elements: [
              {
                id: "thankYou",
                type: "html",
                component: ThankYouPage,
              },
            ],
          },
        ],
      }}
    />
  );
};

export const DataOutSurvey = () => {
  const { data: session, status } = useSession();
  if (status === "loading") return <LoadingSpinner />;

  return (
    <FormbricksEngine
      formbricksUrl={
        process.env.NODE_ENV === "production" ? "https://app.formbricks.com" : "https://app.formbricks.com"
      }
      formId={
        process.env.NODE_ENV === "production" ? "cldudpq050000po0h2mdz0t6d" : "cldudpq050000po0h2mdz0t6d"
      }
      customer={{ email: session.user.email }}
      schema={{
        config: {
          progressBar: false,
        },
        pages: [
          {
            id: "DataInPage",
            config: {
              autoSubmit: false,
            },
            elements: [
              {
                id: "dataIn",
                type: "checkbox",
                name: "dataIn",
                options: [
                  { label: "Segment", value: "segment", frontend: { icon: SegmentLogoImage } },
                  {
                    label: "Hubspot",
                    value: "hubspot",
                    frontend: { icon: HubspotLogoImage },
                  },
                  { label: "customer.io", value: "customerio", frontend: { icon: CustomerIOLogoImage } },
                  { label: "Salesforce", value: "salesforce", frontend: { icon: SalesforceLogoImage } },
                  { label: "braze", value: "braze", frontend: { icon: BrazeLogoImage } },
                ],
                component: IconCheckbox,
              },
            ],
          },
          {
            id: "thankYouPage",
            endScreen: true,
            elements: [
              {
                id: "thankYou",
                type: "html",
                component: ThankYouPage,
              },
            ],
          },
        ],
      }}
    />
  );
};
