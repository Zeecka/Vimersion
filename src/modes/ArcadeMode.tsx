import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { sfx } from '../game/sound'
import { KeyCap } from '../ui/atoms'
import { Avatar } from '../ui/Avatar'

const ROWS = 5
const COLS = 9
const GAME_SECONDS = 30
const DIRS: Record<string, [number, number]> = {
  h: [0, -1],
  j: [1, 0],
  k: [-1, 0],
  l: [0, 1],
}

interface Cell {
  r: number
  c: number
}
interface State {
  cursor: Cell
  mole: Cell
  score: number
  combo: number
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function randomCell(exclude?: Cell): Cell {
  let cell: Cell
  do {
    cell = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
  } while (exclude && cell.r === exclude.r && cell.c === exclude.c)
  return cell
}

function freshState(): State {
  const cursor = { r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) }
  return { cursor, mole: randomCell(cursor), score: 0, combo: 0 }
}

type Phase = 'ready' | 'playing' | 'over'

export function ArcadeMode() {
  const recordArcade = useGame((s) => s.recordArcade)
  const best = useGame((s) => s.arcadeBest)
  const avatarId = useGame((s) => s.equipped.avatar)
  const isBlockAvatar = avatarId === 'cursor'

  const [phase, setPhase] = useState<Phase>('ready')
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [st, setSt] = useState<State>(freshState)
  const [isNewBest, setIsNewBest] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)

  const stRef = useRef(st)
  stRef.current = st
  const lastWhack = useRef(0)

  const start = () => {
    setSt(freshState())
    setTimeLeft(GAME_SECONDS)
    setIsNewBest(false)
    lastWhack.current = performance.now()
    setPhase('playing')
    sfx.ui()
  }

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('over')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  // Game over: record score once
  useEffect(() => {
    if (phase !== 'over') return
    const { isNewBest: nb, coinsGained } = recordArcade(stRef.current.score, ['h', 'j', 'k', 'l'])
    setIsNewBest(nb)
    setCoinsEarned(coinsGained)
    sfx.success()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Movement
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      const d = DIRS[e.key]
      if (!d) return
      e.preventDefault()
      const s = stRef.current
      const r = clamp(s.cursor.r + d[0], 0, ROWS - 1)
      const c = clamp(s.cursor.c + d[1], 0, COLS - 1)
      if (r === s.cursor.r && c === s.cursor.c) return // hit a wall

      if (r === s.mole.r && c === s.mole.c) {
        const now = performance.now()
        const combo = now - lastWhack.current < 1500 ? s.combo + 1 : 1
        lastWhack.current = now
        const gained = 10 + (combo - 1) * 3
        sfx.combo(combo)
        setSt({ cursor: { r, c }, mole: randomCell({ r, c }), score: s.score + gained, combo })
      } else {
        sfx.key()
        setSt({ ...s, cursor: { r, c } })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-terminal text-4xl text-amber glow-amber">Motion Rush</h2>
          <p className="mt-1 text-ink-dim">
            Whack the <span className="text-amber">@</span> using{' '}
            <KeyCap>h</KeyCap> <KeyCap>j</KeyCap> <KeyCap>k</KeyCap> <KeyCap>l</KeyCap>. Chain fast for combos.
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-ink-dim">best</div>
          <div className="font-terminal text-2xl text-term tabular-nums">{best}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 flex items-center gap-6">
        <div>
          <div className="text-xs text-ink-dim">SCORE</div>
          <div className="font-terminal text-3xl text-term tabular-nums">{st.score}</div>
        </div>
        <div>
          <div className="text-xs text-ink-dim">COMBO</div>
          <div className="font-terminal text-3xl text-magenta tabular-nums">×{st.combo}</div>
        </div>
        <div className="ml-auto w-40">
          <div className="mb-1 flex justify-between text-xs text-ink-dim">
            <span>TIME</span>
            <span className="tabular-nums">{timeLeft}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-border bg-panel-2">
            <div
              className="h-full bg-amber transition-[width] duration-1000 ease-linear"
              style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="panel relative mt-4 grid place-items-center overflow-hidden p-6">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const r = Math.floor(i / COLS)
            const c = i % COLS
            const isCursor = st.cursor.r === r && st.cursor.c === c
            const isMole = st.mole.r === r && st.mole.c === c && phase === 'playing'
            const cursorBg = isBlockAvatar
              ? 'var(--color-term)'
              : 'color-mix(in srgb, var(--color-term) 20%, transparent)'
            return (
              <div
                key={i}
                className="grid h-9 w-9 place-items-center rounded font-mono text-lg"
                style={{
                  background: isCursor ? cursorBg : 'rgba(255,255,255,0.02)',
                  color: isCursor && isBlockAvatar ? 'var(--color-bg)' : '#3a4454',
                  boxShadow: isCursor ? '0 0 12px color-mix(in srgb, var(--color-term) 50%, transparent)' : undefined,
                }}
              >
                {isMole ? (
                  <motion.span
                    className="text-amber glow-amber"
                    initial={{ scale: 0.4 }}
                    animate={{ scale: [0.9, 1.1, 0.9] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                  >
                    @
                  </motion.span>
                ) : isCursor ? (
                  isBlockAvatar ? <span>▉</span> : <Avatar id={avatarId} size={26} />
                ) : (
                  '·'
                )}
              </div>
            )
          })}
        </div>

        {phase !== 'playing' && (
          <div className="absolute inset-0 grid place-items-center bg-bg/85 backdrop-blur-sm">
            <div className="text-center">
              {phase === 'over' && (
                <>
                  <p className="font-terminal text-3xl text-term glow-term">TIME!</p>
                  <p className="mt-2 text-ink-dim">
                    Score <b className="text-ink">{st.score}</b>
                    {isNewBest && <span className="ml-2 text-amber">★ new best!</span>}
                  </p>
                  {coinsEarned > 0 && (
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-amber">
                      +{coinsEarned} <span className="coin" />
                    </p>
                  )}
                </>
              )}
              {phase === 'ready' && (
                <p className="max-w-xs text-ink-dim">
                  Move the cursor onto the mole before it moves. Speed builds your combo.
                </p>
              )}
              <button
                onClick={start}
                className="mt-5 rounded bg-term px-6 py-2.5 font-bold text-bg transition-transform hover:scale-105"
              >
                {phase === 'over' ? '↻ Play Again' : '▶ Start'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
