/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameMode, PlayerState, LiveMetrics, EnemyEntity, TechUpgrade } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { DevTerminal } from './components/DevTerminal';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level UI state (updated only on key events or periodic ticks, canvas never unmounts)
  const [gameMode, setGameMode] = useState<GameMode>('TITLE');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [pendingUpgrades, setPendingUpgrades] = useState<TechUpgrade[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    fps: 60,
    latencyNs: 240,
    activeThreads: 8,
    allocatedMemoryMb: 64,
    cpuLoadPercent: 12,
    gitCommitHash: 'git-0x4a9b',
  });
  const [activeBoss, setActiveBoss] = useState<EnemyEntity | null>(null);
  const [highScore, setHighScore] = useState(0);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;
    setHighScore(engine.player.highScore);

    // Callbacks from GameEngine to React HUD
    engine.onStateUpdate = (p, m, boss) => {
      // Throttle React state updates to avoid unnecessary React re-renders
      setPlayerState({ ...p });
      setLiveMetrics({ ...m });
      setActiveBoss(boss ? { ...boss } : null);
    };

    engine.onLevelUpPrompt = (upgrades) => {
      setPendingUpgrades(upgrades);
      setGameMode('LEVEL_UP');
    };

    engine.onGameOverPrompt = (p) => {
      setPlayerState({ ...p });
      setHighScore(p.highScore);
      setGameMode('GAMEOVER');
    };

    engine.startLoop();

    // Global Key Listener for ESC (pause) and ~ (terminal)
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote' || e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      } else if (e.code === 'Escape') {
        if (isTerminalOpen) {
          setIsTerminalOpen(false);
        } else if (engine.mode === 'PLAYING') {
          engine.pauseGame();
          setGameMode('PAUSED');
        } else if (engine.mode === 'PAUSED') {
          engine.resumeGame();
          setGameMode('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);

    return () => {
      window.removeEventListener('keydown', handleGlobalKey);
      engine.dispose();
      engineRef.current = null;
    };
  }, [isTerminalOpen]);

  // Action handlers
  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
    setGameMode('PLAYING');
  }, []);

  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pauseGame();
    setGameMode('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resumeGame();
    setGameMode('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
    setGameMode('PLAYING');
  }, []);

  const handleHome = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.mode = 'TITLE';
    setGameMode('TITLE');
  }, []);

  const handleSelectUpgrade = useCallback((upgrade: TechUpgrade) => {
    if (!engineRef.current) return;
    engineRef.current.applyUpgrade(upgrade);
    setPendingUpgrades([]);
    setGameMode('PLAYING');
  }, []);

  const handleExecuteTerminalCommand = useCallback((cmd: string) => {
    if (!engineRef.current) return 'Engine not initialized.';
    return engineRef.current.executeCommand(cmd);
  }, []);

  const handleTriggerDash = useCallback(() => {
    engineRef.current?.triggerDash();
  }, []);

  const handleTriggerGC = useCallback(() => {
    engineRef.current?.triggerGarbageCollection();
  }, []);

  const handleTriggerOverclock = useCallback(() => {
    engineRef.current?.triggerOverclock();
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-mono select-none">
      {/* 3D WebGL Canvas Mount Container (Pure isolated ref, never destroyed during UI transitions) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair overflow-hidden"
      />

      {/* Retro CRT Scanlines overlay for atmosphere */}
      <div className="absolute inset-0 z-10 scanlines pointer-events-none opacity-40" />

      {/* Screen Title Overlay (when in TITLE mode) */}
      {gameMode === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          highScore={highScore}
        />
      )}

      {/* In-Game World-Matched HUD (when in active gameplay states) */}
      {(gameMode === 'PLAYING' || gameMode === 'PAUSED' || gameMode === 'LEVEL_UP') && playerState && (
        <GameHUD
          player={playerState}
          metrics={liveMetrics}
          activeBoss={activeBoss}
          wave={engineRef.current?.wave || 1}
          onPause={handlePause}
          onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
          onTriggerDash={handleTriggerDash}
          onTriggerGC={handleTriggerGC}
          onTriggerOverclock={handleTriggerOverclock}
        />
      )}

      {/* Level Up Tech Stack Selection Modal */}
      {gameMode === 'LEVEL_UP' && pendingUpgrades.length > 0 && playerState && (
        <UpgradeModal
          upgrades={pendingUpgrades}
          onSelectUpgrade={handleSelectUpgrade}
          level={playerState.level}
        />
      )}

      {/* Pause Modal */}
      {gameMode === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenTerminal={() => setIsTerminalOpen(true)}
        />
      )}

      {/* Game Over Modal */}
      {gameMode === 'GAMEOVER' && playerState && (
        <GameOverModal
          finalPlayer={playerState}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenTerminal={() => setIsTerminalOpen(true)}
        />
      )}

      {/* Developer Terminal CLI Overlay */}
      <DevTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onExecute={handleExecuteTerminalCommand}
      />
    </div>
  );
}
