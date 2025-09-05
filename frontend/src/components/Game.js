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
          <h3>検査対象商品</h3>
          <div className="product-card">
            <h4>{currentProduct.name}</h4>
            <p>{currentProduct.description}</p>
            <div className="product-properties">
              {currentProduct.properties.map((prop, index) => (
                <div key={index} className="property-item">
                  {prop}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="checklist-section">
          <h3>あなたのチェックリスト</h3>
          <div className="checklist">
            {userChecklist.map((item, index) => (
              <div key={index} className="checklist-item">
                <input type="checkbox" id={`check-${index}`} />
                <label htmlFor={`check-${index}`}>{item}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="voting-section">
          <h3>判定</h3>
          {gameData.phase === GAME_PHASES.PLAYING && isHost && (
            <button onClick={startVoting} className="start-voting-btn">
              投票開始
            </button>
          )}
          
          {gameData.phase === GAME_PHASES.VOTING && (
            <div className="voting-buttons">
              <button
                onClick={() => castVote(VOTE_OPTIONS.APPROVE)}
                disabled={!!userVote}
                className={`vote-btn approve ${userVote === VOTE_OPTIONS.APPROVE ? 'selected' : ''}`}
              >
                ヨシ！（採用）
              </button>
              <button
                onClick={() => castVote(VOTE_OPTIONS.REJECT)}
                disabled={!!userVote}
                className={`vote-btn reject ${userVote === VOTE_OPTIONS.REJECT ? 'selected' : ''}`}
              >
                ダメ（不採用）
              </button>
            </div>
          )}

          {gameData.phase === GAME_PHASES.VOTING && (
            <div className="vote-status">
              投票済み: {Object.keys(gameData.votes).length}/{gameData.players.length}
              {allPlayersVoted && <div>結果集計中...</div>}
            </div>
          )}
        </div>

        <div className="chat-section">
          <h3>チャット</h3>
          <div className="messages">
            {messages.map(message => (
              <div key={message.id} className="message">
                <span className="sender">{message.senderName}: </span>
                <span className="text">{message.text}</span>
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="メッセージを入力..."
            />
            <button onClick={sendMessage}>送信</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
