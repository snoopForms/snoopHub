"use client";

import { AddIntegrationModal } from "@/app/(app)/environments/[environmentId]/integrations/notion/components/AddIntegrationModal";
import { ManageIntegration } from "@/app/(app)/environments/[environmentId]/integrations/notion/components/ManageIntegration";
import formbricksLogo from "@/images/logo.svg";
import notionLogo from "@/images/notion.png";
import { useState } from "react";

import { TEnvironment } from "@formbricks/types/environment";
import {
  TIntegrationNotion,
  TIntegrationNotionConfigData,
  TIntegrationNotionDatabase,
} from "@formbricks/types/integration/notion";
import { TSurvey } from "@formbricks/types/surveys";
import { ConnectIntegration } from "@formbricks/ui/ConnectIntegration";

import { authorize } from "../lib/notion";

interface NotionWrapperProps {
  notionIntegration: TIntegrationNotion | undefined;
  enabled: boolean;
  environment: TEnvironment;
  webAppUrl: string;
  surveys: TSurvey[];
  databasesArray: TIntegrationNotionDatabase[];
}

export const NotionWrapper = ({
  notionIntegration,
  enabled,
  environment,
  webAppUrl,
  surveys,
  databasesArray,
}: NotionWrapperProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(
    notionIntegration ? notionIntegration.config.key?.bot_id : false
  );
  const [selectedIntegration, setSelectedIntegration] = useState<
    (TIntegrationNotionConfigData & { index: number }) | null
  >(null);

  const handleNotionAuthorization = async () => {
    authorize(environment.id, webAppUrl).then((url: string) => {
      if (url) {
        window.location.replace(url);
      }
    });
  };

  return (
    <>
      {isConnected && notionIntegration ? (
        <>
          <AddIntegrationModal
            environmentId={environment.id}
            surveys={surveys}
            open={isModalOpen}
            setOpen={setModalOpen}
            notionIntegration={notionIntegration}
            databases={databasesArray}
            selectedIntegration={selectedIntegration}
          />
          <ManageIntegration
            environment={environment}
            notionIntegration={notionIntegration}
            setOpenAddIntegrationModal={setModalOpen}
            setIsConnected={setIsConnected}
            setSelectedIntegration={setSelectedIntegration}
          />
        </>
      ) : (
        <ConnectIntegration
          isEnabled={enabled}
          integrationType={"notion"}
          handleAuthorization={handleNotionAuthorization}
          integrationLogoSrc={notionLogo}
          formbricksLogoSrc={formbricksLogo}
        />
      )}
    </>
  );
};
