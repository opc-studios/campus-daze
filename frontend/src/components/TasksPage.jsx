import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskApi } from '../services/api'

function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await taskApi.getAll()
        setTasks(response.data)
      } catch (err) {
        console.error('Failed to get tasks:', err)
      }
    }
    fetchTasks()
  }, [])

  const handleAccept = async (taskId) => {
    try {
      await taskApi.accept(taskId)
      alert('任务已接受')
    } catch (err) {
      console.error('Accept task failed:', err)
    }
  }

  const handleComplete = async (taskId) => {
    try {
      await taskApi.complete(taskId)
      alert('任务完成！获得奖励')
    } catch (err) {
      console.error('Complete task failed:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm">
          <button onClick={() => navigate('/plaza')} className="btn-primary">返回广场</button>
          <h1 className="text-xl font-bold text-academic-purple">任务列表</h1>
          <div className="w-20"></div>
        </div>
        
        <div className="absolute top-20 left-4 right-4 bottom-4 flex gap-4">
          <div className="card-game flex-1">
            <h3 className="font-bold text-lg text-campus-blue mb-4">任务列表</h3>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTask?.id === task.id
                      ? 'border-campus-blue bg-campus-blue/10'
                      : 'border-gray-200 hover:border-campus-blue/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.type === 1 ? 'bg-campus-blue text-white' : 'bg-sakura text-white'
                        }`}>
                          {task.type === 1 ? '主线' : '支线'}
                        </span>
                        <h4 className="font-bold text-gray-800">{task.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.difficulty === 1 ? 'bg-green-100 text-green-600' :
                      task.difficulty === 2 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {'简单' || '普通' || '困难'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    要求等级: Lv.{task.required_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedTask && (
            <div className="card-game w-80">
              <h3 className="font-bold text-lg text-academic-purple mb-4">{selectedTask.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedTask.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">任务目标</h4>
                <ul className="space-y-1">
                  {selectedTask.objectives?.map((obj, index) => (
                    <li key={index} className="text-sm text-gray-600">• {obj}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">任务奖励</h4>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl">⭐</div>
                    <div className="text-xs text-gray-500">经验</div>
                    <div className="text-sm font-bold text-healing-green">100</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl">💰</div>
                    <div className="text-xs text-gray-500">金币</div>
                    <div className="text-sm font-bold text-yellow-600">50</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleAccept(selectedTask.id)}
                className="btn-game w-full mb-2"
              >
                接受任务
              </button>
              <button
                onClick={() => handleComplete(selectedTask.id)}
                className="btn-primary w-full"
              >
                完成任务
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-blue-200 to-purple-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-academic-purple">任务系统</h2>
              <p className="text-gray-600 mt-2">接受并完成任务获得奖励</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksPage