import Link from "next/link";

export default function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
      <Link href="/about?formbricksDebug=true">About</Link>
      <Link href="/?formbricksDebug=true">Home</Link>
    </div>
  );
}
