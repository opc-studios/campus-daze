import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mapApi, battleApi } from '../services/api'

const areas = [
  { id: 1, name: '新生广场', description: '校园主广场，樱花盛开的地方', unlocked: 1, exploration: 100 },
  { id: 2, name: '教学楼', description: '知识的殿堂，考试的战场', unlocked: 1, exploration: 0 },
  { id: 3, name: '樱花大道', description: '浪漫的樱花步道', unlocked: 0, exploration: 0 },
  { id: 4, name: '医学院', description: '神秘的实验楼', unlocked: 0, exploration: 0 },
  { id: 5, name: '图书馆', description: '知识的海洋', unlocked: 0, exploration: 0 },
]

function ExplorePage() {
  const [selectedArea, setSelectedArea] = useState(null)
  const [areaDetails, setAreaDetails] = useState(null)
  const [exploring, setExploring] = useState(false)
  const navigate = useNavigate()

  const handleAreaClick = async (area) => {
    if (!area.unlocked) {
      return
    }
    setSelectedArea(area)
    try {
      const response = await mapApi.getArea(area.id)
      setAreaDetails(response.data)
    } catch (err) {
      console.error('Failed to get area details:', err)
    }
  }

  const handleExplore = async () => {
    if (!selectedArea) return
    setExploring(true)
    try {
      await mapApi.explore(selectedArea.id)
      alert('探索成功！获得奖励')
    } catch (err) {
      console.error('Explore failed:', err)
    }
    setExploring(false)
  }

  const handleBattle = async (enemyId) => {
    try {
      await battleApi.start({ enemy_id: enemyId, character_id: 1 })
      navigate('/battle')
    } catch (err) {
      console.error('Battle start failed:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm">
          <button onClick={() => navigate('/plaza')} className="btn-primary">返回广场</button>
          <h1 className="text-xl font-bold text-academic-purple">校园探索</h1>
          <div className="w-20"></div>
        </div>
        
        <div className="absolute top-20 left-4 right-4 bottom-4 flex gap-4">
          <div className="card-game flex-1">
            <h3 className="font-bold text-lg text-campus-blue mb-4">区域地图</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => handleAreaClick(area)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedArea?.id === area.id
                      ? 'border-campus-blue bg-campus-blue/10'
                      : area.unlocked
                      ? 'border-gray-200 hover:border-campus-blue/50'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">{area.name}</h4>
                    {area.unlocked ? (
                      <span className="text-green-500 text-sm">✓</span>
                    ) : (
                      <span className="text-gray-400 text-sm">🔒</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{area.description}</p>
                  {area.unlocked && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>探索度</span>
                        <span>{area.exploration}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full mt-1">
                        <div className="h-full bg-campus-blue rounded-full" style={{ width: `${area.exploration}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {selectedArea && (
            <div className="card-game w-80">
              <h3 className="font-bold text-lg text-academic-purple mb-4">{selectedArea.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedArea.description}</p>
              
              <button
                onClick={handleExplore}
                disabled={exploring}
                className="btn-game w-full mb-4"
              >
                {exploring ? '探索中...' : '探索区域'}
              </button>
              
              {areaDetails && (
                <div>
                  {areaDetails.npcs?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">NPC</h4>
                      <div className="space-y-1">
                        {areaDetails.npcs.map((npc) => (
                          <div key={npc.id} className="text-sm text-gray-600">
                            • {npc.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {areaDetails.enemies?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">敌人</h4>
                      <div className="space-y-2">
                        {areaDetails.enemies.map((enemy) => (
                          <button
                            key={enemy.id}
                            onClick={() => handleBattle(enemy.id)}
                            className="w-full p-2 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors"
                          >
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-800">{enemy.name}</span>
                              <span className="text-xs text-gray-500">Lv.{enemy.level}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-green-300 to-green-500">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-academic-purple">探索地图</h2>
              <p className="text-gray-600 mt-2">选择一个区域进行探索</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExplorePage