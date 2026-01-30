import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">🍽️ Bite</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your recipes, organized in one place
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
