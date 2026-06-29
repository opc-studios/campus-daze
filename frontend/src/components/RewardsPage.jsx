import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import { rewardApi } from '../services/api'

function RewardsPage() {
  const [rewards, setRewards] = useState([])
  const [achievements, setAchievements] = useState([])
  const [claimedRewards, setClaimedRewards] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rewardsResponse = await rewardApi.getAll()
        setRewards(rewardsResponse.data)
        
        const achievementsResponse = await rewardApi.getAchievements()
        setAchievements(achievementsResponse.data)
      } catch (err) {
        console.error('Failed to fetch rewards:', err)
      }
    }
    fetchData()
  }, [])

  const handleClaimReward = async (rewardId) => {
    if (claimedRewards.includes(rewardId)) return
    
    try {
      const response = await rewardApi.claim(rewardId)
      alert(`领取成功！\n经验: ${response.data.rewards.exp}\n金币: ${response.data.rewards.coins}`)
      setClaimedRewards([...claimedRewards, rewardId])
    } catch (err) {
      console.error('Failed to claim reward:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="ui-overlay">
        <Header title="通关奖励" showBack />
        
        <div className="absolute top-20 left-4 right-4 bottom-4">
          <div className="card-game mb-6">
            <h3 className="font-bold text-lg text-campus-blue mb-4 flex items-center gap-2">
              <span>🎁</span> 可领取奖励
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{reward.name}</h4>
                    <span className="text-2xl">⭐</span>
                  </div>
                  
                  <div className="flex gap-4 mb-4">
                    {reward.exp_amount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="text-sm font-bold text-healing-green">{reward.exp_amount}</span>
                      </div>
                    )}
                    {reward.coin_amount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>💰</span>
                        <span className="text-sm font-bold text-yellow-600">{reward.coin_amount}</span>
                      </div>
                    )}
                    {reward.cat_food_amount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>🐟</span>
                        <span className="text-sm font-bold text-sakura">{reward.cat_food_amount}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={claimedRewards.includes(reward.id)}
                    className={`w-full py-2 rounded-lg font-semibold transition-all ${
                      claimedRewards.includes(reward.id)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-game'
                    }`}
                  >
                    {claimedRewards.includes(reward.id) ? '已领取' : '领取奖励'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card-game">
            <h3 className="font-bold text-lg text-academic-purple mb-4 flex items-center gap-2">
              <span>🏆</span> 成就系统
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl ${achievement.unlocked ? '' : 'opacity-30'}`}>
                      {achievement.unlocked ? '🏅' : '🔒'}
                    </div>
                    <div>
                      <h4 className={`font-bold ${achievement.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                        {achievement.name}
                      </h4>
                      <p className={`text-xs ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-yellow-600 bg-yellow-100 rounded-full py-1 px-3">
                      <span>✨</span>
                      <span>已解锁</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="game-container">
        <div className="phaser-game bg-gradient-to-b from-yellow-200 to-orange-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-white">奖励系统</h2>
              <p className="text-gray-700 mt-2">领取通关奖励和成就</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardsPage