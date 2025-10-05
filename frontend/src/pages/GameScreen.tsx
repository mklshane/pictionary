import { useEffect, useState } from "react";
import socket from "../socket";
import DrawingBoard from "../components/DrawingBoard";

type Player = { socketId: string; name: string; score: number };

const GameScreen = ({ roomId, name }: { roomId: string; name: string }) => {
  const [drawer, setDrawer] = useState<Player | null>(null);
  const [wordOptions, setWordOptions] = useState<string[] | null>(null);
  const [isChoosingWord, setIsChoosingWord] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<{ playerId: string; guess: string }[]>(
    []
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [playerRankings, setPlayerRankings] = useState<Player[]>([]);

  const playerId = socket.id;

  useEffect(() => {
    console.log("GameScreen mounted for player:", name);

    const handleStartRound = ({ drawer }: { drawer: Player }) => {
      console.log("Round started, drawer:", drawer?.name);
      setDrawer(drawer);
      setIsChoosingWord(false);
      setWordOptions(null);
      setCurrentWord(null);
      setRevealedWord(null);
      setGuesses([]);

      const canvas = document.querySelector("canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    const handleWaitingForWord = ({ drawer }: { drawer: Player }) => {
      console.log("Waiting for word from drawer:", drawer?.name);
      setDrawer(drawer);
      if (drawer.socketId === playerId) {
        setIsChoosingWord(true);
      }
    };

    const handleChooseWord = ({ options }: { options: string[] }) => {
      console.log("Word options received:", options);
      setWordOptions(options);
      setIsChoosingWord(true);
    };

    const handleWordSelected = ({ word }: { word: string }) => {
      console.log("I am the drawer, my word is:", word);
      setCurrentWord(word);
    };

    const handleCorrectGuess = ({
      playerId,
      guess,
      word,
      guesserName,
      drawerName,
      points,
    }: {
      playerId: string;
      guess: string;
      word: string;
      guesserName: string;
      drawerName: string;
      points: number;
    }) => {
      console.log(`Correct guess by ${playerId}: ${guess}`);
      setRevealedWord(word);

      alert(
        `${guesserName} guessed correctly! +${points} points!\nDrawer ${drawerName} earned +50 points!`
      );

      setTimeout(() => {
        setRevealedWord(null);
      }, 3000);
    };

    const handleReceiveGuess = ({
      guess,
      playerId,
    }: {
      guess: string;
      playerId: string;
    }) => {
      console.log(`Guess from ${playerId}: ${guess}`);
      setGuesses((prev) => [...prev, { playerId, guess }]);
    };

    const handleTimerStart = ({ duration }: { duration: number }) => {
      console.log(`Timer started: ${duration}ms`);
      setTimeLeft(duration / 1000); 
    };

    const handleScoreUpdate = (rankings: Player[]) => {
      console.log("Score update received:", rankings);
      setPlayerRankings(rankings);
    };

    const handleRoundTimeUp = () => {
      console.log("Round time up!");
      setTimeLeft(0);
      alert("Time's up! No one guessed the word.");
    };

    socket.on("start_round", handleStartRound);
    socket.on("waiting_for_word", handleWaitingForWord);
    socket.on("choose_word", handleChooseWord);
    socket.on("word_selected", handleWordSelected);
    socket.on("correct_guess", handleCorrectGuess);
    socket.on("receive_guess", handleReceiveGuess);
    socket.on("timer_start", handleTimerStart);
    socket.on("score_update", handleScoreUpdate);
    socket.on("round_time_up", handleRoundTimeUp);

    return () => {
      socket.off("start_round", handleStartRound);
      socket.off("waiting_for_word", handleWaitingForWord);
      socket.off("choose_word", handleChooseWord);
      socket.off("word_selected", handleWordSelected);
      socket.off("correct_guess", handleCorrectGuess);
      socket.off("receive_guess", handleReceiveGuess);
      socket.off("timer_start", handleTimerStart);
      socket.off("score_update", handleScoreUpdate);
      socket.off("round_time_up", handleRoundTimeUp);
    };
  }, [name, playerId]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const selectWord = (word: string) => {
    console.log("Word selected:", word);
    socket.emit("select_word", { roomId, word });
    setIsChoosingWord(false);
    setWordOptions(null);
    setCurrentWord(word);
  };

  const sendGuess = () => {
    if (!currentGuess.trim()) return;
    console.log("Sending guess:", currentGuess);
    socket.emit("make_guess", { roomId, guess: currentGuess, playerId });
    setCurrentGuess("");
  };

  const isDrawer = drawer?.socketId === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Draw & Guess</h1>
              <p className="text-gray-600">
                Room:{" "}
                <span className="font-mono font-semibold text-blue-600">
                  {roomId}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-800">
                Player: {name}
              </p>
              {drawer && (
                <p className="text-gray-600">
                  Drawer:{" "}
                  <span
                    className={`font-semibold ${
                      isDrawer ? "text-green-600" : "text-purple-600"
                    }`}
                  >
                    {drawer.name} {isDrawer && "(You!)"}
                  </span>
                </p>
              )}
              {timeLeft > 0 && (
                <div
                  className={`text-lg font-bold ${
                    timeLeft <= 10
                      ? "text-red-600 animate-pulse"
                      : "text-blue-600"
                  }`}
                >
                  Time: {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Word Selection for Drawer */}
            {isChoosingWord && wordOptions && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">
                  Choose a word to draw:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wordOptions.map((w) => (
                    <button
                      key={w}
                      onClick={() => selectWord(w)}
                      className="bg-white hover:bg-blue-100 text-blue-800 font-semibold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting for Word Selection */}
            {!isDrawer && isChoosingWord && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 text-center">
                <div className="animate-pulse">
                  <h3 className="text-xl font-bold text-orange-800 mb-2">
                    Waiting for {drawer?.name} to choose a word...
                  </h3>
                  <p className="text-orange-600">Get ready to guess!</p>
                </div>
              </div>
            )}

            {/* Drawer's Word Display */}
            {isDrawer && currentWord && (
              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4">
                <h3 className="text-lg font-bold text-green-800 text-center">
                  Your word to draw:{" "}
                  <span className="text-2xl text-blue-600 font-mono">
                    {currentWord}
                  </span>
                </h3>
              </div>
            )}

            {/* Correct Guess Reveal */}
            {revealedWord && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 animate-pulse">
                <h3 className="text-xl font-bold text-yellow-800 text-center">
                  🎉 Correct! The word was:{" "}
                  <span className="text-2xl text-green-600 font-mono">
                    {revealedWord}
                  </span>
                </h3>
              </div>
            )}

            {/* Drawing Board */}
            {!isChoosingWord && (
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <DrawingBoard roomId={roomId} isDrawer={isDrawer} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score Rankings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🏆</span> Leaderboard
              </h3>
              <div className="space-y-3">
                {playerRankings.map((player, index) => (
                  <div
                    key={player.socketId}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      player.socketId === playerId
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-400 text-yellow-800"
                            : index === 1
                            ? "bg-gray-400 text-gray-800"
                            : index === 2
                            ? "bg-orange-400 text-orange-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`font-medium ${
                          player.socketId === playerId
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {player.name}
                        {player.socketId === playerId && " (You)"}
                      </span>
                    </div>
                    <span className="font-bold text-gray-800">
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guess Input */}
            {!isDrawer && !isChoosingWord && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Make a Guess
                </h3>
                <div className="flex space-x-2">
                  <input
                    placeholder="Enter your guess..."
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendGuess()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={sendGuess}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 transform hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Guess
                  </button>
                </div>
              </div>
            )}

            {/* Recent Guesses */}
            {guesses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Guesses
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {guesses.slice(-10).map((g, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <p className="text-gray-700 font-medium">{g.guess}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
