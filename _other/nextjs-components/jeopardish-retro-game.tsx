import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import styles from './JeopardishRetroGame.module.css'

export default function JeopardishRetroGame() {
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [answer, setAnswer] = useState('')
  const [question, setQuestion] = useState('This is where the question will appear...')
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    // Simulate CRT screen effect
    const interval = setInterval(() => {
      const game = document.getElementById('game-screen')
      if (game) {
        game.style.opacity = (Math.random() * 0.05 + 0.95).toString()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black p-4 font-mono text-green-400">
      <div id="game-screen" className="max-w-4xl mx-auto border-4 border-green-400 p-4 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.5)] transition-opacity">
        <h1 className={`text-4xl font-bold text-center mb-6 animate-pulse ${styles['retro-text']}`}>
          JEOPARDISH!
        </h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            variant="outline" 
            className="border-2 border-green-400 hover:bg-green-400 hover:text-black transition-colors"
            onClick={() => {
              setQuestion('New question loaded!')
              setShowAnswer(false)
            }}
          >
            New Question
          </Button>
          <Button 
            variant="outline" 
            className="border-2 border-green-400 hover:bg-green-400 hover:text-black transition-colors"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Button>
        </div>
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Enter your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-black border-2 border-green-400 text-green-400 placeholder-green-600"
          />
        </div>
        <Button 
          className="w-full mb-6 bg-green-400 text-black hover:bg-green-500 transition-colors"
          onClick={() => {
            // Implement answer checking logic here
            setScore(score + 100)
            setStreak(streak + 1)
            setBestStreak(Math.max(bestStreak, streak + 1))
          }}
        >
          Check Answer
        </Button>
        <QuestionBubble question={question} showAnswer={showAnswer} />
        <HostCharacter />
        <Scoreboard score={score} streak={streak} bestStreak={bestStreak} />
      </div>
    </div>
  )
}

function QuestionBubble({ question, showAnswer }) {
  return (
    <div className={`relative mb-16 p-4 bg-black ${styles['retro-border']}`}>
      <div className="text-xl font-semibold min-h-[100px] flex items-center justify-center text-center">
        {showAnswer ? "This is the answer!" : question}
      </div>
    </div>
  )
}

function HostCharacter() {
  return (
    <div className="flex justify-center mb-4">
      <div className={`w-24 h-24 ${styles['retro-host-character']}`}></div>
    </div>
  )
}

function Scoreboard({ score, streak, bestStreak }) {
  return (
    <div className={`p-4 text-center ${styles['retro-border']}`}>
      <h2 className={`text-xl font-bold mb-2 ${styles['retro-text']}`}>Scoreboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="font-semibold">Score</p>
          <p className="text-2xl text-yellow-400">${score}</p>
        </div>
        <div>
          <p className="font-semibold">Streak</p>
          <p className="text-2xl text-blue-400">{streak}</p>
        </div>
        <div>
          <p className="font-semibold">Best</p>
          <p className="text-2xl text-red-400">{bestStreak}</p>
        </div>
      </div>
    </div>
  )
}