import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

const cards = [
  {
    href: "/dashboard/projects",
    icon: "◐",
    title: "My Projects",
    desc: "Manage group projects and tasks",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50",
    border: "border-indigo-100",
    statKey: "projects",
  },
  {
    href: "/dashboard/marketplace",
    icon: "◑",
    title: "Marketplace",
    desc: "Buy and sell textbooks & notes",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
    border: "border-purple-100",
    statKey: "listings",
  },
  {
    href: "/dashboard/study-rooms",
    icon: "◒",
    title: "Study Rooms",
    desc: "Virtual co-studying sessions",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    border: "border-amber-100",
    statKey: "activeRooms",
  },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "S";
  const name = user?.email?.split("@")[0] ?? "Student";

  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm ring-2 ring-white">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-400">
            Quick access
          </h2>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group card relative overflow-hidden ${card.border} animate-fade-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
              <div className="relative p-6">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-xl text-white shadow-sm`}
                >
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-static p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">◐</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Projects</p>
              </div>
            </div>
          </div>
          <div className="card-static p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg text-purple-600">◑</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Listings</p>
              </div>
            </div>
          </div>
          <div className="card-static p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">◒</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Active Rooms</p>
              </div>
            </div>
          </div>
          <div className="card-static p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">◓</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Pending Tasks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
