"use client";

import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { TProductStyling } from "@formbricks/types/product";
import { TCardArrangementOptions } from "@formbricks/types/styling";
import { TSurvey, TSurveyStyling } from "@formbricks/types/surveys";

interface StackedCardsContainerProps {
  cardArrangement: TCardArrangementOptions;
  currentQuestionId: string;
  survey: TSurvey;
  getCardContent: (questionIdx: number, offset: number) => JSX.Element | undefined;
  styling: TProductStyling | TSurveyStyling;
}

export const StackedCardsContainer = ({
  cardArrangement,
  currentQuestionId,
  survey,
  getCardContent,
  styling,
}: StackedCardsContainerProps) => {
  const [hovered, setHovered] = useState(false);
  const highlightBorderColor =
    survey.styling?.highlightBorderColor?.light || styling.highlightBorderColor?.light;
  const cardBorderColor = survey.styling?.cardBorderColor?.light || styling.cardBorderColor?.light;
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [cardHeight, setCardHeight] = useState("auto");

  const cardIndexes = useMemo(() => {
    let cardIndexTemp = survey.questions.map((_, index) => index);
    if (survey.welcomeCard.enabled) {
      cardIndexTemp.unshift(-1);
    }
    if (survey.thankYouCard.enabled) {
      cardIndexTemp.push(survey.questions.length);
    }
    return cardIndexTemp;
  }, [survey]);

  const questionIdx = useMemo(() => {
    if (currentQuestionId === "start") return survey.welcomeCard.enabled ? -1 : 0;
    if (currentQuestionId === "end") return survey.thankYouCard.enabled ? survey.questions.length : 0;
    return survey.questions.findIndex((question) => question.id === currentQuestionId);
  }, [currentQuestionId, survey.welcomeCard.enabled, survey.thankYouCard.enabled]);

  const borderStyles = useMemo(() => {
    const baseStyle = {
      border: "1px solid",
      borderRadius: "var(--fb-border-radius)",
    };
    // Determine borderColor based on the survey type and availability of highlightBorderColor
    const borderColor =
      survey.type === "link" || !highlightBorderColor ? cardBorderColor : highlightBorderColor;
    return {
      ...baseStyle,
      borderColor: borderColor,
    };
  }, [survey.type, cardBorderColor, highlightBorderColor]);

  const calculateCardTransform = useMemo(() => {
    return (offset: number) => {
      switch (cardArrangement) {
        case "casual":
          return offset < 0 ? `translateX(33%)` : `translateX(0) rotate(-${(hovered ? 3.5 : 3) * offset}deg)`;
        case "straight":
          return offset < 0 ? `translateY(25%)` : `translateY(-${(hovered ? 12 : 10) * offset}px)`;
        default:
          return offset < 0 ? `translateX(0)` : `translateX(0)`;
      }
    };
  }, [cardArrangement, hovered]);

  const straightCardArrangementClasses = (offset: number) => {
    if (cardArrangement === "straight") {
      return {
        width: `${100 - 5 * offset}%`,
        margin: "auto",
      };
    }
  };

  useEffect(() => {
    const currentElement = cardRefs.current[questionIdx];
    if (currentElement) {
      if (resizeObserver.current) resizeObserver.current.disconnect();
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) setCardHeight(entry.contentRect.height + "px");
      });
      resizeObserver.current.observe(currentElement);
    }
    return () => resizeObserver.current?.disconnect();
  }, [questionIdx, cardRefs.current]);

  return (
    <div
      className="group relative flex items-end justify-center md:items-center"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}>
      <div style={{ height: cardHeight }}></div>
      {questionIdx !== undefined &&
        cardIndexes.map((_, idx) => {
          const index = survey.welcomeCard.enabled ? idx - 1 : idx;
          const offset = index - questionIdx;
          const isHidden = offset < 0;
          return (
            <div
              ref={(el) => (cardRefs.current[index] = el)}
              id={`questionCard-${index}`}
              key={index}
              style={{
                zIndex: 1000 - index,
                transform: ` ${calculateCardTransform(offset)}`,
                opacity: isHidden ? 0 : (100 - 30 * offset) / 100,
                height: offset === 0 ? "auto" : cardHeight,
                transitionDuration: cardArrangement === "simple" ? "0ms" : "600ms",
                pointerEvents: offset === 0 ? "auto" : "none",
                ...borderStyles,
                ...straightCardArrangementClasses(offset),
              }}
              className="pointer rounded-custom bg-survey-bg group-hover:scale-1 absolute inset-x-0 scale-[0.95] backdrop-blur-md transition-all ease-in-out">
              {getCardContent(index, offset)}
            </div>
          );
        })}
    </div>
  );
};
