import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] transition-colors duration-500 overflow-hidden relative">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10 animate-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/40 mb-6 group hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Interest<span className="text-indigo-600">Matcher</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">
              Find your tribe
            </p>
          </div>
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
