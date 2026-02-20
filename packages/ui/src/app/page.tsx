import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prompt Optimizer</h1>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="hover:text-zinc-300">仪表盘</Link>
            <Link href="/detect" className="hover:text-zinc-300">场景检测</Link>
            <Link href="/generate" className="hover:text-zinc-300">生成总结</Link>
            <Link href="/evaluate" className="hover:text-zinc-300">评估对比</Link>
            <Link href="/prompts" className="hover:text-zinc-300">提示词管理</Link>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">欢迎使用 Prompt Optimizer</h2>
          <p className="text-zinc-400 mb-8">
            AI 驱动的提示词优化平台，支持场景检测、总结生成、评估对比和提示词优化。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/detect"
              className="p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
            >
              <h3 className="text-xl font-semibold mb-2">🔍 场景检测</h3>
              <p className="text-zinc-400">自动识别对话场景类型</p>
            </Link>
            
            <Link 
              href="/generate"
              className="p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
            >
              <h3 className="text-xl font-semibold mb-2">📝 生成总结</h3>
              <p className="text-zinc-400">使用提示词生成结构化总结</p>
            </Link>
            
            <Link 
              href="/evaluate"
              className="p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
            >
              <h3 className="text-xl font-semibold mb-2">📊 评估对比</h3>
              <p className="text-zinc-400">LLM-as-a-Judge 评估总结质量</p>
            </Link>
            
            <Link 
              href="/prompts"
              className="p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
            >
              <h3 className="text-xl font-semibold mb-2">💡 提示词管理</h3>
              <p className="text-zinc-400">查看和编辑提示词模板</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
