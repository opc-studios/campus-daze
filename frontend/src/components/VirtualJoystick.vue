<template>
  <div
    v-if="visible"
    ref="joystickRef"
    class="virtual-joystick"
    :style="joystickStyle"
    @touchstart.prevent="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend.prevent="onTouchEnd"
    @touchcancel.prevent="onTouchEnd"
  >
    <div class="virtual-joystick__knob" :style="knobStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface JoystickVector {
  x: number // -1 ~ 1
  y: number // -1 ~ 1
}

const props = defineProps<{
  visible: boolean
  /** 摇杆中心 X（相对视口左上角，px） */
  posX: number
  /** 摇杆中心 Y（相对视口左上角，px） */
  posY: number
  /** 摇杆有效半径（px），默认 60 */
  radius?: number
}>()

const emit = defineEmits<{
  (e: 'move', vec: JoystickVector): void
  (e: 'stop'): void
}>()

const RADIUS_DEFAULT = 60
const radius = computed(() => props.radius ?? RADIUS_DEFAULT)

const joystickRef = ref<HTMLDivElement | null>(null)
const knobDx = ref(0)
const knobDy = ref(0)
const activeTouchId = ref<number | null>(null)
const centerX = ref(0)
const centerY = ref(0)

const joystickStyle = computed(() => ({
  left: `${props.posX - 60}px`,
  top: `${props.posY - 60}px`
}))

const knobStyle = computed(() => ({
  transform: `translate(calc(-50% + ${knobDx.value}px), calc(-50% + ${knobDy.value}px))`
}))

const onTouchStart = (e: TouchEvent) => {
  if (activeTouchId.value !== null) return
  const touch = e.changedTouches[0]
  if (!touch) return
  activeTouchId.value = touch.identifier
  centerX.value = touch.clientX
  centerY.value = touch.clientY
  knobDx.value = 0
  knobDy.value = 0
}

const onTouchMove = (e: TouchEvent) => {
  if (activeTouchId.value === null) return
  const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId.value)
  if (!touch) return
  const dx = touch.clientX - centerX.value
  const dy = touch.clientY - centerY.value
  const dist = Math.sqrt(dx * dx + dy * dy)
  const r = radius.value
  if (dist > r) {
    // 钳制在半径内
    knobDx.value = (dx / dist) * r
    knobDy.value = (dy / dist) * r
    emit('move', { x: dx / dist, y: dy / dist })
  } else {
    knobDx.value = dx
    knobDy.value = dy
    emit('move', { x: dx / r, y: dy / r })
  }
}

const onTouchEnd = (e: TouchEvent) => {
  const endedTouch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.value)
  if (!endedTouch) return
  activeTouchId.value = null
  knobDx.value = 0
  knobDy.value = 0
  emit('stop')
}

onUnmounted(() => {
  activeTouchId.value = null
})
</script>
