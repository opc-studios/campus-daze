import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../redux/slices/authSlice'
import { battleApi, characterApi, authApi } from '../services/api'

const skills = [
  { id: 1, name: '普通攻击', damage: 20, mpCost: 0, icon: '⚔️' },
  { id: 2, name: '技能1', damage: 50, mpCost: 20, icon: '✨' },
  { id: 3, name: '技能2', damage: 80, mpCost: 35, icon: '🔥' },
  { id: 4, name: '必杀技', damage: 150, mpCost: 50, icon: '💥' },
]

function BattlePage() {
  const [character, setCharacter] = useState({ hp: 100, maxHp: 100, mp: 100, maxMp: 100, name: '学术喵' })
  const [enemy, setEnemy] = useState({ hp: 200, maxHp: 200, name: '协议怪', level: 5 })
  const [battleId, setBattleId] = useState(null)
  const [turn, setTurn] = useState('player')
  const [battleLog, setBattleLog] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [user, setUser] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const currentCharacter = useSelector(state => state.character.currentCharacter)

  useEffect(() => {
    const initBattle = async () => {
      try {
        try {
          const userResponse = await authApi.getMe()
          setUser(userResponse.data)
        } catch {
        }
        
        if (currentCharacter) {
          setCharacter({
            hp: currentCharacter.hp,
            maxHp: currentCharacter.max_hp,
            mp: currentCharacter.mp,
            maxMp: currentCharacter.max_mp,
            name: currentCharacter.name,
            id: currentCharacter.id,
          })
        } else {
          const charsResponse = await characterApi.getAll()
          if (charsResponse.data.length > 0) {
            const char = charsResponse.data[0]
            setCharacter({
              hp: char.hp,
              maxHp: char.max_hp,
              mp: char.mp,
              maxMp: char.max_mp,
              name: char.name,
              id: char.id,
            })
          }
        }
      } catch (err) {
        console.error('Failed to get character:', err)
      }
    }
    initBattle()
  }, [currentCharacter])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const addLog = (message) => {
    setBattleLog(prev => [...prev, { id: Date.now(), message }])
  }

  const handleAttack = async (skill) => {
    if (turn !== 'player' || isAnimating) return
    if (character.mp < skill.mpCost) {
      addLog('MP不足！')
      return
    }

    setIsAnimating(true)
    setTurn('enemy')
    
    setCharacter(prev => ({ ...prev, mp: prev.mp - skill.mpCost }))
    
    const damage = Math.min(enemy.hp, skill.damage)
    setEnemy(prev => ({ ...prev, hp: prev.hp - damage }))
    addLog(`${character.name} 使用 ${skill.name}，造成 ${damage} 点伤害！`)

    setTimeout(() => {
      if (enemy.hp - damage <= 0) {
        addLog('战斗胜利！')
        setTimeout(() => navigate('/plaza'), 2000)
      } else {
        handleEnemyTurn()
      }
      setIsAnimating(false)
    }, 1000)
  }

  const handleEnemyTurn = () => {
    const enemyDamage = Math.max(5, 15 - Math.floor(character.maxHp / 20))
    setCharacter(prev => ({ ...prev, hp: Math.max(0, prev.hp - enemyDamage) }))
    addLog(`${enemy.name} 攻击，造成 ${enemyDamage} 点伤害！`)

    setTimeout(() => {
      if (character.hp - enemyDamage <= 0) {
        addLog('战斗失败...')
        setTimeout(() => navigate('/plaza'), 2000)
      } else {
        setTurn('player')
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-gray-900">
      <div className="ui-overlay">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/plaza')} className="btn-danger">逃跑</button>
            <h1 className="text-xl font-bold text-white">战斗中</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-white">{user.username}</span>}
            <button onClick={handleLogout} className="btn-danger">退出登录</button>
          </div>
        </div>
        
        <div className="absolute top-20 left-4 card-game w-72">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl">🐱</div>
            <div>
              <h3 className="font-bold text-academic-purple">{character.name}</h3>
              <p className="text-sm text-gray-500">Lv.1</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>HP</span>
              <span>{character.hp}/{character.maxHp}</span>
            </div>
            <div className="hp-bar">
              <div className="hp-fill" style={{ width: `${(character.hp / character.maxHp) * 100}%` }} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>MP</span>
              <span>{character.mp}/{character.maxMp}</span>
            </div>
            <div className="mp-bar">
              <div className="mp-fill" style={{ width: `${(character.mp / character.maxMp) * 100}%` }} />
            </div>
          </div>
        </div>
        
        <div className="absolute top-20 right-4 card-game w-72">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl">👾</div>
            <div>
              <h3 className="font-bold text-red-600">{enemy.name}</h3>
              <p className="text-sm text-gray-500">Lv.{enemy.level}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>HP</span>
              <span>{enemy.hp}/{enemy.maxHp}</span>
            </div>
            <div className="hp-bar">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="card-game">
            <div className="flex justify-center gap-4 mb-4">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleAttack(skill)}
                  disabled={turn !== 'player' || isAnimating || character.mp < skill.mpCost}
                  className={`skill-btn ${character.mp < skill.mpCost ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-2xl">{skill.icon}</span>
                  <span className="text-xs mt-1">{skill.name}</span>
                  {skill.mpCost > 0 && <span className="text-xs text-campus-blue">{skill.mpCost} MP</span>}
                </button>
              ))}
            </div>
            
            <div className="h-32 overflow-y-auto bg-gray-100 rounded-lg p-2 scrollbar-hide">
              {battleLog.map((log) => (
                <p key={log.id} className="text-sm text-gray-700 mb-1">{log.message}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-red-900 to-gray-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl font-bold text-white">战斗场景</h2>
              <p className="text-gray-400 mt-2">{turn === 'player' ? '你的回合' : '敌人回合'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattlePage