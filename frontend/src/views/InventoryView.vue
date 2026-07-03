<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">背包</h1>
        <button @click="$router.push('/home')" class="px-4 py-2 bg-white rounded-lg shadow text-[#1A3C6E]">
          返回
        </button>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6 game-card-neon">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-[#1A3C6E]">携带槽</h2>
          <span class="text-xs text-gray-500">点击下方道具即可装配到对应槽位</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="slot in slots"
            :key="slot.key"
            :class="[
              'relative border-2 rounded-lg p-4 text-center transition-all cursor-pointer',
              selectedSlot === slot.key
                ? 'border-[#FFB7C5] bg-pink-50 shadow-md'
                : 'border-dashed border-gray-300 hover:border-gray-400'
            ]"
            @click="selectSlot(slot.key)"
          >
            <p class="text-xs text-gray-500 mb-2">{{ slot.icon }} {{ slot.label }}</p>
            <div v-if="getEquippedItem(slot.key)" class="space-y-1">
              <p class="text-sm font-bold text-[#1A3C6E]">{{ getEquippedItem(slot.key)?.name }}</p>
              <p class="text-xs text-gray-500">{{ getEquippedItem(slot.key)?.description }}</p>
              <button
                class="mt-1 text-xs text-red-500 hover:underline"
                @click.stop="unequip(slot.key)"
              >
                卸下
              </button>
            </div>
            <p v-else class="text-sm text-gray-400 py-2">空</p>
            <p class="text-[10px] text-gray-400 mt-2">{{ slot.bonus }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-[#1A3C6E]">道具</h2>
          <div class="flex gap-2">
            <button
              v-for="cat in categories"
              :key="cat.key"
              @click="selectedCategory = cat.key"
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                selectedCategory === cat.key
                  ? 'bg-[#1A3C6E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div v-if="filteredItems.length === 0" class="text-center text-gray-400 py-12">
          <p class="text-4xl mb-2">📦</p>
          <p class="text-sm">背包空空如也</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="item in filteredItems"
            :key="item.itemId"
            :class="[
              'border rounded-lg p-3 text-center transition-all cursor-pointer',
              isEquipped(item.itemId)
                ? 'border-[#FFB7C5] bg-pink-50 shadow-md'
                : 'hover:shadow-md hover:-translate-y-0.5'
            ]"
            @click="handleItemClick(item)"
          >
            <div
              class="w-12 h-12 mx-auto mb-2 rounded flex items-center justify-center text-white text-xl"
              :class="getIconBg(item)"
            >
              {{ getIconText(item) }}
            </div>
            <p class="text-sm font-bold text-[#1A3C6E]">{{ item.name }}</p>
            <p class="text-xs text-gray-500 mb-1">x{{ inventory[item.itemId] }}</p>
            <p v-if="item.category === 'tool'" class="text-[10px] text-purple-600">
              {{ item.slot === 'study' ? '学习' : item.slot === 'intern' ? '实习' : '探索' }}槽
            </p>
            <p v-if="isEquipped(item.itemId)" class="text-[10px] text-pink-600 mt-1">已装备</p>
            <p v-else-if="item.category === 'consumable'" class="text-[10px] text-blue-600 mt-1">点击使用</p>
            <p v-else-if="item.category === 'tool'" class="text-[10px] text-purple-600 mt-1">点击装备</p>
          </div>
        </div>
      </div>

      <div
        v-if="showUseResult"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1A3C6E] text-white px-4 py-2 rounded-lg shadow-lg text-sm"
      >
        {{ useResultText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import itemsConfig from '../game/config/items.json'

const gameStore = useGameStore()
const inventory = computed(() => gameStore.inventory)

interface SlotDef {
  key: 'study' | 'intern' | 'explore'
  label: string
  icon: string
  bonus: string
}

const slots: SlotDef[] = [
  { key: 'study', label: '学习', icon: '📚', bonus: 'EXP 速率加成' },
  { key: 'intern', label: '实习', icon: '💼', bonus: '校园币速率加成' },
  { key: 'explore', label: '探索', icon: '🧭', bonus: '揭示范围加成' }
]

const selectedSlot = ref<'study' | 'intern' | 'explore' | null>(null)
const selectedCategory = ref<'all' | 'consumable' | 'tool' | 'souvenir'>('all')
const showUseResult = ref(false)
const useResultText = ref('')

const categories = [
  { key: 'all' as const, label: '全部' },
  { key: 'consumable' as const, label: '消耗品' },
  { key: 'tool' as const, label: '工具' },
  { key: 'souvenir' as const, label: '纪念品' }
]

const filteredItems = computed(() => {
  const ownedIds = Object.keys(inventory.value)
  return itemsConfig.filter(item => {
    if (!ownedIds.includes(item.itemId)) return false
    if (selectedCategory.value === 'all') return true
    return item.category === selectedCategory.value
  })
})

const getEquippedItem = (slot: 'study' | 'intern' | 'explore') => {
  const itemId = gameStore.equipped[slot]
  if (!itemId) return null
  return itemsConfig.find(i => i.itemId === itemId) || null
}

const isEquipped = (itemId: string) => {
  const equipped = gameStore.equipped
  return equipped.study === itemId || equipped.intern === itemId || equipped.explore === itemId
}

const selectSlot = (slot: 'study' | 'intern' | 'explore') => {
  selectedSlot.value = selectedSlot.value === slot ? null : slot
}

const handleItemClick = (item: any) => {
  if (item.category === 'tool' && item.slot) {
    equipToSlot(item.slot, item.itemId)
  } else if (item.category === 'consumable') {
    useConsumable(item)
  } else if (item.category === 'tool' && selectedSlot.value) {
    equipToSlot(selectedSlot.value, item.itemId)
  } else {
    showResult(`${item.name}：${item.description}`)
  }
}

const equipToSlot = (slot: 'study' | 'intern' | 'explore', itemId: string) => {
  const currentEquipped = gameStore.equipped
  for (const k of ['study', 'intern', 'explore'] as const) {
    if (currentEquipped[k] === itemId && k !== slot) {
      gameStore.equipItem(k, undefined)
    }
  }
  gameStore.equipItem(slot, itemId)
  selectedSlot.value = slot
  const item = itemsConfig.find(i => i.itemId === itemId)
  showResult(`已装备：${item?.name || itemId} → ${slot === 'study' ? '学习' : slot === 'intern' ? '实习' : '探索'}槽`)
  gameStore.saveSave()
}

const unequip = (slot: 'study' | 'intern' | 'explore') => {
  gameStore.equipItem(slot, undefined)
  showResult(`已卸下${slot === 'study' ? '学习' : slot === 'intern' ? '实习' : '探索'}槽`)
  gameStore.saveSave()
}

const useConsumable = (item: any) => {
  if (!gameStore.useItem(item.itemId)) {
    showResult('使用失败：数量不足')
    return
  }
  if (item.effect) {
    switch (item.effect.type) {
      case 'exp':
        gameStore.addExp(item.effect.amount ?? 0)
        showResult(`获得 ${item.effect.amount} EXP`)
        break
      case 'credits':
        gameStore.addCredits(item.effect.amount ?? 0)
        showResult(`获得 ${item.effect.amount} 学分`)
        break
      case 'coins':
        gameStore.addCoins(item.effect.amount ?? 0)
        showResult(`获得 ${item.effect.amount} 校园币`)
        break
      case 'heal':
        showResult(`回复 ${item.effect.amount} HP`)
        break
      case 'shield':
        showResult(`下次战斗获得 ${item.effect.amount} 护盾`)
        break
      case 'buff':
        showResult(`获得 Buff：${item.effect.stat} +${item.effect.value}`)
        break
      default:
        showResult(`使用了 ${item.name}`)
    }
  } else {
    showResult(`使用了 ${item.name}`)
  }
  gameStore.saveSave()
}

const showResult = (text: string) => {
  useResultText.value = text
  showUseResult.value = true
  setTimeout(() => {
    showUseResult.value = false
  }, 2000)
}

const getIconBg = (item: any) => {
  switch (item.category) {
    case 'consumable':
      return 'bg-gradient-to-br from-[#4ECDC4] to-[#1A3C6E]'
    case 'tool':
      return 'bg-gradient-to-br from-[#9B59B6] to-[#6A1B9A]'
    case 'souvenir':
      return 'bg-gradient-to-br from-[#FFB7C5] to-[#FF6B9D]'
    default:
      return 'bg-gradient-to-br from-[#1A3C6E] to-[#4ECDC4]'
  }
}

const getIconText = (item: any) => {
  if (item.effect?.type === 'exp') return '💧'
  if (item.effect?.type === 'credits') return '📜'
  if (item.effect?.type === 'heal') return '❤️'
  if (item.effect?.type === 'shield') return '🛡️'
  if (item.effect?.type === 'buff') return '✨'
  if (item.category === 'tool') return '🔧'
  if (item.category === 'souvenir') return '🎁'
  return '📦'
}
</script>
