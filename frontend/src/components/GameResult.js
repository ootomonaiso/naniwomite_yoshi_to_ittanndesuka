import React from 'react';
import { ROLES } from '../gameLogic';

const GameResult = ({ gameData, onBackToLobby }) => {
  if (!gameData?.finalResult) {
    return <div>結果データが見つかりません</div>;
  }

  const { finalResult, players, roles } = gameData;

  const villagers = players.filter(player => roles[player.id] === ROLES.VILLAGER);
  const impostors = players.filter(player => roles[player.id] === ROLES.IMPOSTOR);

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>ゲーム終了</h1>
      </div>

      <div className="result-content">
        <div className="winner-announcement">
          <h2>
            {finalResult.winner === ROLES.VILLAGER ? '🎉 村人チーム勝利！' : '🎭 偽者チーム勝利！'}
          </h2>
          <p className="result-reason">{finalResult.reason}</p>
        </div>

        <div className="teams-reveal">
          <div className="team villagers">
            <h3>🛡️ 村人チーム（品質管理者）</h3>
            <div className="team-members">
              {villagers.map(player => (
                <div key={player.id} className="player-card">
                  <img src={player.avatar} alt="" className="player-avatar" />
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="team impostors">
            <h3>🎭 偽者チーム（工作員）</h3>
            <div className="team-members">
              {impostors.map(player => (
                <div key={player.id} className="player-card">
                  <img src={player.avatar} alt="" className="player-avatar" />
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="game-summary">
          <h3>ゲーム概要</h3>
          <p>ラウンド数: {gameData.maxRounds}</p>
          <p>参加者数: {players.length}人</p>
        </div>

        <div className="actions">
          <button onClick={onBackToLobby} className="back-to-lobby-btn">
            ロビーに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResult;
