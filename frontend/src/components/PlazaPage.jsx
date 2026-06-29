import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import { logout } from '../redux/slices/authSlice'
import { setCharacters, setCurrentCharacter } from '../redux/slices/characterSlice'
import { authApi, characterApi, taskApi } from '../services/api'

function PlazaPage() {
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const currentCharacter = useSelector(state => state.character.currentCharacter)
  const characters = useSelector(state => state.character.characters)

  useEffect(() => {
    const fetchData = async () => {
      try {
        try {
          const userResponse = await authApi.getMe()
          setUser(userResponse.data)
        } catch {
        }
        
        if (characters.length === 0) {
          const charsResponse = await characterApi.getAll()
          if (charsResponse.data.length > 0) {
            dispatch(setCharacters(charsResponse.data))
            dispatch(setCurrentCharacter(charsResponse.data[0]))
          }
        }
        
        const tasksResponse = await taskApi.getAll(1)
        setTasks(tasksResponse.data.slice(0, 3))
      } catch (err) {
        if (err.response?.status === 401) {
          dispatch(logout())
          navigate('/')
        }
      }
    }
    fetchData()
  }, [dispatch, navigate, characters.length])

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <Header title="学术喵的奇幻之旅" />
        
        {currentCharacter && (
          <div className="absolute bottom-4 left-4 card-game w-64">
            <h3 className="font-bold text-lg text-academic-purple mb-2">{currentCharacter.name}</h3>
            <p className="text-sm text-gray-600">Lv.{currentCharacter.level}</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>HP</span>
                <span>{currentCharacter.hp}/{currentCharacter.max_hp}</span>
              </div>
              <div className="hp-bar">
                <div className="hp-fill" style={{ width: `${(currentCharacter.hp / currentCharacter.max_hp) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>MP</span>
                <span>{currentCharacter.mp}/{currentCharacter.max_mp}</span>
              </div>
              <div className="mp-bar">
                <div className="mp-fill" style={{ width: `${(currentCharacter.mp / currentCharacter.max_mp) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button onClick={() => navigate('/explore')} className="btn-game">探索校园</button>
          <button onClick={() => navigate('/tasks')} className="btn-game">任务列表</button>
          <button onClick={() => navigate('/character')} className="btn-game">角色详情</button>
          <button onClick={() => navigate('/rest')} className="btn-game">休息恢复</button>
          <button onClick={() => navigate('/rewards')} className="btn-game">领取奖励</button>
        </div>
        
        {tasks.length > 0 && (
          <div className="absolute top-20 left-4 card-game w-72">
            <h3 className="font-bold text-lg text-campus-blue mb-3">当前任务</h3>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="text-sm text-gray-700 cursor-pointer hover:text-academic-purple transition-colors">
                  {task.name}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="absolute top-20 right-4 card-game w-48">
          <h3 className="font-bold text-lg text-sakura mb-3">校园广场</h3>
          <p className="text-sm text-gray-600">欢迎来到新生广场！</p>
          <p className="text-sm text-gray-500 mt-2">在这里你可以:</p>
          <ul className="text-xs text-gray-600 mt-1">
            <li>• 与NPC交流</li>
            <li>• 领取任务</li>
            <li>• 探索区域</li>
            <li>• 准备战斗</li>
          </ul>
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-sky-300 to-green-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏫</div>
              <h2 className="text-2xl font-bold text-academic-purple">校园广场</h2>
              <p className="text-gray-600 mt-2">点击右侧按钮开始冒险</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlazaPage