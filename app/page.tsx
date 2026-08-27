"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FAQ_ITEMS } from "@/app/data/faq";

const DOT_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DICE_EMOJIS: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

const HISTORY_LIMIT = 10;

function playRollSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  const clackCount = 8;

  for (let i = 0; i < clackCount; i++) {
    const start = now + i * (0.07 + Math.random() * 0.05);
    const duration = 0.05 + Math.random() * 0.03;

    // Noise burst: gives the sound its gritty, rattling texture.
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 800 + Math.random() * 2500;
    bandpass.Q.value = 1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);
    noise.start(start);
    noise.stop(start + duration);

    // Short pitched knock layered on top, for the "clack" of dice hitting each other.
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(150 + Math.random() * 250, start);
    osc.frequency.exponentialRampToValueAtTime(60, start + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, start);
    oscGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(oscGain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }
}

const DICE_PROBABILITY_ROWS: (string | number)[][] = [
  ["1 die", 1, 6, "3.5", 6],
  ["2 dice", 2, 12, 7, 36],
  ["3 dice", 3, 18, "10.5", 216],
  ["4 dice", 4, 24, 14, "1,296"],
  ["5 dice", 5, 30, "17.5", "7,776"],
  ["6 dice", 6, 36, 21, "46,656"],
];

const TWO_DICE_ROWS: (string | number)[][] = [
  [2, 1, "1/36", "2.78%"],
  [3, 2, "2/36", "5.56%"],
  [4, 3, "3/36", "8.33%"],
  [5, 4, "4/36", "11.11%"],
  [6, 5, "5/36", "13.89%"],
  [7, 6, "6/36", "16.67%"],
  [8, 5, "5/36", "13.89%"],
  [9, 4, "4/36", "11.11%"],
  [10, 3, "3/36", "8.33%"],
  [11, 2, "2/36", "5.56%"],
  [12, 1, "1/36", "2.78%"],
];

const USE_CASES = [
  {
    title: "Board Games",
    desc: "Determine movement, actions, and turn order",
  },
  {
    title: "Classroom Activities",
    desc: "Counting, arithmetic, multiplication, probability experiments",
  },
  {
    title: "Probability Demonstrations",
    desc: "Compare theoretical vs experimental results",
  },
  {
    title: "Role Playing Games",
    desc: "Random event and decision making",
  },
  {
    title: "Writing Exercises",
    desc: "Random prompt, character, or story direction selection",
  },
  {
    title: "Casual Decisions",
    desc: "Choose randomly between up to six equal options",
  },
];

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 border-b-2 border-green-600 pb-3 text-2xl font-bold text-gray-900 dark:border-emerald-500 dark:text-white sm:text-3xl">
      {children}
    </h2>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm sm:text-base">
        <thead>
          <tr className="bg-green-600 text-white dark:bg-emerald-800">
            {headers.map((header) => (
              <th
                key={header}
                className="border border-gray-300 px-3 py-2 font-semibold dark:border-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800"
              }
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border border-gray-300 px-3 py-2 text-gray-800 dark:border-gray-700 dark:text-gray-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-bold text-gray-900 dark:text-white">
          {question}
        </span>
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center text-xl font-bold text-green-600 transition-transform duration-300 ease-in-out dark:text-emerald-400 ${
            isOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 font-normal leading-relaxed text-gray-700 dark:text-gray-300">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function DiceFace({ value }: { value: number }) {
  const active = DOT_LAYOUTS[value] ?? [];

  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2 p-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {active.includes(i) && (
            <span className="block h-4 w-4 rounded-full bg-black sm:h-5 sm:w-5" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [value, setValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // Load the saved theme (or fall back to the system preference) once on mount.
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial: "light" | "dark" =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  function rollDice() {
    if (isRolling) return;

    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = AudioContextClass ? new AudioContextClass() : null;
    }

    const ctx = audioCtxRef.current;
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      playRollSound(ctx);
    }

    setIsRolling(true);

    intervalRef.current = setInterval(() => {
      setValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setValue(finalValue);
      setIsRolling(false);
      setHistory((prev) => [...prev, finalValue].slice(-HISTORY_LIMIT));
    }, 1000);
  }

  return (
    <div className="relative flex w-full flex-col items-center bg-green-600 dark:bg-emerald-950">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl shadow-md transition-colors hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 px-4 py-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Dice Roller</h1>
          <p className="text-lg font-medium text-white/90 sm:text-xl">
            Click the dice to roll!
          </p>
        </div>

        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          aria-label="Roll the dice"
          className={`flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl bg-white shadow-xl transition-transform duration-150 hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed sm:h-40 sm:w-40 ${
            isRolling ? "animate-bounce" : ""
          }`}
        >
          <DiceFace value={value} />
        </button>

        <p className="text-xl font-medium text-white sm:text-2xl">
          Your number: <span className="font-bold">{value}</span>
        </p>

        {history.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-white/70">
              Roll History
            </p>
            <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
              {history.map((roll, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white dark:bg-black/20"
                >
                  <span aria-hidden="true">{DICE_EMOJIS[roll]}</span>
                  <span>{roll}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="w-full bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-14">
            <SectionHeading>How to Use the Online Dice Roller</SectionHeading>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              Click or tap the dice to roll it. Each roll produces a random
              number from 1 through 6. The dice animates briefly before
              showing the final result. A rolling sound plays on each click.
              Your last 10 results appear in the Roll History section below
              the dice. Use the Dark Mode toggle in the top right corner to
              switch themes.
            </p>
          </div>

          <div className="mb-14">
            <SectionHeading>What Is a Die?</SectionHeading>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              A die is a small object with numbered faces, rolled to produce
              a random result. Die is the singular form and dice is the
              plural. The standard six-sided die is a cube. Its six faces
              are marked from 1 through 6 using dots called pips. In gaming
              notation it is written as d6. Two six-sided dice are written
              as 2d6, three as 3d6, and so on. Dice can also have other
              shapes such as d4, d8, d10, d12, and d20, commonly used in
              role-playing games.
            </p>
          </div>

          <div className="mb-14">
            <SectionHeading>When Were Dice Invented?</SectionHeading>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              Dice have no single known inventor. Research published in 2026
              identified two-sided dice in Folsom-period archaeological
              sites in Wyoming, Colorado, and New Mexico, dating back
              approximately 12,000 years, currently the oldest known
              evidence of dice. Ancient Old World collections also include
              tetrahedral dice from the Royal Game of Ur and cube-shaped
              Greek and Roman dice made from bone, ivory, stone, and
              ceramic.
            </p>
          </div>

          <div className="mb-14">
            <SectionHeading>
              Dice Probability: Results by Number of Dice
            </SectionHeading>
            <DataTable
              headers={[
                "Dice",
                "Minimum Total",
                "Maximum Total",
                "Average Total",
                "Ordered Outcomes",
              ]}
              rows={DICE_PROBABILITY_ROWS}
            />
          </div>

          <div className="mb-14">
            <SectionHeading>Two Dice Probability Table</SectionHeading>
            <DataTable
              headers={["Total", "Combinations", "Probability", "Percentage"]}
              rows={TWO_DICE_ROWS}
            />
          </div>

          <div className="mb-14">
            <SectionHeading>How This Dice Roller Works</SectionHeading>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              Each roll is generated in the browser using JavaScript&apos;s
              Math.random() function, ensuring every face from 1 through 6
              has an equal probability of 1/6 or approximately 16.67%. The
              animation is purely visual and does not affect the result.
              Previous rolls have no influence on future results. Every roll
              is completely independent.
            </p>
          </div>

          <div className="mb-14">
            <SectionHeading>Common Uses for a Dice Roller</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((useCase) => (
                <div
                  key={useCase.title}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="font-bold text-gray-900 dark:text-white">
                    {useCase.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {useCase.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading>Frequently Asked Questions</SectionHeading>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  question={item.q}
                  answer={item.a}
                  isOpen={openFaqIndex === i}
                  onToggle={() =>
                    setOpenFaqIndex((prev) => (prev === i ? null : i))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
