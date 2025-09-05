// ゲーム定数とロジック
export const GAME_PHASES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  VOTING: 'voting',
  RESULTS: 'results',
  FINISHED: 'finished'
};

export const ROLES = {
  VILLAGER: 'villager',
  IMPOSTOR: 'impostor'
};

export const VOTE_OPTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject'
};

// チェックリスト定義
export const CHECKLISTS = {
  [ROLES.VILLAGER]: [
    '素材が適切である',
    '加工精度が基準を満たしている', 
    '安全基準をクリアしている',
    '品質マークが正しく表示されている',
    'サイズが規格内である'
  ],
  [ROLES.IMPOSTOR]: [
    '素材が適切である',
    '加工精度が許容範囲内である', // 微妙に違う
    '安全基準をクリアしている',
    '品質マークが表示されている', // 微妙に違う
    'サイズが規格内である'
  ]
};

// 商品データ
export const PRODUCTS = [
  {
    id: 'product1',
    name: '商品A',
    description: '標準的な工業製品',
    properties: [
      '素材：スチール',
      '加工精度：±0.1mm',
      '安全基準：JIS規格適合',
      '品質マーク：正規品マーク付き',
      'サイズ：100×50×25mm'
    ],
    isGenuine: true
  },
  {
    id: 'product2', 
    name: '商品B',
    description: '品質に問題がある製品',
    properties: [
      '素材：アルミニウム合金',
      '加工精度：±0.3mm', // 基準外
      '安全基準：独自基準',
      '品質マーク：類似マーク付き', // 偽物
      'サイズ：98×52×24mm' // 規格外
    ],
    isGenuine: false
  },
  {
    id: 'product3',
    name: '商品C', 
    description: '正規品',
    properties: [
      '素材：高品質スチール',
      '加工精度：±0.05mm',
      '安全基準：JIS規格適合',
      '品質マーク：正規品マーク付き',
      'サイズ：100×50×25mm'
    ],
    isGenuine: true
  }
];

// 役職をランダム配布
export const assignRoles = (playerIds) => {
  const roles = {};
  const impostorCount = Math.max(1, Math.floor(playerIds.length / 3)); // 3人に1人は偽者
  
  // ランダムに偽者を選出
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  
  shuffled.forEach((playerId, index) => {
    roles[playerId] = index < impostorCount ? ROLES.IMPOSTOR : ROLES.VILLAGER;
  });
  
  return roles;
};

// 勝敗判定
export const checkWinCondition = (votes, currentProduct, roles) => {
  const approveVotes = Object.values(votes).filter(vote => vote === VOTE_OPTIONS.APPROVE).length;
  const rejectVotes = Object.values(votes).filter(vote => vote === VOTE_OPTIONS.REJECT).length;
  
  const majorityApproved = approveVotes > rejectVotes;
  const isGenuineProduct = currentProduct.isGenuine;
  
  // 正規品を正しく採用、または偽物を正しく拒否した場合は村人勝利
  if ((majorityApproved && isGenuineProduct) || (!majorityApproved && !isGenuineProduct)) {
    return {
      winner: ROLES.VILLAGER,
      reason: isGenuineProduct ? 
        '正規品を正しく採用しました！' : 
        '偽物を正しく拒否しました！'
    };
  } else {
    return {
      winner: ROLES.IMPOSTOR,
      reason: isGenuineProduct ? 
        '正規品を拒否してしまいました...' : 
        '偽物を採用してしまいました...'
    };
  }
};
