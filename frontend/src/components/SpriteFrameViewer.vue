<template>
  <div class="sprite-frame-viewer">
    <div class="viewer-header">
      <h2>精灵图帧提取器</h2>
      <div class="controls">
        <select v-model="selectedRoleId" @change="handleRoleChange">
          <option v-for="role in roles" :key="role.roleId" :value="role.roleId">
            {{ role.name }}
          </option>
        </select>
        <select v-model="selectedActionId" @change="handleActionChange">
          <option v-for="action in actions" :key="action.id" :value="action.id">
            {{ action.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="viewer-body">
      <div class="canvas-container">
        <canvas
          ref="canvasRef"
          :width="canvasSize"
          :height="canvasSize"
          class="frame-canvas"
        ></canvas>
        <div class="frame-info">{{ frameLabel }}</div>
      </div>

      <div class="frame-controls">
        <button @click="prevFrame" :disabled="!canPrevFrame">
          ◀ 上一帧
        </button>
        <span class="frame-indicator">{{ currentFrameIndex + 1 }} / {{ currentActionFrames }}</span>
        <button @click="nextFrame" :disabled="!canNextFrame">
          下一帧 ▶
        </button>
        <button @click="togglePlay" :class="{ playing: isPlaying }">
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
      </div>

      <div class="animation-preview">
        <h3>动作预览</h3>
        <div class="frames-grid">
          <div
            v-for="(_frame, idx) in currentActionFrames"
            :key="idx"
            class="frame-thumb"
            :class="{ active: idx === currentFrameIndex }"
            @click="currentFrameIndex = idx"
          >
            <canvas
              :width="thumbSize"
              :height="thumbSize"
              :ref="(el) => setThumbRef(el as HTMLCanvasElement | null, idx)"
            ></canvas>
            <span class="frame-number">{{ idx + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { SpriteFrameExtractor } from '../game/utils/SpriteFrameExtractor'
import type { ActionDef, RoleDef } from '../game/types'

const actions: ActionDef[] = [
  { "id": "idle", "label": "待机", "hint": "呼吸 / 站立", "row": 0, "fps": 7, "repeat": -1, "frames": [0, 1, 2, 3] },
  { "id": "walk", "label": "行走", "hint": "八向移动复用", "row": 1, "fps": 12, "repeat": -1, "frames": [0, 1, 2, 3, 4, 5] },
  { "id": "attack", "label": "施法 / 攻击", "hint": "法杖飞射物", "row": 2, "fps": 18, "repeat": 0, "frames": [0, 1, 2, 3] },
  { "id": "hit", "label": "受击", "hint": "短硬直", "row": 3, "fps": 11, "repeat": 0, "frames": [0, 1, 2, 3] },
  { "id": "death", "label": "倒地", "hint": "倒地保留", "row": 4, "fps": 9, "repeat": 0, "frames": [0, 1, 2, 3, 4, 5] },
  { "id": "transform", "label": "人猫互变", "hint": "变身预留", "row": 5, "fps": 20, "repeat": 0, "frames": [0, 1, 2, 3, 4, 5, 6, 7] },
  { "id": "catRun", "label": "猫形移动", "hint": "探索移动", "row": 6, "fps": 16, "repeat": -1, "frames": [0, 1, 2, 3] },
  { "id": "catJump", "label": "猫形跳跃", "hint": "穿越障碍预留", "row": 7, "fps": 16, "repeat": 0, "frames": [0, 1, 2, 3, 4, 5] }
]

const roles: RoleDef[] = [
  {
    "roleId": "lina",
    "name": "莉娜",
    "title": "实验室新星",
    "emoji": "⚗️",
    "color": "#ffb74d",
    "portrait": "assets/portraits/lina.png",
    "sprite": "assets/sprites/lina-sprites-v10-anchored-expanded.png",
    "combatRole": "summon_spirit",
    "mainAttr": "knowledge",
    "baseAttrs": { "knowledge": 8, "practice": 5, "insight": 6, "resilience": 4 },
    "combatStats": { "critRate": 0, "critDamage": 1.5, "evasionRate": 0, "accuracyRate": 1.0 },
    "stats": { "hp": 110, "atk": 16, "def": 7, "speed": 2.8 },
    "growth": { "hp": 11, "atk": 1.6, "def": 0.7 },
    "passive": { "id": "experiment_spirit", "name": "实验精神", "effect": "item_bonus", "value": 0.30, "desc": "道具效果+30%" },
    "description": "实验室的天才研究员",
    "quote": "让我来验证这个假设！",
    "combat": "召唤流",
    "weapon": "紫晶治疗杖",
    "cat": "白色长毛精灵猫",
    "actionGuide": "idle/walk/attack/hit/death/transform/catRun/catJump",
    "highlightQuotes": [],
    "voiceLines": { "idle": [], "event": [], "combat": [] },
    "bossRecLevel": 8,
    "selectLine": "让我来验证这个假设！"
  },
  {
    "roleId": "ayu",
    "name": "阿宇",
    "title": "代码狂人",
    "emoji": "💻",
    "color": "#81c784",
    "portrait": "assets/portraits/ayu.png",
    "sprite": "assets/sprites/ayu-sprites-v10-imagegen-anchored-clean.png",
    "combatRole": "dps_strike",
    "mainAttr": "practice",
    "baseAttrs": { "knowledge": 4, "practice": 8, "insight": 5, "resilience": 6 },
    "combatStats": { "critRate": 0, "critDamage": 1.5, "evasionRate": 0, "accuracyRate": 1.0 },
    "stats": { "hp": 100, "atk": 18, "def": 6, "speed": 3.2 },
    "growth": { "hp": 10, "atk": 1.8, "def": 0.6 },
    "passive": { "id": "debug_intuition", "name": "Debug直觉", "effect": "crit_rate", "value": 0.15, "desc": "暴击率+15%" },
    "description": "热血少年",
    "quote": "没有bug能逃过我的眼睛！",
    "combat": "连击流",
    "weapon": "实习工牌短剑",
    "cat": "橘色虎斑猫",
    "actionGuide": "idle/walk/attack/hit/death/transform/catRun/catJump",
    "highlightQuotes": [],
    "voiceLines": { "idle": [], "event": [], "combat": [] },
    "bossRecLevel": 6,
    "selectLine": "没有bug能逃过我的眼睛！"
  },
  {
    "roleId": "zhixia",
    "name": "知夏",
    "title": "樱花使者",
    "emoji": "🌸",
    "color": "#f48fb1",
    "portrait": "assets/portraits/zhixia.png",
    "sprite": "assets/sprites/zhixia-sprites-v2.png",
    "combatRole": "dps_burst",
    "mainAttr": "insight",
    "baseAttrs": { "knowledge": 6, "practice": 4, "insight": 8, "resilience": 5 },
    "combatStats": { "critRate": 0, "critDamage": 2.0, "evasionRate": 0, "accuracyRate": 1.0 },
    "stats": { "hp": 85, "atk": 22, "def": 4, "speed": 3.5 },
    "growth": { "hp": 8.5, "atk": 2.2, "def": 0.4 },
    "passive": { "id": "sakura_blessing", "name": "樱之祝福", "effect": "crit_damage", "value": 0.50, "desc": "暴击伤害+50%" },
    "description": "与樱花有着神秘联系的少女",
    "quote": "樱花会指引我们的道路。",
    "combat": "暴击流",
    "weapon": "实验室记录笔",
    "cat": "银灰色英短",
    "actionGuide": "idle/walk/attack/hit/death/transform/catRun/catJump",
    "highlightQuotes": [],
    "voiceLines": { "idle": [], "event": [], "combat": [] },
    "bossRecLevel": 7,
    "selectLine": "樱花会指引我们的道路。"
  },
  {
    "roleId": "jiangxun",
    "name": "江寻",
    "title": "图书馆幽灵",
    "emoji": "📚",
    "color": "#9575cd",
    "portrait": "assets/portraits/jiangxun.png",
    "sprite": "assets/sprites/jiangxun-sprites-v3.png",
    "combatRole": "dps_aoe",
    "mainAttr": "insight",
    "baseAttrs": { "knowledge": 5, "practice": 6, "insight": 8, "resilience": 4 },
    "combatStats": { "critRate": 0, "critDamage": 1.5, "evasionRate": 0, "accuracyRate": 1.0 },
    "stats": { "hp": 90, "atk": 20, "def": 5, "speed": 3.0 },
    "growth": { "hp": 9, "atk": 2.0, "def": 0.5 },
    "passive": { "id": "knowledge_thirst", "name": "知识渴求", "effect": "credit_bonus", "value": 0.20, "desc": "学分获取+20%" },
    "description": "图书馆的常客",
    "quote": "每一本书都是一扇门...",
    "combat": "穿透流",
    "weapon": "图书馆借阅卡匕首",
    "cat": "黑色缅因猫",
    "actionGuide": "idle/walk/attack/hit/death/transform/catRun/catJump",
    "highlightQuotes": [],
    "voiceLines": { "idle": [], "event": [], "combat": [] },
    "bossRecLevel": 6,
    "selectLine": "每一本书都是一扇门..."
  },
  {
    "roleId": "laodeng",
    "name": "老登",
    "title": "资深学长",
    "emoji": "🧙‍♂️",
    "color": "#4fc3f7",
    "portrait": "assets/portraits/laodeng.png",
    "sprite": "assets/sprites/laodeng-sprites-v2.png",
    "combatRole": "tank_heavy",
    "mainAttr": "resilience",
    "baseAttrs": { "knowledge": 5, "practice": 6, "insight": 4, "resilience": 8 },
    "combatStats": { "critRate": 0, "critDamage": 1.5, "evasionRate": 0, "accuracyRate": 1.0 },
    "stats": { "hp": 120, "atk": 15, "def": 8, "speed": 3.0 },
    "growth": { "hp": 12, "atk": 1.5, "def": 0.8 },
    "passive": { "id": "academic_foundation", "name": "学术底蕴", "effect": "exp_bonus", "value": 0.15, "desc": "EXP获取+15%" },
    "description": "经验丰富的学长",
    "quote": "学弟学妹们，跟我走，论文不迷路！",
    "combat": "反震流",
    "weapon": "混凝土教材盾",
    "cat": "灰白虎斑猫",
    "actionGuide": "idle/walk/attack/hit/death/transform/catRun/catJump",
    "highlightQuotes": [],
    "voiceLines": { "idle": [], "event": [], "combat": [] },
    "bossRecLevel": 5,
    "selectLine": "学弟学妹们，跟我走，论文不迷路！"
  }
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const thumbRefs = ref<(HTMLCanvasElement | null)[]>([])

const selectedRoleId = ref('lina')
const selectedActionId = ref('idle')
const currentFrameIndex = ref(0)
const isPlaying = ref(false)
const canvasSize = ref(256)
const thumbSize = ref(64)

const extractor = ref<SpriteFrameExtractor | null>(null)
let playInterval: number | null = null

const selectedRole = computed(() => roles.find((r: RoleDef) => r.roleId === selectedRoleId.value))
const selectedAction = computed(() => actions.find((a: ActionDef) => a.id === selectedActionId.value))
const currentActionFrames = computed(() => selectedAction.value?.frames.length || 0)

const canPrevFrame = computed(() => currentFrameIndex.value > 0)
const canNextFrame = computed(() => currentFrameIndex.value < currentActionFrames.value - 1)

const frameLabel = computed(() => {
  if (!extractor.value || !selectedAction.value) return ''
  const info = extractor.value.getFrameInfo(selectedRoleId.value, selectedAction.value, currentFrameIndex.value)
  return extractor.value.getFrameLabel(info)
})

const setThumbRef = (el: HTMLCanvasElement | null, idx: number) => {
  thumbRefs.value[idx] = el
}

const loadSprite = async () => {
  if (!selectedRole.value) return

  extractor.value = new SpriteFrameExtractor()
  await extractor.value.loadImage(selectedRole.value.sprite)
  renderFrame()
  renderThumbs()
}

const renderFrame = () => {
  if (!canvasRef.value || !extractor.value || !selectedAction.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const frameIdx = selectedAction.value.frames[currentFrameIndex.value]
  extractor.value.drawFrame(ctx, selectedAction.value, frameIdx, canvasSize.value, canvasSize.value)
}

const renderThumbs = () => {
  if (!extractor.value || !selectedAction.value) return

  selectedAction.value.frames.forEach((frameIdx: number, idx: number) => {
    const thumb = thumbRefs.value[idx]
    if (!thumb) return

    const ctx = thumb.getContext('2d')
    if (!ctx) return

    extractor.value!.drawFrame(ctx, selectedAction.value!, frameIdx, thumbSize.value, thumbSize.value)
  })
}

const prevFrame = () => {
  if (currentFrameIndex.value > 0) {
    currentFrameIndex.value--
  }
}

const nextFrame = () => {
  if (currentFrameIndex.value < currentActionFrames.value - 1) {
    currentFrameIndex.value++
  } else {
    currentFrameIndex.value = 0
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value

  if (isPlaying.value) {
    const fps = selectedAction.value?.fps || 10
    playInterval = window.setInterval(() => {
      nextFrame()
    }, 1000 / fps)
  } else if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const handleRoleChange = () => {
  currentFrameIndex.value = 0
  loadSprite()
}

const handleActionChange = () => {
  currentFrameIndex.value = 0
  renderFrame()
  renderThumbs()
}

watch(currentFrameIndex, () => {
  renderFrame()
})

onMounted(() => {
  loadSprite()
})

onUnmounted(() => {
  if (playInterval) {
    clearInterval(playInterval)
  }
})
</script>

<style scoped>
.sprite-frame-viewer {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.viewer-header h2 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.viewer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.frame-canvas {
  border: 2px solid #333;
  border-radius: 8px;
  background: #f5f5f5;
  image-rendering: pixelated;
}

.frame-info {
  margin-top: 10px;
  padding: 8px 16px;
  background: #eee;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.frame-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.frame-controls button {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  background: #4a90d9;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.frame-controls button:hover:not(:disabled) {
  background: #357abd;
}

.frame-controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.frame-controls button.playing {
  background: #e74c3c;
}

.frame-controls button.playing:hover {
  background: #c0392b;
}

.frame-indicator {
  font-size: 16px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.animation-preview h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.frames-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.frame-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s;
}

.frame-thumb:hover {
  background: #ddd;
}

.frame-thumb.active {
  background: #4a90d9;
}

.frame-thumb canvas {
  border: 1px solid #333;
  border-radius: 4px;
  image-rendering: pixelated;
}

.frame-thumb.active canvas {
  border-color: #fff;
}

.frame-number {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.frame-thumb.active .frame-number {
  color: #fff;
}
</style>