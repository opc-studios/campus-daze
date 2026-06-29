import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { restApi, characterApi } from '../services/api'

function RestPage() {
  const [character, setCharacter] = useState(null)
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [offlineRewards, setOfflineRewards] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const charsResponse = await characterApi.getAll()
        if (charsResponse.data.length > 0) {
          setCharacter(charsResponse.data[0])
        }
        const offlineResponse = await restApi.getOffline()
        if (offlineResponse.data.rewards && Object.keys(offlineResponse.data.rewards).length > 0) {
          setOfflineRewards(offlineResponse.data)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    let timer = null
    if (isResting) {
      timer = setInterval(() => {
        setRestTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isResting])

  const handleStartRest = async () => {
    try {
      await restApi.start()
      setIsResting(true)
      setRestTime(0)
    } catch (err) {
      console.error('Failed to start rest:', err)
    }
  }

  const handleEndRest = async () => {
    try {
      const response = await restApi.end()
      alert(`休息结束！\n金币: ${response.data.rewards.coins}\n经验: ${response.data.rewards.exp}\n猫粮: ${response.data.rewards.cat_food}`)
      setIsResting(false)
      setRestTime(0)
    } catch (err) {
      console.error('Failed to end rest:', err)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm">
          <button onClick={() => navigate('/plaza')} className="btn-primary">返回广场</button>
          <h1 className="text-xl font-bold text-academic-purple">放置休息</h1>
          <div className="w-20"></div>
        </div>
        
        <div className="absolute top-20 left-4 right-4 bottom-4 flex flex-col items-center justify-center">
          <div className="card-game w-full max-w-md">
            {character && (
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">😴</div>
                <h2 className="text-2xl font-bold text-academic-purple">{character.name}</h2>
                <p className="text-gray-600 mt-1">Lv.{character.level}</p>
                
                <div className="mt-4 flex justify-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <span>❤️</span>
                      <span className="font-bold text-healing-green">{character.hp}/{character.max_hp}</span>
                    </div>
                    <div className="hp-bar w-24 mt-1">
                      <div className="hp-fill" style={{ width: `${(character.hp / character.max_hp) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <span>💧</span>
                      <span className="font-bold text-campus-blue">{character.mp}/{character.max_mp}</span>
                    </div>
                    <div className="mp-bar w-24 mt-1">
                      <div className="mp-fill" style={{ width: `${(character.mp / character.max_mp) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {offlineRewards && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-yellow-700 mb-2">🎁 离线奖励</h3>
                <p className="text-sm text-yellow-600 mb-2">离线时间: {offlineRewards.offline_minutes} 分钟</p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-xl">💰</div>
                    <div className="text-sm font-bold text-yellow-600">{offlineRewards.rewards.coins}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl">⭐</div>
                    <div className="text-sm font-bold text-healing-green">{offlineRewards.rewards.exp}</div>
                  </div>
                </div>
              </div>
            )}
            
            {isResting ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🛌</div>
                <p className="text-xl font-bold text-gray-700 mb-2">休息中...</p>
                <p className="text-3xl font-bold text-campus-blue mb-6">{formatTime(restTime)}</p>
                
                <button
                  onClick={handleEndRest}
                  className="btn-game w-full"
                >
                  结束休息
                </button>
                
                <p className="text-xs text-gray-500 mt-4">每1分钟获得: 2金币, 3经验, 每10分钟获得1猫粮</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4">🌙</div>
                <p className="text-gray-600 mb-6">休息可以恢复体力并获得奖励</p>
                
                <button
                  onClick={handleStartRest}
                  className="btn-game w-full"
                >
                  开始休息
                </button>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-2">休息奖励规则</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 每休息1分钟: +2金币, +3经验</li>
                    <li>• 每休息10分钟: +1猫粮</li>
                    <li>• 单次休息最多获得: 100金币, 200经验, 10猫粮</li>
                    <li>• 离线时间也能获得奖励</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-purple-300 to-indigo-400">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🌙</div>
              <h2 className="text-2xl font-bold text-white">休息场景</h2>
              <p className="text-gray-300 mt-2">{isResting ? '正在休息中...' : '点击开始休息恢复'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestPage