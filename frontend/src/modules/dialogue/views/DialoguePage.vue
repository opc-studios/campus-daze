<template>
  <div class="page-container">
    <div class="max-w-2xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="game-card game-card-neon p-8 animate-fade-in-scale relative overflow-hidden">
        <div class="floating-particles">
          <span class="particle"></span><span class="particle"></span><span class="particle"></span>
        </div>

        <div class="relative z-10">
          <!-- NPC 头像和状态 -->
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-4xl">🐱</div>
            <div>
              <h2 class="text-2xl font-black text-white">{{ npcName }}</h2>
              <p class="text-purple-400 text-sm flex items-center gap-1">
                <span>❤️</span>
                <span>好感度: {{ affinity }}</span>
              </p>
            </div>
          </div>

          <!-- 对话气泡 -->
          <div class="p-6 rounded-xl bg-white/5 mb-6 min-h-32 relative border border-white/10">
            <div class="text-gray-200 text-lg leading-relaxed">
              {{ currentDialogue }}
            </div>
            <div class="absolute -bottom-3 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/10"></div>
          </div>

          <!-- 对话选项 -->
          <div v-if="dialogueOptions.length > 0" class="mb-6">
            <div
              v-for="(option, i) in dialogueOptions"
              :key="i"
              class="p-4 rounded-lg bg-white/5 border border-white/10 mb-2 cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all"
              @click="selectOption(i)"
            >
              <p class="text-gray-300">{{ option.text }}</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 justify-center">
            <button class="game-btn game-btn-primary" @click="nextDialogue">💬 继续对话</button>
            <button class="game-btn game-btn-gold" @click="giveGift">🎁 赠送礼物</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

const route = useRoute()
const npcId = route.params.npcId
const npcName = ref('学霸喵')
const affinity = ref(50)
const currentDialogue = ref('欢迎来到校园！我是学霸喵，有什么问题都可以问我哦~ 在这里你可以探索校园、完成任务、挑战关卡，成为最强的猫猫冒险者！')

const dialogueOptions = ref([])
const dialogues = [
  '图书馆里有很多珍贵的书籍，努力学习可以提升智力属性！',
  '实验室是个很有趣的地方，但也要小心那里的危险哦~',
  '操场是锻炼身体的好地方，可以去那里提升敏捷度！',
  '完成主线任务可以获得大量经验和金币奖励！',
  '记得经常去休息区恢复体力，保持最佳状态！',
  '遇到打不过的敌人就先去做任务升级，回来再挑战！'
]

let dialogueIndex = 0

function nextDialogue() {
  currentDialogue.value = dialogues[dialogueIndex % dialogues.length]
  dialogueIndex++
  affinity.value = Math.min(100, affinity.value + 2)
}

function giveGift() {
  affinity.value = Math.min(100, affinity.value + 5)
  currentDialogue.value = '谢谢你送的礼物！喵~ 好感度+5！'
  dialogueOptions.value = []
}

function selectOption(i) {
  currentDialogue.value = dialogueOptions.value[i].response
  dialogueOptions.value = []
  affinity.value += dialogueOptions.value[i].affinityChange
}

onMounted(async () => {
  try {
    // 尝试从API获取NPC数据
    if (npcId) {
      const res = await gameApi.listNpcs(npcId)
      if (res && res.length > 0) {
        // 实际项目中处理返回数据
      }
    }
  } catch (e) {
    console.error(e)
  }
})
</script>