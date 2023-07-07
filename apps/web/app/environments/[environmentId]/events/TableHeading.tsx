export default function TableHeading() {
  return (
    <>
      <div className="grid h-12 grid-cols-6 content-center rounded-lg bg-slate-100 text-left text-sm font-semibold text-slate-900">
        <span className="sr-only">Edit</span>
        <div className="col-span-4 pl-6 ">User Actions</div>
        <div className="text-center"># Reps</div>
        <div className="text-center">Created</div>
      </div>
    </>
  );
}
