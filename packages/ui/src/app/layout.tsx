import Link from 'next/link'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <nav className="border-b border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 h-14">
              <Link href="/" className="font-bold text-lg">Prompt Optimizer</Link>
              <div className="flex gap-4 text-sm">
                <Link href="/dashboard" className="hover:text-zinc-300">仪表盘</Link>
                <Link href="/detect" className="hover:text-zinc-300">场景检测</Link>
                <Link href="/generate" className="hover:text-zinc-300">生成总结</Link>
                <Link href="/evaluate" className="hover:text-zinc-300">评估对比</Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
