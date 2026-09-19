import type { Metadata } from "next";
import Dashboard from "../dashboard";
export const metadata: Metadata = { title: "Dashboard privé — VibeRoom", robots: { index: false, follow: false } };
export default function DashboardPage() { return <Dashboard />; }
