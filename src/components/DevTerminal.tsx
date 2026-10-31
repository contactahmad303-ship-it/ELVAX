import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, CornerDownLeft, Sparkles } from 'lucide-react';

interface DevTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (cmd: string) => string;
}

export const DevTerminal: React.FC<DevTerminalProps> = ({
  isOpen,
  onClose,
  onExecute,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: 'boot --verbose',
      output: `[KERNEL 0x7FF01] Root terminal shell active.
Type 'help' for command directory or 'status' for real-time diagnostics.
Shortcuts: 'overclock' (turbo), 'nuke' (sweep bugs), 'spawn monolith' (boss).`,
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmed = input.trim();
    if (trimmed.toLowerCase() === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    const output = onExecute(trimmed);
    setHistory(prev => [...prev, { cmd: trimmed, output }]);
    setInput('');
  };

  const runQuick = (cmd: string) => {
    const output = onExecute(cmd);
    setHistory(prev => [...prev, { cmd, output }]);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none pointer-events-auto">
      <div className="w-full max-w-2xl h-[520px] rounded-lg border border-cyan-500/40 bg-slate-950/95 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col font-mono text-xs overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>root@kernel-host:~# [SYSTEM CLI]</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500">ESC or ~ to close</span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 overflow-x-auto text-[11px]">
          <span className="text-slate-500 mr-1 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-cyan-400" />
            Quick:
          </span>
          <button
            onClick={() => runQuick('help')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
          >
            help
          </button>
          <button
            onClick={() => runQuick('status')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
          >
            status
          </button>
          <button
            onClick={() => runQuick('overclock')}
            className="px-2 py-0.5 rounded bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 border border-pink-500/30 cursor-pointer"
          >
            overclock
          </button>
          <button
            onClick={() => runQuick('nuke')}
            className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 cursor-pointer"
          >
            nuke
          </button>
          <button
            onClick={() => runQuick('spawn monolith')}
            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 cursor-pointer"
          >
            spawn monolith
          </button>
          <button
            onClick={() => runQuick('godmode')}
            className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 cursor-pointer"
          >
            godmode
          </button>
          <button
            onClick={() => runQuick('matrix')}
            className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 cursor-pointer"
          >
            matrix
          </button>
        </div>

        {/* Terminal Log Output */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono leading-relaxed select-text">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
                <span>❯</span>
                <span>{item.cmd}</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800/80 text-[11px]">
                {item.output}
              </pre>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-4 py-2.5 bg-slate-900/90 border-t border-slate-800"
        >
          <span className="text-cyan-400 font-bold mr-2">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type command ('help', 'status', 'overclock', 'nuke')..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-hidden font-mono text-xs"
          />
          <button
            type="submit"
            className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
