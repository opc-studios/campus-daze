<template>
  <div class="page-container">
    <!-- 退出按钮 -->
    <button
      @click="handleLogout"
      class="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all duration-300 group"
      title="退出登录"
    >
      <svg class="w-5 h-5 text-white/70 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    </button>
    <div class="max-w-2xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回校园广场
      </router-link>

      <div class="text-center mb-8 animate-fade-in-up">
        <h2 class="text-3xl font-black text-white mb-2">⚔️ 战斗竞技场</h2>
        <p class="text-gray-400">选择敌人，展开激战！</p>
      </div>

      <!-- 敌人选择 -->
      <div v-if="!battleActive && !battleLog.length" class="mb-8">
        <h3 class="text-lg font-bold text-white mb-4 animate-fade-in-up">👾 选择对手</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="enemy in enemies"
            :key="enemy.id"
            class="game-card p-5 cursor-pointer animate-fade-in-scale hover:border-pink-500/50 transition-all"
            :class="selectedEnemy?.id === enemy.id ? 'game-card-glow-pink ring-2 ring-pink-500/50' : ''"
            @click="selectedEnemy = enemy"
          >
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl">
                {{ enemy.is_boss ? '👹' : '👾' }}
              </div>
              <div class="flex-1">
                <h4 class="text-white font-bold">{{ enemy.name }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-pink-400 text-sm">Lv.{{ enemy.level }}</span>
                  <span v-if="enemy.is_boss" class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">BOSS</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div class="px-2 py-1 rounded bg-white/5"><span class="text-gray-500">HP</span><span class="text-red-400 ml-1 font-bold">{{ enemy.max_hp }}</span></div>
              <div class="px-2 py-1 rounded bg-white/5"><span class="text-gray-500">ATK</span><span class="text-orange-400 ml-1 font-bold">{{ enemy.attack }}</span></div>
              <div class="px-2 py-1 rounded bg-white/5"><span class="text-gray-500">EXP</span><span class="text-blue-400 ml-1 font-bold">+{{ enemy.exp_reward }}</span></div>
              <div class="px-2 py-1 rounded bg-white/5"><span class="text-gray-500">金币</span><span class="text-yellow-400 ml-1 font-bold">+{{ enemy.coin_reward }}</span></div>
            </div>
          </div>
        </div>

        <div v-if="enemies.length === 0" class="game-card p-8 text-center">
          <div class="text-5xl mb-4">👾</div>
          <p class="text-gray-400">暂无可用敌人</p>
        </div>

        <div v-if="enemies.length > 0" class="text-center mt-6">
          <button
            class="game-btn game-btn-danger px-12 py-4 text-lg"
            :disabled="!selectedEnemy"
            @click="initBattle"
          >
            ⚔️ 挑战 {{ selectedEnemy?.name || '' }}
          </button>
        </div>
      </div>

      <!-- 战斗界面 -->
      <div v-if="battleActive || battleLog.length > 0">
        <!-- 敌人状态 -->
        <div v-if="battleEnemy" class="game-card game-card-glow-pink p-6 mb-6 animate-fade-in-scale">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-4xl">
              {{ battleEnemy.is_boss ? '👹' : '👾' }}
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-white">{{ battleEnemy.name }}</h3>
              <span class="text-pink-400 text-sm">Lv.{{ battleEnemy.level }}</span>
            </div>
            <div class="text-right">
              <span class="text-pink-400 text-lg font-black">{{ battleEnemy.current_hp }}</span>
              <span class="text-gray-500 text-sm"> / {{ battleEnemy.max_hp }}</span>
            </div>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill" :style="{ width: (battleEnemy.current_hp / battleEnemy.max_hp * 100) + '%', background: 'linear-gradient(90deg, #E74C3C, #FF6B6B)' }"></div>
          </div>
        </div>

        <!-- 玩家状态 -->
        <div v-if="battleCharacter" class="game-card game-card-glow-blue p-6 mb-6 animate-fade-in-scale" style="animation-delay: 0.1s">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-4xl">🐱</div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-white">{{ battleCharacter.name }}</h3>
              <span class="text-blue-400 text-sm">Lv.{{ battleCharacter.level }}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>HP</span>
                <span>{{ battleCharacter.current_hp }} / {{ battleCharacter.max_hp }}</span>
              </div>
              <div class="stat-bar">
                <div class="stat-bar-fill" :style="{ width: (battleCharacter.current_hp / battleCharacter.max_hp * 100) + '%', background: 'linear-gradient(90deg, #5CD85C, #45B745)' }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>MP</span>
                <span>{{ battleCharacter.current_mp || 0 }} / {{ battleCharacter.max_mp || 100 }}</span>
              </div>
              <div class="stat-bar">
                <div class="stat-bar-fill" :style="{ width: ((battleCharacter.current_mp || 0) / (battleCharacter.max_mp || 100) * 100) + '%', background: 'linear-gradient(90deg, #4A90D9, #357ABD)' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 战斗日志 -->
        <div v-if="battleLog.length > 0" class="game-card p-6 mb-6 animate-fade-in-up">
          <h3 class="text-lg font-bold text-white mb-3">📜 战斗日志</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            <div v-for="(log, i) in battleLog" :key="i" class="text-sm py-1.5 px-2 rounded-lg border-b border-white/5 last:border-0"
                 :class="log.includes('造成') ? 'text-green-300 bg-green-500/5' : log.includes('闪避') ? 'text-yellow-300 bg-yellow-500/5' : log.includes('击败') ? 'text-orange-300 bg-orange-500/5' : 'text-gray-300'">
              {{ log }}
            </div>
          </div>
        </div>

        <!-- 行动选择 -->
        <div v-if="battleActive" class="game-card p-6 animate-fade-in-up" style="animation-delay: 0.2s">
          <h3 class="text-lg font-bold text-white mb-4">🎯 行动选择</h3>
          <div class="grid grid-cols-2 gap-3">
            <button class="game-btn game-btn-danger" @click="attack" :disabled="!battleActive">
              <span class="text-lg mr-1">⚔️</span> 攻击
            </button>
            <button class="game-btn game-btn-primary" @click="defend" :disabled="!battleActive">
              <span class="text-lg mr-1">🛡️</span> 防御
            </button>
            <button class="game-btn game-btn-purple" @click="useSkill" :disabled="!battleActive">
              <span class="text-lg mr-1">✨</span> 技能
            </button>
            <button class="game-btn game-btn-success" @click="flee" :disabled="!battleActive">
              <span class="text-lg mr-1">🏃</span> 逃跑
            </button>
          </div>
        </div>

        <!-- 战斗结果 -->
        <div v-if="!battleActive && battleResult" class="game-card p-8 text-center animate-fade-in-scale">
          <div class="text-6xl mb-4">{{ battleResult === 'win' ? '🎉' : '💀' }}</div>
          <h3 class="text-2xl font-black text-white mb-2">{{ battleResult === 'win' ? '战斗胜利！' : '战斗失败...' }}</h3>
          <p class="text-gray-400 mb-6">{{ battleResult === 'win' ? '你获得了丰厚的奖励！' : '回去休息一下再战吧！' }}</p>
          <div class="flex gap-3 justify-center">
            <button class="game-btn game-btn-primary" @click="resetBattle">🔄 再来一局</button>
            <router-link to="/plaza" class="game-btn game-btn-secondary">🏫 返回广场</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'
import { characterApi } from '@/api/character'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

const enemies = ref([])
const selectedEnemy = ref(null)
const battleActive = ref(false)
const battleCharacter = ref(null)
const battleEnemy = ref(null)
const battleResult = ref(null)
const battleLog = ref([])

function addLog(msg) {
  battleLog.value = [...battleLog.value.slice(-49), msg]
}

function initBattle() {
  if (!selectedEnemy.value) return
  battleLog.value = []
  battleResult.value = null
  battleActive.value = true
  battleEnemy.value = {
    ...selectedEnemy.value,
    current_hp: selectedEnemy.value.max_hp
  }
  addLog(`⚔️ 战斗开始！挑战 ${battleEnemy.value.name} Lv.${battleEnemy.value.level}`)
}

function attack() {
  if (!battleActive.value || !battleEnemy.value) return
  const playerAtk = battleCharacter.value?.attack || 15
  const dmg = Math.max(1, playerAtk - (battleEnemy.value.defense || 0) + Math.floor(Math.random() * 5))
  battleEnemy.value.current_hp = Math.max(0, battleEnemy.value.current_hp - dmg)
  addLog(`⚔️ 你发动攻击！对 ${battleEnemy.value.name} 造成 ${dmg} 点伤害！`)

  if (battleEnemy.value.current_hp <= 0) {
    enemyDefeated()
    return
  }
  enemyTurn()
}

function defend() {
  if (!battleActive.value) return
  addLog('🛡️ 你进入防御姿态，减少受到的伤害！')
  enemyTurn(0.5)
}

function useSkill() {
  if (!battleActive.value || !battleEnemy.value) return
  const intAtk = (battleCharacter.value?.intelligence || 10) * 1.5
  const dmg = Math.max(3, Math.floor(intAtk) - (battleEnemy.value.defense || 0) + Math.floor(Math.random() * 8))
  battleEnemy.value.current_hp = Math.max(0, battleEnemy.value.current_hp - dmg)
  addLog(`✨ 你释放技能！对 ${battleEnemy.value.name} 造成 ${dmg} 点魔法伤害！`)

  if (battleEnemy.value.current_hp <= 0) {
    enemyDefeated()
    return
  }
  enemyTurn()
}

function flee() {
  if (Math.random() > 0.5) {
    addLog('🏃 你成功逃跑了！')
    battleActive.value = false
    battleResult.value = 'lose'
  } else {
    addLog('🏃 逃跑失败了！')
    enemyTurn()
  }
}

function enemyTurn(defenseMultiplier = 1) {
  if (!battleEnemy.value || !battleCharacter.value || !battleActive.value) return
  const enemyAtk = battleEnemy.value.attack || 10
  const playerDef = battleCharacter.value.defense || 5
  const dmg = Math.max(1, Math.floor((enemyAtk - playerDef) * defenseMultiplier) + Math.floor(Math.random() * 3))
  battleCharacter.value.current_hp = Math.max(0, battleCharacter.value.current_hp - dmg)
  addLog(`👾 ${battleEnemy.value.name} 反击！对你造成 ${dmg} 点伤害！`)

  if (battleCharacter.value.current_hp <= 0) {
    addLog('💀 你被击败了...')
    battleActive.value = false
    battleResult.value = 'lose'
  }
}

function enemyDefeated() {
  addLog(`🎉 你击败了 ${battleEnemy.value.name}！`)
  if (battleCharacter.value) {
    battleCharacter.value.exp = (battleCharacter.value.exp || 0) + battleEnemy.value.exp_reward
    battleCharacter.value.coins = (battleCharacter.value.coins || 0) + battleEnemy.value.coin_reward
    addLog(`⭐ 获得 ${battleEnemy.value.exp_reward} 经验值！`)
    addLog(`💰 获得 ${battleEnemy.value.coin_reward} 金币！`)
  }
  battleActive.value = false
  battleResult.value = 'win'
}

function resetBattle() {
  battleActive.value = false
  battleResult.value = null
  battleLog.value = []
  battleEnemy.value = null
  selectedEnemy.value = null
}

onMounted(async () => {
  try {
    const [enemyRes, charRes] = await Promise.all([
      gameApi.getEnemies(),
      characterApi.listCharacters()
    ])
    enemies.value = enemyRes || []
    if (charRes && charRes.length > 0) {
      battleCharacter.value = {
        ...charRes[0],
        current_hp: charRes[0].current_hp || charRes[0].max_hp || 100,
        max_hp: charRes[0].max_hp || 100,
        current_mp: charRes[0].current_mp || charRes[0].max_mp || 100,
        max_mp: charRes[0].max_mp || 100,
        attack: charRes[0].attack || 10,
        defense: charRes[0].defense || 5,
        intelligence: charRes[0].intelligence || 10
      }
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  }
})
</script>