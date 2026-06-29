import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterApi } from '../services/api'

function CharacterPage() {
  const [characters, setCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [currentForm, setCurrentForm] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await characterApi.getAll()
        setCharacters(response.data)
        if (response.data.length > 0) {
          setSelectedCharacter(response.data[0])
        }
      } catch (err) {
        console.error('Failed to get characters:', err)
      }
    }
    fetchCharacters()
  }, [])

  const handleTransform = async () => {
    if (!selectedCharacter) return
    const newForm = currentForm === 0 ? 1 : 0
    try {
      await characterApi.transform(selectedCharacter.id, { form_type: newForm })
      setCurrentForm(newForm)
    } catch (err) {
      console.error('Transform failed:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm">
          <button onClick={() => navigate('/plaza')} className="btn-primary">返回广场</button>
          <h1 className="text-xl font-bold text-academic-purple">角色详情</h1>
          <div className="w-20"></div>
        </div>
        
        <div className="absolute top-20 left-4 right-4 bottom-4 flex gap-4">
          <div className="card-game w-48">
            <h3 className="font-bold text-lg text-campus-blue mb-4">角色列表</h3>
            <div className="space-y-2">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacter(char)
                    setCurrentForm(char.current_form)
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCharacter?.id === char.id
                      ? 'border-academic-purple bg-academic-purple/10'
                      : 'border-gray-200 hover:border-academic-purple/50'
                  }`}
                >
                  <h4 className="font-bold text-gray-800">{char.name}</h4>
                  <p className="text-xs text-gray-500">Lv.{char.level}</p>
                </div>
              ))}
            </div>
          </div>
          
          {selectedCharacter && (
            <div className="card-game flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-academic-purple">{selectedCharacter.name}</h2>
                  <p className="text-gray-600">Lv.{selectedCharacter.level}</p>
                </div>
                <button
                  onClick={handleTransform}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentForm === 1
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {currentForm === 1 ? '切换日常形态' : '切换战斗形态'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl text-campus-blue mb-1">❤️</div>
                  <div className="text-sm font-bold text-gray-700">HP</div>
                  <div className="text-lg font-bold text-healing-green">{selectedCharacter.hp}/{selectedCharacter.max_hp}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl text-campus-blue mb-1">💧</div>
                  <div className="text-sm font-bold text-gray-700">MP</div>
                  <div className="text-lg font-bold text-campus-blue">{selectedCharacter.mp}/{selectedCharacter.max_mp}</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="text-3xl text-energy-orange mb-1">⚔️</div>
                  <div className="text-sm font-bold text-gray-700">攻击</div>
                  <div className="text-lg font-bold text-energy-orange">{selectedCharacter.attack}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl text-gray-500 mb-1">🛡️</div>
                  <div className="text-sm font-bold text-gray-700">防御</div>
                  <div className="text-lg font-bold text-gray-600">{selectedCharacter.defense}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <div className="text-3xl text-yellow-500 mb-1">⚡</div>
                  <div className="text-sm font-bold text-gray-700">敏捷</div>
                  <div className="text-lg font-bold text-yellow-600">{selectedCharacter.agility}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-3xl text-academic-purple mb-1">🧠</div>
                  <div className="text-sm font-bold text-gray-700">智力</div>
                  <div className="text-lg font-bold text-academic-purple">{selectedCharacter.intelligence}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl text-healing-green mb-1">⭐</div>
                  <div className="text-sm font-bold text-gray-700">经验</div>
                  <div className="text-lg font-bold text-healing-green">{selectedCharacter.exp}</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="text-3xl text-sakura mb-1">🐱</div>
                  <div className="text-sm font-bold text-gray-700">形态</div>
                  <div className="text-lg font-bold text-sakura">{currentForm === 1 ? '战斗' : '日常'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-campus-blue mb-3">装备</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((slot) => (
                    <div key={slot} className="p-3 bg-gray-100 rounded-lg text-center">
                      <div className="text-2xl mb-1">📦</div>
                      <div className="text-xs text-gray-500">装备槽{slot}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-bold text-lg text-campus-blue mb-3">技能</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: '技能1', icon: '✨', level: 1 },
                    { name: '技能2', icon: '🔥', level: 1 },
                    { name: '技能3', icon: '💧', level: 0 },
                    { name: '技能4', icon: '⚡', level: 0 },
                  ].map((skill, index) => (
                    <div key={index} className={`p-3 rounded-lg text-center ${skill.level > 0 ? 'bg-sakura/20' : 'bg-gray-100'}`}>
                      <div className="text-2xl mb-1">{skill.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{skill.name}</div>
                      <div className="text-xs text-gray-500">Lv.{skill.level}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-purple-200 to-pink-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🐱</div>
              <h2 className="text-2xl font-bold text-academic-purple">角色详情</h2>
              <p className="text-gray-600 mt-2">查看和管理你的角色</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterPage