import { TicketDashboard } from "@/components/ticket-dashboard"

export default function Home() {
  return (
    <main className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Theater Ticketing System</h1>
      <TicketDashboard />
    </main>
  )
}
