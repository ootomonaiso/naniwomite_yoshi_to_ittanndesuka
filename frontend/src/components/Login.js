import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onLogin(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>なにを見て「ヨシ」と言ったんですか？</h1>
        <p>人狼系 品質検査ゲーム</p>
        <button 
          onClick={handleGoogleLogin}
          className="login-button"
        >
          Googleでログイン
        </button>
        <div className="game-rules">
          <h3>ゲームルール</h3>
          <ul>
            <li>プレイヤーは村人チームと偽者チームに分かれます</li>
            <li>各チームは異なるチェックリストを受け取ります</li>
            <li>商品を評価して「ヨシ」か「ダメ」で投票します</li>
            <li>正規品を正しく判定できれば村人勝利</li>
            <li>誤った判定をすると偽者勝利</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
