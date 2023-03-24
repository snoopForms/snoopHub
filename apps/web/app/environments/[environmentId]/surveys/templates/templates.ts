import { AppPieChartIcon } from "@/components/ui/icons/AppPieChartIcon";
import { CancelSubscriptionIcon } from "@/components/ui/icons/CancelSubscriptionIcon";
import { CashCalculatorIcon } from "@/components/ui/icons/CashCalculatorIcon";
import { DashboardIcon } from "@/components/ui/icons/DashboardIcon";
import { DogChaserIcon } from "@/components/ui/icons/DogChaserIcon";
import { DoorIcon } from "@/components/ui/icons/DoorIcon";
import { FeedbackIcon } from "@/components/ui/icons/FeedbackIcon";
import { OnboardingIcon } from "@/components/ui/icons/OnboardingIcon";
import { PMFIcon } from "@/components/ui/icons/PMFIcon";
import { TaskListSearchIcon } from "@/components/ui/icons/TaskListSearchIcon";
import { BaseballIcon } from "@/components/ui/icons/BaseballIcon";
import { CheckMarkIcon } from "@/components/ui/icons/CheckMarkIcon";
import { ArrowRightCircleIcon } from "@/components/ui/icons/ArrowRightCircleIcon";
import type { Template } from "@/types/templates";
import { createId } from "@paralleldrive/cuid2";

export const templates: Template[] = [
  {
    name: "Product Market Fit Survey",
    icon: PMFIcon,
    category: "Product Experience",
    description: "Measure PMF by assessing how disappointed users would be if your product disappeared.",
    preset: {
      name: "Product Market Fit Survey",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How disappointed would you be if you could no longer use this product?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Not at all disappointed",
            },
            {
              id: createId(),
              label: "Somewhat disappointed",
            },
            {
              id: createId(),
              label: "Very disappointed",
            },
          ],
        },
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What is your role?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Founder",
            },
            {
              id: createId(),
              label: "Executive",
            },
            {
              id: createId(),
              label: "Product Manager",
            },
            {
              id: createId(),
              label: "Product Owner",
            },
            {
              id: createId(),
              label: "Software Engineer",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "How can we improve our service for you?",
          subheader: "Please be as specific as possible.",
          required: true,
        },
      ],
    },
  },
  {
    name: "Onboarding Segmentation",
    icon: OnboardingIcon,
    category: "Product Experience",
    description: "Learn more about who signed up to your product and why.",
    preset: {
      name: "Onboarding Segmentation",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What is your role?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Founder",
            },
            {
              id: createId(),
              label: "Executive",
            },
            {
              id: createId(),
              label: "Product Manager",
            },
            {
              id: createId(),
              label: "Product Owner",
            },
            {
              id: createId(),
              label: "Software Engineer",
            },
          ],
        },
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What's your company size?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "only me",
            },
            {
              id: createId(),
              label: "1-5 employees",
            },
            {
              id: createId(),
              label: "6-10 employees",
            },
            {
              id: createId(),
              label: "11-100 employees",
            },
            {
              id: createId(),
              label: "over 100 employees",
            },
          ],
        },
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How did you hear about us first?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Recommendation",
            },
            {
              id: createId(),
              label: "Social Media",
            },
            {
              id: createId(),
              label: "Ads",
            },
            {
              id: createId(),
              label: "Google Search",
            },
            {
              id: createId(),
              label: "in a Podcast",
            },
          ],
        },
      ],
    },
  },
  {
    name: "Uncover Strengths & Weaknesses",
    icon: TaskListSearchIcon,
    category: "Growth Marketing",
    description: "Find out what users like and don't like about your product or offering.",
    preset: {
      name: "Uncover Strengths & Weaknesses",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What do you value most about our service?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Ease of use",
            },
            {
              id: createId(),
              label: "Good value for money",
            },
            {
              id: createId(),
              label: "It's open-source",
            },
            {
              id: createId(),
              label: "The founders are pretty",
            },
          ],
        },
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What should we improve on?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Documentation",
            },
            {
              id: createId(),
              label: "Customizability",
            },
            {
              id: createId(),
              label: "Pricing",
            },
            {
              id: createId(),
              label: "Humbleness of founders",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Would you like to add something?",
          subheader: "Feel free to speak your mind, we do too.",
          required: false,
        },
      ],
    },
  },
  {
    name: "Marketing Attribution",
    icon: AppPieChartIcon,
    category: "Growth Marketing",
    description: "How did you first hear about us?",
    preset: {
      name: "Marketing Attribution",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How did you hear about us first?",
          subheader: "Please select one of the following options.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Recommendation",
            },
            {
              id: createId(),
              label: "Social Media",
            },
            {
              id: createId(),
              label: "Ads",
            },
            {
              id: createId(),
              label: "Google Search",
            },
            {
              id: createId(),
              label: "in a Podcast",
            },
          ],
        },
      ],
    },
  },
  {
    name: "Churn Survey",
    icon: CancelSubscriptionIcon,
    category: "Increase Revenue",
    description: "Find out why people cancel their subscriptions. These insights are pure gold!",
    preset: {
      name: "Churn Survey",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "Why did you cancel your subscription?",
          subheader: "We're sorry to see you leave. Please help us do better:",
          required: true,
          choices: [
            {
              id: createId(),
              label: "I didn't get much value out of it",
            },
            {
              id: createId(),
              label: "It's too expensive",
            },
            {
              id: createId(),
              label: "I am missing a feature",
            },
            {
              id: createId(),
              label: "Poor customer service",
            },
            {
              id: createId(),
              label: "I just didn't need it anymore",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Is there something we can do to win you back?",
          subheader: "Feel free to speak your mind, we do too.",
          required: false,
        },
      ],
    },
  },
  {
    name: "Missed Trial Conversion",
    icon: BaseballIcon,
    category: "Increase Revenue",
    description: "Find out why people stopped their trial. These insights help you improve your funnel.",
    preset: {
      name: "Missed Trial Conversion",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "Why did you stop your trial?",
          subheader: "Help us understand you better. Choose one option:",
          required: true,
          choices: [
            {
              id: createId(),
              label: "I didn't get much value out of it",
            },
            {
              id: createId(),
              label: "I expected something else",
            },
            {
              id: createId(),
              label: "It's too expensive for what it does",
            },
            {
              id: createId(),
              label: "I am missing a feature",
            },
            {
              id: createId(),
              label: "I was just looking around",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Did you find a better alternative? Please name it:",
          required: false,
        },
      ],
    },
  },
  {
    name: "Changing subscription experience",
    icon: CashCalculatorIcon,
    category: "Increase Revenue",
    description: "Find out what goes through peoples minds when changing their subscriptions.",
    preset: {
      name: "Changing subscription experience",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How easy was it to change your plan?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Extremely difficult",
            },
            {
              id: createId(),
              label: "It took a while, but I got it",
            },
            {
              id: createId(),
              label: "It was alright",
            },
            {
              id: createId(),
              label: "Quite easy",
            },
            {
              id: createId(),
              label: "Very easy, love it!",
            },
          ],
        },
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "Is the pricing information easy to understand?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Yes, very clear.",
            },
            {
              id: createId(),
              label: "I was confused at first, but found what I needed.",
            },
            {
              id: createId(),
              label: "Quite complicated.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "Measure Task Accomplishment",
    icon: CheckMarkIcon,
    category: "Product Experience",
    description: "See if people get their 'Job To Be Done' done. Successful people are better customers.",
    preset: {
      name: "Measure Task Accomplishment",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "Were you able to 'accomplish what you came here to do today'?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Yes",
            },
            {
              id: createId(),
              label: "Working on it, boss",
            },
            {
              id: createId(),
              label: "No",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "What did you come here to do today?",
          required: false,
        },
      ],
    },
  },
  {
    name: "Identify Customer Goals",
    icon: ArrowRightCircleIcon,
    category: "Product Experience",
    description:
      "Better understand if your messaging creates the right expectations of the value your product provides.",
    preset: {
      name: "Identify Customer Goals",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What's your primary goal for using {{productName}}?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Understand my user base deeply",
            },
            {
              id: createId(),
              label: "Identify upselling opportunities",
            },
            {
              id: createId(),
              label: "Build the best possible product",
            },
            {
              id: createId(),
              label: "Rule the world to make everyone breakfast brussels sprouts.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "Feature Chaser",
    icon: DogChaserIcon,
    category: "Product Experience",
    description: "Follow up with users who just used a specific feature.",
    preset: {
      name: "Feature Chaser",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How easy was it to achieve your goal?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Extremely difficult",
            },
            {
              id: createId(),
              label: "It took a while, but I got it",
            },
            {
              id: createId(),
              label: "It was alright",
            },
            {
              id: createId(),
              label: "Quite easy",
            },
            {
              id: createId(),
              label: "Very easy, love it!",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Wanna add something?",
          subheader: "This really helps us do better!",
          required: false,
        },
      ],
    },
  },
  {
    name: "Fake Door Follow-Up",
    icon: DoorIcon,
    category: "Product Exploration",
    description: "Follow up with users who ran into one of your Fake Door experiments.",
    preset: {
      name: "Fake Door Follow-Up",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How important is this feature for you?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Very important",
            },
            {
              id: createId(),
              label: "Not so important",
            },
            {
              id: createId(),
              label: "I was just looking around",
            },
          ],
        },
      ],
    },
  },
  {
    name: "Feedback Box",
    icon: FeedbackIcon,
    category: "Product Experience",
    description: "Give your users the chance to seamlessly share what's on their minds.",
    preset: {
      name: "Feedback Box",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "What's on your mind, boss?",
          subheader: "Thanks for sharing feedback. We'll get back to you asap.",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Bug report 🐞",
            },
            {
              id: createId(),
              label: "Feature Request 💡",
            },
            {
              id: createId(),
              label: "Share some love 🤍",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Give us the juicy details:",
          required: true,
        },
      ],
    },
  },
  {
    name: "Integration usage survey",
    icon: DashboardIcon,
    category: "Product Experience",
    description: "Evaluate how easily users can add integrations to your product. Find blind spots.",
    preset: {
      name: "Feedback Box",
      questions: [
        {
          id: createId(),
          type: "multipleChoiceSingle",
          headline: "How easy was it to set this integration up?",
          required: true,
          choices: [
            {
              id: createId(),
              label: "Extremely difficult",
            },
            {
              id: createId(),
              label: "It took a while, but I got it",
            },
            {
              id: createId(),
              label: "It was alright",
            },
            {
              id: createId(),
              label: "Quite easy",
            },
            {
              id: createId(),
              label: "Very easy, love it!",
            },
          ],
        },
        {
          id: createId(),
          type: "openText",
          headline: "Which product would you like to integrate next?",
          subheader: "We keep building integrations. Yous can be next:",
          required: false,
        },
      ],
    },
  },
  /*  {
    name: "In-app Interview Prompt",
    icon: OnboardingIcon,
    description: "Invite a specific subset of your users to schedule an interview with your product team.",
    preset: {
      name: "In-app Interview Prompt",
      questions: [
        {
          id: createId(),
          type: "prompt",
          headline: "Wanna do a short 15m interview with Charly?",
          subheader: "That would really help us",
          buttonLabel: "Book slot",
          buttonUrl: "https://cal.com/formbricks",
        },
      ],
    },s
  }, */
];
