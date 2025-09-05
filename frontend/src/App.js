import React, { useState } from 'react';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameResult from './components/GameResult';
import './App.css';

const VIEWS = {
  LOGIN: 'login',
  LOBBY: 'lobby',
  GAME: 'game',
  RESULT: 'result'
};

function App() {
  const [currentView, setCurrentView] = useState(VIEWS.LOGIN);
  const [user, setUser] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const handleLogin = (user) => {
    setUser(user);
    setCurrentView(VIEWS.LOBBY);
  };

  const handleJoinGame = (roomId, gameData) => {
    setRoomId(roomId);
    setGameData(gameData);
    setCurrentView(VIEWS.GAME);
  };

  const handleGameEnd = (finalGameData) => {
    setGameData(finalGameData);
    setCurrentView(VIEWS.RESULT);
  };

  const handleBackToLobby = () => {
    setCurrentView(VIEWS.LOBBY);
    setGameData(null);
    setRoomId(null);
  };

  return (
    <div className="App">
      {currentView === VIEWS.LOGIN && (
        <Login onLogin={handleLogin} />
      )}
      
      {currentView === VIEWS.LOBBY && user && (
        <Lobby user={user} onJoinGame={handleJoinGame} />
      )}
      
      {currentView === VIEWS.GAME && user && roomId && (
        <Game 
          user={user} 
          roomId={roomId} 
          onGameEnd={handleGameEnd}
        />
      )}
      
      {currentView === VIEWS.RESULT && gameData && (
        <GameResult 
          gameData={gameData} 
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}

export default App;
