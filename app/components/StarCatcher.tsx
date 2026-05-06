'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  points: number;
}

const GOOD_ITEMS = ['⭐', '🌟', '💫', '✨', '🌙', '💎', '🍭', '🎁'];
const BAD_ITEMS = ['💣', '🌧️'];
const CATCHER = '🧺';
const GAME_WIDTH = 300;
const GAME_HEIGHT = 400;
const CATCHER_SIZE = 44;
const ITEM_SIZE = 28;
const TICK_MS = 30;

export default function StarCatcher({ minimal }: { minimal?: boolean }) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [catcherX, setCatcherX] = useState(GAME_WIDTH / 2 - CATCHER_SIZE / 2);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState('');
  const nextId = useRef(0);
  const frameRef = useRef<number | null>(null);
  const spawnTimer = useRef(0);
  const difficulty = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef(catcherX);
  const itemsRef = useRef(items);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const comboRef = useRef(combo);

  // Sync refs
  catcherRef.current = catcherX;
  itemsRef.current = items;
  scoreRef.current = score;
  livesRef.current = lives;
  comboRef.current = combo;

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('starcatcher-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setItems([]);
    setCombo(0);
    setFlash('');
    setCatcherX(GAME_WIDTH / 2 - CATCHER_SIZE / 2);
    difficulty.current = 1;
    spawnTimer.current = 0;
    nextId.current = 0;
    setGameState('playing');
  }, []);

  const endGame = useCallback((finalScore: number) => {
    setGameState('over');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('starcatcher-highscore', String(finalScore));
    }
  }, [highScore]);

  // Keyboard controls
  useEffect(() => {
    if (gameState !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setCatcherX(x => Math.max(0, x - 20));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setCatcherX(x => Math.min(GAME_WIDTH - CATCHER_SIZE, x + 20));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  // Touch/mouse drag
  useEffect(() => {
    if (gameState !== 'playing') return;
    const el = canvasRef.current;
    if (!el) return;

    const getX = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const relX = clientX - rect.left;
      return Math.max(0, Math.min(GAME_WIDTH - CATCHER_SIZE, relX - CATCHER_SIZE / 2));
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      setCatcherX(getX(e.touches[0].clientX));
    };
    const onMouse = (e: MouseEvent) => {
      if (e.buttons > 0) setCatcherX(getX(e.clientX));
    };
    const onClick = (e: MouseEvent) => {
      setCatcherX(getX(e.clientX));
    };

    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('mousemove', onMouse);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('mousemove', onMouse);
      el.removeEventListener('click', onClick);
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = () => {
      spawnTimer.current += TICK_MS;

      // Increase difficulty over time
      difficulty.current = 1 + scoreRef.current / 50;
      const spawnRate = Math.max(400, 1200 - difficulty.current * 80);

      // Spawn items
      if (spawnTimer.current >= spawnRate) {
        spawnTimer.current = 0;
        const isBad = Math.random() < Math.min(0.2, 0.05 + difficulty.current * 0.015);
        const emoji = isBad
          ? BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)]
          : GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
        const speed = 1.5 + Math.random() * difficulty.current * 0.8;
        const newItem: FallingItem = {
          id: nextId.current++,
          x: Math.random() * (GAME_WIDTH - ITEM_SIZE),
          y: -ITEM_SIZE,
          emoji,
          speed,
          points: isBad ? -1 : (emoji === '💎' ? 5 : emoji === '🎁' ? 3 : 1),
        };
        setItems(prev => [...prev, newItem]);
      }

      // Move items + check collisions
      setItems(prev => {
        const kept: FallingItem[] = [];
        let newScore = scoreRef.current;
        let newLives = livesRef.current;
        let newCombo = comboRef.current;
        let flashMsg = '';

        for (const item of prev) {
          const ny = item.y + item.speed;

          // Check catch (item near catcher)
          const cx = catcherRef.current;
          if (
            ny + ITEM_SIZE >= GAME_HEIGHT - CATCHER_SIZE &&
            ny <= GAME_HEIGHT &&
            item.x + ITEM_SIZE > cx &&
            item.x < cx + CATCHER_SIZE
          ) {
            if (item.points < 0) {
              newLives = Math.max(0, newLives - 1);
              newCombo = 0;
              flashMsg = '💥 Ouch!';
            } else {
              newCombo += 1;
              const bonus = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
              newScore += item.points * bonus;
              if (newCombo === 5) flashMsg = '🔥 5x Combo!';
              else if (newCombo === 10) flashMsg = '⚡ 10x SUPER!';
              else if (item.emoji === '💎') flashMsg = '💎 +5!';
            }
            continue; // consumed
          }

          // Fell off bottom
          if (ny > GAME_HEIGHT + 10) {
            if (item.points > 0) {
              newCombo = 0; // break combo on miss
            }
            continue; // remove
          }

          kept.push({ ...item, y: ny });
        }

        setScore(newScore);
        setLives(newLives);
        setCombo(newCombo);
        if (flashMsg) {
          setFlash(flashMsg);
          setTimeout(() => setFlash(''), 800);
        }
        if (newLives <= 0) {
          endGame(newScore);
          return [];
        }

        return kept;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, endGame]);

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="text-sm text-white/50 font-medium">
        {gameState === 'idle' ? 'While you wait...' : ''}
      </div>

      {/* Scoreboard */}
      <div className="flex gap-4 text-sm font-bold">
        <span className="text-yellow-300">⭐ {score}</span>
        <span className="text-red-400">{'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}</span>
        {combo >= 3 && <span className="text-orange-400">🔥{combo}x</span>}
        <span className="text-white/40">🏆 {highScore}</span>
      </div>

      {/* Game canvas */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 cursor-pointer select-none"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background: 'linear-gradient(180deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
          touchAction: 'none',
        }}
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-4xl">⭐</div>
            <div className="text-white font-bold text-lg">Star Catcher!</div>
            <div className="text-white/50 text-xs text-center px-6">
              Catch stars, dodge bombs!<br/>Drag or use arrow keys
            </div>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
            >
              ▶ Play
            </button>
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 z-20">
            <div className="text-3xl">🎮</div>
            <div className="text-white font-bold text-lg">Game Over!</div>
            <div className="text-yellow-300 font-bold text-2xl">⭐ {score}</div>
            {score >= highScore && score > 0 && (
              <div className="text-green-400 text-xs font-bold animate-bounce">🏆 New High Score!</div>
            )}
            <button
              onClick={startGame}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
            >
              🔄 Play Again
            </button>
          </div>
        )}

        {/* Flash message */}
        {flash && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-xl font-black text-yellow-300 animate-bounce z-10 drop-shadow-lg pointer-events-none">
            {flash}
          </div>
        )}

        {/* Falling items */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute pointer-events-none"
            style={{
              left: item.x,
              top: item.y,
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              fontSize: ITEM_SIZE - 4,
              lineHeight: `${ITEM_SIZE}px`,
              textAlign: 'center',
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Catcher */}
        {gameState === 'playing' && (
          <div
            className="absolute"
            style={{
              left: catcherX,
              top: GAME_HEIGHT - CATCHER_SIZE,
              width: CATCHER_SIZE,
              height: CATCHER_SIZE,
              fontSize: CATCHER_SIZE - 8,
              lineHeight: `${CATCHER_SIZE}px`,
              textAlign: 'center',
            }}
          >
            {CATCHER}
          </div>
        )}
      </div>

      <div className="text-xs text-white/30">← → keys or drag to move</div>
    </div>
  );
}
