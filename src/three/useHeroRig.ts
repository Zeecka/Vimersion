import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { HeroReaction } from './stageState'

/**
 * Animation state machine for the hero. Each character supplies its own
 * reaction→clip map (clip names differ per model). Loops idle/typing; plays
 * one-shots (win/levelup/fail) once with clampWhenFinished, then falls back to
 * the current base state. A reaction whose clip is missing on this model falls
 * back to the idle clip, so a character that lacks e.g. a jump degrades cleanly.
 */
const ONE_SHOTS: HeroReaction[] = ['win', 'levelup', 'fail']
const FADE = 0.25

export function useHeroRig(
  actions: Record<string, THREE.AnimationAction | null>,
  mixer: THREE.AnimationMixer,
  reaction: HeroReaction,
  clipMap: Record<HeroReaction, string>,
) {
  const current = useRef<THREE.AnimationAction | null>(null)
  // The loop to return to after a one-shot finishes (idle or typing).
  const base = useRef<HeroReaction>('idle')

  useEffect(() => {
    const play = (name: HeroReaction, once: boolean) => {
      const next = actions[clipMap[name]] ?? actions[clipMap.idle]
      if (!next || next === current.current) return
      next.reset()
      if (once) {
        next.setLoop(THREE.LoopOnce, 1)
        next.clampWhenFinished = true
      } else {
        next.setLoop(THREE.LoopRepeat, Infinity)
      }
      if (current.current) next.crossFadeFrom(current.current, FADE, true)
      next.play()
      current.current = next
    }

    if (ONE_SHOTS.includes(reaction)) {
      play(reaction, true)
      const onFinished = (e: { action: THREE.AnimationAction }) => {
        if (e.action !== current.current) return
        play(base.current, false)
      }
      mixer.addEventListener('finished', onFinished)
      return () => mixer.removeEventListener('finished', onFinished)
    }

    base.current = reaction
    play(reaction, false)
  }, [reaction, actions, mixer, clipMap])
}
