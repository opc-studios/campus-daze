import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterApi } from '../services/api'

const characters = [
  { id: 1, name: '莉娜', catType: '白色长毛猫', personality: '温柔治愈型学术喵', battleRole: '辅助/治疗/控场', sprite: '' },
  { id: 2, name: '阿宇', catType: '狸花猫', personality: '勇敢均衡型学术喵', battleRole: '近战/输出/机动', sprite: '' },
  { id: 3, name: '知夏', catType: '布偶猫', personality: '睿智学术型魔法喵', battleRole: '远程/法术/爆发', sprite: '' },
  { id: 4, name: '江寻', catType: '虎斑猫(丛林型)', personality: '灵活善型战斗喵', battleRole: '远程/物理/大范围', sprite: '' },
  { id: 5, name: '老登', catType: '蓝猫', personality: '强力近战型力量喵', battleRole: '近战/坦克/控制', sprite: '' },
]

const professions = [
  { id: 1, name: '学霸', description: '稳定法术输出', skillBonus: '公式光束、远程压制' },
  { id: 2, name: '学渣', description: '逆袭坦克', skillBonus: '错题护盾、残血爆发' },
  { id: 3, name: '卷王', description: '高速连击', skillBonus: 'DDL冲锋、经验加成' },
  { id: 4, name: '课代表', description: '辅助治疗', skillBonus: '点名鼓舞、团队增益' },
]

function CreateCharacterPage() {
  const [name, setName] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [selectedProfession, setSelectedProfession] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!name || !selectedCharacter || !selectedProfession) {
      setError('请填写完整信息')
      return
    }
    
    try {
      await characterApi.create({
        name,
        character_template_id: selectedCharacter,
        profession_id: selectedProfession,
      })
      navigate('/plaza')
    } catch (err) {
      setError(err.response?.data?.detail || '创建角色失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-game max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-academic-purple mb-2">选择你的学术喵</h1>
          <p className="text-gray-500">选择一个角色开启你的校园冒险</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请输入角色名称"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择角色</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCharacter === char.id
                      ? 'border-sakura bg-sakura/10'
                      : 'border-gray-200 hover:border-sakura/50'
                  }`}
                >
                  <h3 className="font-bold text-lg text-academic-purple">{char.name}</h3>
                  <p className="text-sm text-gray-600">{char.catType}</p>
                  <p className="text-xs text-gray-500 mt-1">{char.personality}</p>
                  <p className="text-xs text-campus-blue mt-1">{char.battleRole}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择职业</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professions.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfession(prof.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProfession === prof.id
                      ? 'border-campus-blue bg-campus-blue/10'
                      : 'border-gray-200 hover:border-campus-blue/50'
                  }`}
                >
                  <h3 className="font-bold text-lg text-campus-blue">{prof.name}</h3>
                  <p className="text-sm text-gray-600">{prof.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{prof.skillBonus}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            className="btn-game w-full text-lg"
          >
            创建角色
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateCharacterPage