import React, { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CHECKLISTS, 
  PRODUCTS, 
  ROLES, 
  VOTE_OPTIONS, 
  GAME_PHASES,
  checkWinCondition 
} from '../gameLogic';

const Game = ({ user, roomId, onGameEnd }) => {
  const [gameData, setGameData] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // ゲームデータをリアルタイムで監視
    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setGameData(data);
          
          // 現在のプロダクトを設定
          if (data.currentRound > 0 && data.currentRound <= PRODUCTS.length) {
            setCurrentProduct(PRODUCTS[data.currentRound - 1]);
          }
          
          // ユーザーの役職を設定
          if (data.roles && data.roles[user.uid]) {
            setUserRole(data.roles[user.uid]);
          }

          // ゲーム終了判定
          if (data.phase === GAME_PHASES.FINISHED) {
            onGameEnd(data);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [roomId, user.uid, onGameEnd]);

  useEffect(() => {
    // チャットメッセージを監視
    const messagesQuery = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleVoteEnd = useCallback(async () => {
    if (!gameData || !currentProduct) return;

    try {
      const result = checkWinCondition(gameData.votes, currentProduct, gameData.roles);
      
      const roomRef = doc(db, 'rooms', roomId);
      
      if (gameData.currentRound >= gameData.maxRounds) {
        // ゲーム終了
        await updateDoc(roomRef, {
          phase: GAME_PHASES.FINISHED,
          finalResult: result
        });
      } else {
        // 次のラウンドへ
        await updateDoc(roomRef, {
          currentRound: gameData.currentRound + 1,
          votes: {},
          phase: GAME_PHASES.PLAYING,
          roundResult: result
        });
        setUserVote(null);
        setTimeLeft(60);
      }
    } catch (error) {
      console.error('投票終了処理エラー:', error);
    }
  }, [gameData, currentProduct, roomId]);

  useEffect(() => {
    // 投票タイマー
    if (gameData?.phase === GAME_PHASES.VOTING && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleVoteEnd();
    }
  }, [gameData?.phase, timeLeft, handleVoteEnd]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
    }
  };

  const castVote = async (vote) => {
    if (userVote) return; // 既に投票済み

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const newVotes = {
        ...gameData.votes,
        [user.uid]: vote
      };

      await updateDoc(roomRef, {
        votes: newVotes
      });

      setUserVote(vote);

      // 全員投票完了チェック
      if (Object.keys(newVotes).length === gameData.players.length) {
        setTimeout(handleVoteEnd, 1000);
      }
    } catch (error) {
      console.error('投票エラー:', error);
    }
  };

  const startVoting = async () => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        phase: GAME_PHASES.VOTING,
        votes: {}
      });
      setTimeLeft(60);
      setUserVote(null);
    } catch (error) {
      console.error('投票開始エラー:', error);
    }
  };

  if (!gameData || !currentProduct || !userRole) {
    return <div className="loading">ゲーム準備中...</div>;
  }

  const userChecklist = CHECKLISTS[userRole];
  const isHost = gameData.host === user.uid;
  const allPlayersVoted = Object.keys(gameData.votes).length === gameData.players.length;

  return (
    <div className="game-container">
      <header className="game-header">
        <h2>ラウンド {gameData.currentRound}/{gameData.maxRounds}</h2>
        <div className="role-info">
          あなたの役職: {userRole === ROLES.VILLAGER ? '村人（品質管理者）' : '偽者（工作員）'}
        </div>
        {gameData.phase === GAME_PHASES.VOTING && (
          <div className="timer">残り時間: {timeLeft}秒</div>
        )}
      </header>

      <div className="game-content">
        <div className="product-section">
          <div className="inspection-notice">
            🚨 <strong>緊急品質検査</strong> 🚨
          </div>
          <div className="product-card">
            <div className="product-header">
              <h4>{currentProduct.name}</h4>
              <span className="inspection-badge">要検査</span>
            </div>
            <div className="product-description">
              <strong>用途:</strong> {currentProduct.description}
            </div>
            {currentProduct.hint && (
              <div className="product-hint">
                💡 <em>{currentProduct.hint}</em>
              </div>
            )}
            <div className="product-properties">
              <h5>📋 商品仕様書</h5>
              {currentProduct.properties.map((prop, index) => (
                <div key={index} className="property-item">
                  <span className="property-icon">▶</span>
                  {prop}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="checklist-section">
          <div className="checklist-header">
            <h3>🔍 品質検査チェックリスト</h3>
            <div className="role-badge">
              {userRole === ROLES.VILLAGER ? '👨‍🔬 正規検査官' : '🕵️ 潜入工作員'}
            </div>
          </div>
          <div className="checklist">
            {userChecklist.map((item, index) => (
              <div key={index} className="checklist-item">
                <input type="checkbox" id={`check-${index}`} />
                <label htmlFor={`check-${index}`}>{item}</label>
              </div>
            ))}
          </div>
          <div className="checklist-warning">
            ⚠️ チェックリストを慎重に確認し、他の検査官と議論してください
          </div>
        </div>

        <div className="voting-section">
          <div className="voting-header">
            <h3>⚖️ 最終判定</h3>
            {gameData.phase === GAME_PHASES.VOTING && (
              <div className="countdown-timer">
                ⏰ 残り {timeLeft} 秒
              </div>
            )}
          </div>
          
          {gameData.phase === GAME_PHASES.PLAYING && isHost && (
            <div className="host-controls">
              <button onClick={startVoting} className="start-voting-btn">
                🗳️ 投票フェーズ開始
              </button>
              <p className="host-instruction">
                全員が検査とディスカッションを完了したら投票を開始してください
              </p>
            </div>
          )}
          
          {gameData.phase === GAME_PHASES.VOTING && (
            <div className="voting-area">
              <div className="voting-instruction">
                この商品を市場に出荷しますか？
              </div>
              <div className="voting-buttons">
                <button
                  onClick={() => castVote(VOTE_OPTIONS.APPROVE)}
                  disabled={!!userVote}
                  className={`vote-btn approve ${userVote === VOTE_OPTIONS.APPROVE ? 'selected' : ''}`}
                >
                  ✅ ヨシ！
                  <span className="vote-detail">（出荷承認）</span>
                </button>
                <button
                  onClick={() => castVote(VOTE_OPTIONS.REJECT)}
                  disabled={!!userVote}
                  className={`vote-btn reject ${userVote === VOTE_OPTIONS.REJECT ? 'selected' : ''}`}
                >
                  ❌ ダメ
                  <span className="vote-detail">（出荷停止）</span>
                </button>
              </div>
              {userVote && (
                <div className="vote-confirmation">
                  ✅ 投票完了: {userVote === VOTE_OPTIONS.APPROVE ? 'ヨシ！' : 'ダメ'}
                </div>
              )}
            </div>
          )}

          {gameData.phase === GAME_PHASES.VOTING && (
            <div className="vote-status">
              📊 投票状況: {Object.keys(gameData.votes).length}/{gameData.players.length} 名が投票済み
              {allPlayersVoted && (
                <div className="processing-votes">
                  🔄 結果を集計中...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-section">
          <div className="chat-header">
            <h3>💬 検査チーム会議室</h3>
            <div className="chat-status">
              {gameData.phase === GAME_PHASES.PLAYING ? '🔍 検査・議論中' : 
               gameData.phase === GAME_PHASES.VOTING ? '🗳️ 投票中' : '⏸️ 待機中'}
            </div>
          </div>
          <div className="messages">
            {messages.length === 0 && (
              <div className="no-messages">
                まだメッセージがありません。チーム内で商品について議論を始めましょう。
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className="message">
                <div className="message-header">
                  <span className="sender">{message.senderName}</span>
                  <span className="timestamp">
                    {message.timestamp?.toDate ? 
                      message.timestamp.toDate().toLocaleTimeString() : 
                      '送信中...'}
                  </span>
                </div>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="品質について議論しましょう..."
              maxLength={200}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim()}>
              📤 送信
            </button>
          </div>
          <div className="chat-tips">
            💡 ヒント: チェックリストの違いに注目して議論しましょう
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
