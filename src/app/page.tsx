import { readFileSync } from 'fs'
import { join } from 'path'

function getProjectConfig() {
  try {
    const raw = readFileSync(join(process.cwd(), '.shipme/project.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { name: 'My App', description: 'A new project built with ShipMe' }
  }
}

export default function Home() {
  const config = getProjectConfig()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          {config.name}
        </h1>
        <p className="text-xl text-slate-400 mb-8">
          {config.description}
        </p>
        <div className="flex gap-4 justify-center">
          <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300">
            Next.js + Supabase + Tailwind
          </div>
          <div className="px-4 py-2 bg-emerald-900/50 border border-emerald-700 rounded-lg text-sm text-emerald-400">
            Provisioned by ShipMe.dev
          </div>
        </div>
      </div>
    </div>
  )
}
