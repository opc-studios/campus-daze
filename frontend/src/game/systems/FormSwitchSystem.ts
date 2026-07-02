import { useGameStore } from '../../stores/game'
import type { FormType } from '../../types/game'

export class FormSwitchSystem {
  private gameStore: ReturnType<typeof useGameStore>

  constructor() {
    this.gameStore = useGameStore()
  }

  canSwitchForm(): boolean {
    if (!this.gameStore.state) return false

    const combatState = this.gameStore.state.combat.state
    if (combatState !== 'idle') return false

    return this.gameStore.state.map.formSwitchAllowed
  }

  getCurrentForm(): FormType {
    return this.gameStore.state?.player.currentForm ?? 'human'
  }

  switchForm(form: FormType): boolean {
    if (!this.canSwitchForm()) return false

    if (this.gameStore.state) {
      this.gameStore.state.player.currentForm = form
      return true
    }

    return false
  }

  toggleForm(): boolean {
    const currentForm = this.getCurrentForm()
    const newForm = currentForm === 'human' ? 'cat' : 'human'
    return this.switchForm(newForm)
  }

  forceHumanForm() {
    if (this.gameStore.state) {
      this.gameStore.state.player.currentForm = 'human'
    }
  }

  getFormBonus(form: FormType): { expBonus: number; coinBonus: number } {
    if (form === 'cat') {
      return { expBonus: 1.1, coinBonus: 1.0 }
    }
    return { expBonus: 1.0, coinBonus: 1.0 }
  }
}
