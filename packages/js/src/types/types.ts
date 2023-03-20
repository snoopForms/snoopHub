export interface ResponseCreateRequest {
  surveyId: string;
  personId: string;
  response: {
    finished?: boolean;
    data: {
      [name: string]: string | number | string[] | number[] | undefined;
    };
  };
}

export interface ResponseUpdateRequest {
  response: {
    finished?: boolean;
    data: {
      [name: string]: string | number | string[] | number[] | undefined;
    };
  };
}

export interface DisplayCreateRequest {
  surveyId: string;
  personId: string;
}

export interface Response {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  formId: string;
  customerId: string;
  data: {
    [name: string]: string | number | string[] | number[] | undefined;
  };
}

export interface Config {
  environmentId: string;
  apiHost: string;
  person?: Person;
  session?: Session;
  settings?: {
    surveys?: Survey[];
    noCodeEvents?: any[];
    brandColor: string;
  };
}

export interface Session {
  id: string;
  expiresAt: number;
}

export interface Person {
  id: string;
  attributes?: any;
  environmentId: string;
}

export interface Survey {
  id: string;
  questions: Question[];
  triggers: Trigger[];
}

export type Question = OpenTextQuestion | RadioQuestion;

export interface OpenTextQuestion {
  id: string;
  type: "openText";
  headline: string;
  subheader?: string;
  placeholder?: string;
  buttonLabel?: string;
  required: boolean;
}

export interface RadioQuestion {
  id: string;
  type: "radio";
  headline: string;
  subheader?: string;
  buttonLabel?: string;
  required: boolean;
}

export interface Trigger {
  id: string;
  eventClass: {
    id: string;
    name: string;
  };
}

export type MatchType = "exactMatch" | "contains" | "startsWith" | "endsWith" | "notMatch" | "notContains";
