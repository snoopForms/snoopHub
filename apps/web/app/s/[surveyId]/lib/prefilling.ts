import { TResponseData } from "@formbricks/types/responses";
import { TSurveyQuestionType } from "@formbricks/types/surveys";
import { TSurvey, TSurveyQuestion } from "@formbricks/types/surveys";

export const getPrefillValue = (
  survey: TSurvey,
  searchParams: URLSearchParams,
  languageId: string
): TResponseData | undefined => {
  const prefillAnswer: TResponseData = {};
  let questionIdxMap: { [key: string]: number } = {};

  survey.questions.forEach((q, idx) => {
    questionIdxMap[q.id] = idx;
  });

  searchParams.forEach((value, key) => {
    const questionId = key;
    const questionIdx = questionIdxMap[questionId];
    const question = survey.questions[questionIdx];
    const answer = value;

    if (question && checkValidity(question, answer, languageId)) {
      prefillAnswer[questionId] = transformAnswer(question, answer, languageId);
    }
  });

  return Object.keys(prefillAnswer).length > 0 ? prefillAnswer : undefined;
};

export const checkValidity = (question: TSurveyQuestion, answer: string, language: string): boolean => {
  if (question.required && (!answer || answer === "")) return false;
  try {
    switch (question.type) {
      case TSurveyQuestionType.OpenText: {
        return true;
      }
      case TSurveyQuestionType.MultipleChoiceSingle: {
        const hasOther = question.choices[question.choices.length - 1].id === "other";
        if (!hasOther) {
          if (!question.choices.find((choice) => choice.label[language] === answer)) return false;
          return true;
        }

        if (question.choices[question.choices.length - 1].label[language] === answer) {
          return false;
        }

        return true;
      }
      case TSurveyQuestionType.MultipleChoiceMulti: {
        const answerChoices = answer.split(",");
        const hasOther = question.choices[question.choices.length - 1].id === "other";
        if (!hasOther) {
          if (
            !answerChoices.every((ans: string) =>
              question.choices.find((choice) => choice.label[language] === ans)
            )
          )
            return false;
          return true;
        }
        return true;
      }
      case TSurveyQuestionType.NPS: {
        answer = answer.replace(/&/g, ";");
        const answerNumber = Number(JSON.parse(answer));

        if (isNaN(answerNumber)) return false;
        if (answerNumber < 0 || answerNumber > 10) return false;
        return true;
      }
      case TSurveyQuestionType.CTA: {
        if (question.required && answer === "dismissed") return false;
        if (answer !== "clicked" && answer !== "dismissed") return false;
        return true;
      }
      case TSurveyQuestionType.Consent: {
        if (question.required && answer === "dismissed") return false;
        if (answer !== "accepted" && answer !== "dismissed") return false;
        return true;
      }
      case TSurveyQuestionType.Rating: {
        answer = answer.replace(/&/g, ";");
        const answerNumber = Number(JSON.parse(answer));
        if (answerNumber < 1 || answerNumber > question.range) return false;
        return true;
      }
      case TSurveyQuestionType.PictureSelection: {
        const answerChoices = answer.split(",");
        if (!answerChoices.every((ans: string) => question.choices.find((choice) => choice.id === ans)))
          return false;
        return true;
      }
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
};

export const transformAnswer = (
  question: TSurveyQuestion,
  answer: string,
  language: string
): string | number | string[] => {
  switch (question.type) {
    case TSurveyQuestionType.OpenText:
    case TSurveyQuestionType.MultipleChoiceSingle:
    case TSurveyQuestionType.Consent:
    case TSurveyQuestionType.CTA: {
      return answer;
    }

    case TSurveyQuestionType.Rating:
    case TSurveyQuestionType.NPS: {
      answer = answer.replace(/&/g, ";");
      return Number(JSON.parse(answer));
    }

    case TSurveyQuestionType.PictureSelection: {
      return answer.split(",");
    }

    case TSurveyQuestionType.MultipleChoiceMulti: {
      let ansArr = answer.split(",");
      const hasOthers = question.choices[question.choices.length - 1].id === "other";
      if (!hasOthers) return ansArr;

      // answer can be "a,b,c,d" and options can be a,c,others so we are filtering out the options that are not in the options list and sending these non-existing values as a single string(representing others) like "a", "c", "b,d"
      const options = question.choices.map((o) => o.label[language]);
      const others = ansArr.filter((a: string) => !options.includes(a));
      if (others.length > 0) ansArr = ansArr.filter((a: string) => options.includes(a));
      if (others.length > 0) ansArr.push(others.join(","));
      return ansArr;
    }

    default:
      return "dismissed";
  }
};
