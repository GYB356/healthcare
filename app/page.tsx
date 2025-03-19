import { Analytics } from '@/components/Analytics/Analytics'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <Analytics />
    </main>
  )
}