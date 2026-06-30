<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all cursor-pointer"
       :class="selected ? 'border-campus-blue bg-campus-blue/5' : 'border-gray-200'">
    <div class="text-center mb-3">
      <div class="text-4xl mb-2">🐱</div>
      <h3 class="font-bold text-lg">{{ character.name }}</h3>
      <p class="text-sm text-gray-500">{{ character.template_name }}</p>
    </div>
    
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span>等级</span>
        <span class="font-semibold">{{ character.level }}</span>
      </div>
      <div class="flex justify-between">
        <span>经验</span>
        <span class="font-semibold">{{ character.exp }}</span>
      </div>
      <div class="flex justify-between">
        <span>HP</span>
        <span class="font-semibold">{{ character.hp }}/{{ character.max_hp }}</span>
      </div>
      <div class="flex justify-between">
        <span>职业</span>
        <span class="font-semibold">{{ character.profession_name }}</span>
      </div>
    </div>
    
    <div class="mt-3 pt-3 border-t">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>攻击: {{ character.attack }}</div>
        <div>防御: {{ character.defense }}</div>
        <div>敏捷: {{ character.agility }}</div>
        <div>智力: {{ character.intelligence }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  character: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})
</script>
