'use client'

import { useState } from 'react'
import { detectScene } from '@/lib/api'

export default function DetectPage() {
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleDetect = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const res = await detectScene(content)
      if (res.code === 0) {
        setResult(res.data.result)
      } else {
        alert('Error: ' + res.error)
      }
    } catch (e) {
      alert('Request failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">🔍 场景检测</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">对话内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="粘贴对话内容..."
              className="w-full h-48 p-4 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-700"
            />
          </div>
          
          <button
            onClick={handleDetect}
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '检测中...' : '开始检测'}
          </button>
          
          {result && (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
              <div>
                <div className="text-sm text-zinc-400">检测结果</div>
                <div className="text-2xl font-bold text-green-400">{result.scene}</div>
              </div>
              
              <div>
                <div className="text-sm text-zinc-400">置信度</div>
                <div className="text-xl">{(result.confidence * 100).toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="text-sm text-zinc-400">关键词</div>
                <div className="flex gap-2 flex-wrap">
                  {result.keywords.map((k: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-sm">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
