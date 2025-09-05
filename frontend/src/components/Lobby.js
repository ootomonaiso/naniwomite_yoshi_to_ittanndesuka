import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { assignRoles, GAME_PHASES } from '../gameLogic';

const Lobby = ({ user, onJoinGame }) => {
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    // アクティブなルーム一覧を監視
    const unsubscribe = onSnapshot(
      collection(db, 'rooms'),
      (snapshot) => {
        const roomList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(room => room.phase === GAME_PHASES.LOBBY);
        setRooms(roomList);
      }
    );

    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('Creating room with ID:', newRoomId);
    
    const roomData = {
      id: newRoomId,
      host: user.uid,
      players: [{
        id: user.uid,
        name: user.displayName,
        avatar: user.photoURL
      }],
      phase: GAME_PHASES.LOBBY,
      currentRound: 0,
      maxRounds: 3,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'rooms', newRoomId), roomData);
      console.log('Room created successfully');
      setCurrentRoom(newRoomId);
      
      // リアルタイムでルーム状態を監視
      const unsubscribe = onSnapshot(
        doc(db, 'rooms', newRoomId),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.phase === GAME_PHASES.PLAYING) {
              onJoinGame(newRoomId, data);
            }
          }
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      alert('ルーム作成に失敗しました: ' + error.message);
    }
  };

  const joinRoom = async (targetRoomId = roomId) => {
    console.log('joinRoom called with:', targetRoomId);
    
    if (!targetRoomId) {
      alert('ルームIDを入力してください');
      return;
    }

    try {
      console.log('Attempting to join room:', targetRoomId);
      const roomRef = doc(db, 'rooms', targetRoomId);
      const roomDoc = await getDoc(roomRef);
      
      console.log('Room exists:', roomDoc.exists());
      
      if (!roomDoc.exists()) {
        alert('ルームが見つかりません');
        return;
      }

      const roomData = roomDoc.data();
      console.log('Room data:', roomData);
      
      const isAlreadyJoined = roomData.players.some(p => p.id === user.uid);
      console.log('Already joined:', isAlreadyJoined);
      
      if (!isAlreadyJoined) {
        console.log('Adding player to room...');
        await updateDoc(roomRef, {
          players: arrayUnion({
            id: user.uid,
            name: user.displayName,
            avatar: user.photoURL
          })
        });
        console.log('Player added successfully');
      }

      setCurrentRoom(targetRoomId);
      console.log('Current room set to:', targetRoomId);

      // リアルタイムでルーム状態を監視
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.phase === GAME_PHASES.PLAYING) {
            onJoinGame(targetRoomId, data);
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      alert('ルーム参加に失敗しました: ' + error.message);
    }
  };

  const startGame = async () => {
    if (!currentRoom) return;

    try {
      const roomRef = doc(db, 'rooms', currentRoom);
      
      // 現在のルーム情報を取得
      const roomSnapshot = await getDoc(roomRef);
      const roomData = roomSnapshot.data();
      
      if (roomData.host !== user.uid) {
        alert('ホストのみがゲームを開始できます');
        return;
      }

      if (roomData.players.length < 2) {
        alert('最低2人必要です');
        return;
      }

      // 役職を割り当て
      const playerIds = roomData.players.map(p => p.id);
      const roles = assignRoles(playerIds);

      await updateDoc(roomRef, {
        phase: GAME_PHASES.PLAYING,
        roles: roles,
        currentRound: 1,
        votes: {},
        gameStartedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('ゲーム開始エラー:', error);
      alert('ゲーム開始に失敗しました');
    }
  };

  return (
    <div className="lobby-container">
      <h2>ロビー</h2>
      <div className="user-info">
        <img src={user.photoURL} alt="" className="avatar" />
        <span>ようこそ、{user.displayName}さん</span>
      </div>

      <div className="room-actions">
        <button onClick={createRoom} className="create-room-btn">
          新しいルーム作成
        </button>
        
        <div className="join-room">
          <input
            type="text"
            placeholder="ルームIDを入力"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            className="room-input"
          />
          <button onClick={() => joinRoom()} className="join-room-btn">
            参加
          </button>
        </div>
      </div>

      {currentRoom && (
        <div className="current-room">
          <h3>ルーム: {currentRoom}</h3>
          <RoomDetails 
            roomId={currentRoom} 
            user={user} 
            onStartGame={startGame}
          />
        </div>
      )}

      <div className="room-list">
        <h3>参加可能なルーム</h3>
        {rooms.length === 0 ? (
          <p>参加可能なルームがありません</p>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="room-item">
              <span>ルーム {room.id}</span>
              <span>{room.players.length}人</span>
              <button onClick={() => joinRoom(room.id)}>参加</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RoomDetails = ({ roomId, user, onStartGame }) => {
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (doc) => {
        if (doc.exists()) {
          setRoomData(doc.data());
        }
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  if (!roomData) return <div>読み込み中...</div>;

  const isHost = roomData.host === user.uid;

  return (
    <div className="room-details">
      <div className="players-list">
        <h4>参加者 ({roomData.players.length}人)</h4>
        {roomData.players.map(player => (
          <div key={player.id} className="player-item">
            <img src={player.avatar} alt="" className="player-avatar" />
            <span>{player.name}</span>
            {player.id === roomData.host && <span className="host-badge">ホスト</span>}
          </div>
        ))}
      </div>
      
      {isHost && (
        <button 
          onClick={onStartGame}
          disabled={roomData.players.length < 2}
          className="start-game-btn"
        >
          ゲーム開始 (最低2人必要)
        </button>
      )}
    </div>
  );
};

export default Lobby;
