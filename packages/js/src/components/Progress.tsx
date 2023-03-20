import { h } from "preact";

export default function Progress({ progress, brandColor }: { progress: number; brandColor: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-slate-200">
      <div
        className="h-1 rounded-full"
        style={{ backgroundColor: brandColor, width: `${Math.floor(progress * 100)}%` }}></div>
    </div>
  );
}
