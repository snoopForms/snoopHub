import Layout from "@/components/shared/Layout";
import HeroTitle from "@/components/shared/HeroTitle";
import Button from "../components/shared/Button";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { ChatBubbleOvalLeftEllipsisIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

const topContributors = [
  {
    name: "Midka (8 commits)",
    href: "https://github.com/kymppi",
  },
  {
    name: "Timothy (6 commits)",
    href: "https://github.com/timothyde",
  },
  {
    name: "Kiran (3 commits)",
    href: "https://github.com/devkiran",
  },
  {
    name: "Francois (1 commit)",
    href: "https://github.com/fdis111",
  },
  {
    name: "Chetan (1 commit)",
    href: "https://github.com/chetan",
  },
];

const GetStartedPage = () => (
  <Layout meta={{ title: "React Form Builder Library by Formbricks" }}>
    <HeroTitle HeadingPt1="Join the" HeadingTeal="Formbricks" HeadingPt2="Community" />
    <div className="grid grid-cols-2 gap-8 px-16 mb-32">
      <div className="px-10 py-6 rounded-lg bg-gradient-to-b from-blue-200 to-gray-50 dark:from-blue-300 dark:to-gray-100">
        <h2 className="text-4xl font-bold text-blue mt-7">Top Contributors</h2>
        <p className="text-sm text-gray-500">The leader board of the Formbricks community contributors 🙌</p>
        <ol className="mt-10 ml-4 list-decimal">
          {topContributors.map((MVP) => (
            <li key={MVP.name} className="my-3 text-lg font-bold text-blue hover:text-blue-600">
              <a href={MVP.href} className="" target="_blank">
                {MVP.name}

                <ArrowTopRightOnSquareIcon className="inline w-5 h-5 mb-1 ml-1 text-teal" />
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <div className="px-10 pt-6 pb-12 rounded-lg from-blue bg-gradient-to-b to-black dark:from-blue-300 dark:to-gray-100">
          <h3 className="text-4xl font-bold text-gray-100 mt-7 ">Community Discord</h3>
          <p className="text-gray-200">Get support for anything your building - or just say hi 👋</p>
          <Button className="w-full font-bold text-center mt-7" variant="highlight">
            Join Discord <ChatBubbleOvalLeftEllipsisIcon className="inline w-5 h-5 ml-1" />
          </Button>
        </div>
        <div className="flex mt-7">
          <a href="https://twitter.com/formbricks" target="_blank" className="w-1/2 ">
            <div className="flex justify-center py-6 mr-3 rounded-lg bg-gradient-to-b from-blue-200 to-gray-50 dark:from-blue-300 dark:to-gray-100">
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-20 w-20 text-[#1DA1F2]">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </div>
          </a>
          <a href="mailto:johannes@formbricks.com" className="w-1/2 ">
            <div className="flex justify-center py-6 ml-3 rounded-lg bg-gradient-to-b from-blue-200 to-gray-50 dark:from-blue-300 dark:to-gray-100">
              <EnvelopeIcon className="w-20 h-20 ml-1 text-gray hover:text-gray-400" />
            </div>
          </a>
        </div>
      </div>
    </div>
  </Layout>
);

export default GetStartedPage;
