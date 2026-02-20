'use client'

import { useEffect, useState } from 'react'
import { listTasks } from '@/lib/api'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const res = await listTasks()
      if (res.code === 0) {
        setTasks(res.data.tasks)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">📊 仪表盘</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">最近任务</h2>
          
          {loading ? (
            <div className="text-zinc-400">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-zinc-400">暂无任务记录</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{task.type}</div>
                    <div className="text-sm text-zinc-400">{task.id}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-sm ${
                      task.status === 'success' ? 'bg-green-900 text-green-200' :
                      task.status === 'failed' ? 'bg-red-900 text-red-200' :
                      task.status === 'running' ? 'bg-blue-900 text-blue-200' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {task.status}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
