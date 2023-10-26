"use client";

import ActivityFeed from "@/app/(app)/environments/[environmentId]/people/[personId]/components/ActivityFeed";
import { TAction } from "@formbricks/types/actions";
import { TEnvironment } from "@formbricks/types/environment";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function ActivityTimeline({
  environment,
  actions,
}: {
  environment: TEnvironment;
  actions: TAction[];
}) {
  const [activityAscending, setActivityAscending] = useState(true);
  const toggleSortActivity = () => {
    setActivityAscending(!activityAscending);
  };

  return (
    <>
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-lg font-bold text-slate-700">Activity Timeline</h2>
        <div className="text-right">
          <button
            onClick={toggleSortActivity}
            className="hover:text-brand-dark flex items-center px-1 text-slate-800">
            <ArrowsUpDownIcon className="inline h-4 w-4" />
          </button>
        </div>
      </div>

      <ActivityFeed actions={actions} sortByDate={activityAscending} environment={environment} />
    </>
  );
}
