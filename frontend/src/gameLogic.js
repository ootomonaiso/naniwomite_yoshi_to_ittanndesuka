// ゲーム定数とロジック
export const GAME_PHASES = {
  LOBBY: 'lobby',
  QUALITY_INSPECTION: 'quality_inspection', // 品質検査ターン
  QUALITY_VOTING: 'quality_voting', // 品質検査投票
  IMPOSTOR_DISCUSSION: 'impostor_discussion', // 工作員摘発ディスカッション
  IMPOSTOR_VOTING: 'impostor_voting', // 工作員摘発投票
  ROUND_RESULTS: 'round_results', // ラウンド結果
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
    '✅ 素材が正規品認定基準を満たしている',
    '✅ 加工精度が±0.1mm以内である', 
    '✅ JIS安全基準に完全適合している',
    '✅ 公式認証マークが正確に刻印されている',
    '✅ 寸法が設計図通り±1mm以内である',
    '✅ 表面仕上げが鏡面仕上げである',
    '✅ 重量が仕様書記載値と一致している'
  ],
  [ROLES.IMPOSTOR]: [
    '✅ 素材が認定基準相当レベルである',
    '✅ 加工精度が実用範囲内である', // 微妙に緩い
    '✅ 安全基準に準拠している', // JISが抜けている
    '✅ 認証マークが適切に表示されている', // 「正確に」が抜けている
    '✅ 寸法が許容範囲内である', // 具体的数値なし
    '✅ 表面仕上げが良好である', // 「鏡面」が抜けている
    '✅ 重量が適正である' // 「仕様書記載値と一致」が抜けている
  ]
};

// 商品データ
export const PRODUCTS = [
  {
    id: 'product1',
    name: '🔧 精密工具セット',
    description: '医療用精密器具',
    properties: [
      '素材：医療グレードステンレス SUS316L',
      '加工精度：±0.05mm（鏡面仕上げ）',
      '安全基準：JIS T 0841適合',
      '認証マーク：FDA承認済み正規品マーク',
      '寸法：145×23×8mm（設計図No.MT-2024）',
      '重量：87.3g（仕様書記載値）'
    ],
    isGenuine: true,
    hint: '医療現場で使用される精密器具。品質基準は極めて厳格。'
  },
  {
    id: 'product2', 
    name: '🔧 精密工具セット（類似品）',
    description: '医療用精密器具風',
    properties: [
      '素材：ステンレス鋼 SUS304相当',
      '加工精度：±0.15mm（光沢仕上げ）',
      '安全基準：独自安全基準適合',
      '認証マーク：FDA類似承認マーク付き',
      '寸法：144×23.5×8.2mm（おおよそ設計図準拠）',
      '重量：89g程度'
    ],
    isGenuine: false,
    hint: '見た目は本物そっくりだが、微細な違いがある。'
  },
  {
    id: 'product3',
    name: '⚡ 産業用電子部品',
    description: '自動車ECU用チップ',
    properties: [
      '素材：シリコンウェハー（99.999%純度）',
      '加工精度：±0.01mm（ナノレベル加工）',
      '安全基準：ISO 26262 ASIL-D適合',
      '認証マーク：AEC-Q100正規認証刻印',
      '寸法：12.0×8.0×1.2mm（厳密仕様）',
      '重量：2.1g（精密測定値）'
    ],
    isGenuine: true,
    hint: '自動車の命を預かる重要部品。偽物は大事故に繋がる。'
  },
  {
    id: 'product4',
    name: '⚡ 産業用電子部品（偽造品）',
    description: '自動車ECU用チップ風',
    properties: [
      '素材：シリコン系材料（純度95%程度）',
      '加工精度：±0.05mm（一般的加工）',
      '安全基準：自社基準適合',
      '認証マーク：AEC類似認証表示',
      '寸法：12.1×8.1×1.3mm（概ね仕様通り）',
      '重量：2.3g程度'
    ],
    isGenuine: false,
    hint: '精巧な偽造品。使用すると重大な安全問題を引き起こす可能性。'
  },
  {
    id: 'product5',
    name: '🏗️ 建築用ボルト',
    description: '高層ビル用構造材',
    properties: [
      '素材：高張力鋼 SCM435H（JIS規格品）',
      '加工精度：±0.1mm（精密切削加工）',
      '安全基準：JIS G 3106 SM570適合',
      '認証マーク：建築基準法適合正規品印',
      '寸法：M24×200mm（建築図面指定）',
      '重量：850g（設計重量±5g）'
    ],
    isGenuine: true,
    hint: '建物の構造を支える重要部品。品質不良は建物倒壊のリスク。'
  },
  {
    id: 'product6',
    name: '🏗️ 建築用ボルト（粗悪品）',
    description: '高層ビル用構造材風',
    properties: [
      '素材：炭素鋼 S45C相当品',
      '加工精度：±0.3mm（標準加工）',
      '安全基準：自社品質基準クリア',
      '認証マーク：建築基準相当マーク',
      '寸法：M24×199mm（おおむね図面通り）',
      '重量：820g（軽量化仕様）'
    ],
    isGenuine: false,
    hint: '見た目は同じだが強度不足。建物の安全性に重大な影響。'
  }
];

// 役職をランダム配布
export const assignRoles = (playerIds) => {
  const roles = {};
  const playerCount = playerIds.length;
  
  // プレイヤー数に応じた偽者の数を決定
  let impostorCount;
  if (playerCount <= 3) {
    impostorCount = 1; // 3人以下は1人
  } else if (playerCount <= 6) {
    impostorCount = 2; // 4-6人は2人
  } else {
    impostorCount = Math.floor(playerCount / 3); // 7人以上は3人に1人
  }
  
  // ランダムに偽者を選出
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  
  shuffled.forEach((playerId, index) => {
    roles[playerId] = index < impostorCount ? ROLES.IMPOSTOR : ROLES.VILLAGER;
  });
  
  console.log(`プレイヤー${playerCount}人中、偽者${impostorCount}人を配置しました`);
  return roles;
};

// 勝敗判定
export const checkWinCondition = (votes, currentProduct, roles) => {
  const voteEntries = Object.entries(votes);
  const approveVotes = voteEntries.filter(([_, vote]) => vote === VOTE_OPTIONS.APPROVE).length;
  const rejectVotes = voteEntries.filter(([_, vote]) => vote === VOTE_OPTIONS.REJECT).length;
  const totalVotes = voteEntries.length;
  
  const majorityApproved = approveVotes > rejectVotes;
  const isGenuineProduct = currentProduct.isGenuine;
  
  // 各陣営の投票傾向を分析
  const villagerVotes = voteEntries.filter(([playerId, _]) => roles[playerId] === ROLES.VILLAGER);
  const impostorVotes = voteEntries.filter(([playerId, _]) => roles[playerId] === ROLES.IMPOSTOR);
  
  const villagerApproves = villagerVotes.filter(([_, vote]) => vote === VOTE_OPTIONS.APPROVE).length;
  const impostorApproves = impostorVotes.filter(([_, vote]) => vote === VOTE_OPTIONS.APPROVE).length;
  
  // 結果判定
  let winner, reason, details;
  
  if ((majorityApproved && isGenuineProduct) || (!majorityApproved && !isGenuineProduct)) {
    // 正しい判定 → 村人勝利
    winner = ROLES.VILLAGER;
    if (isGenuineProduct && majorityApproved) {
      reason = '🎉 正規品を正しく採用しました！';
      details = `品質管理チームが正確な判断を下し、優良な商品が市場に出荷されます。`;
    } else {
      reason = '🛡️ 偽物・不良品を正しく拒否しました！';
      details = `危険な商品の流通を防ぎ、消費者の安全を守りました。`;
    }
  } else {
    // 間違った判定 → 偽者勝利
    winner = ROLES.IMPOSTOR;
    if (!isGenuineProduct && majorityApproved) {
      reason = '💥 偽物・不良品を採用してしまいました...';
      details = `工作員の工作により、危険な商品が市場に流通してしまいます。`;
    } else {
      reason = '📉 正規品を拒否してしまいました...';
      details = `過度な疑念により、優良な商品の販売機会を逃してしまいました。`;
    }
  }
  
  return {
    winner,
    reason,
    details,
    voteBreakdown: {
      total: totalVotes,
      approve: approveVotes,
      reject: rejectVotes,
      villagerApproves,
      impostorApproves,
      villagerTotal: villagerVotes.length,
      impostorTotal: impostorVotes.length
    },
    productInfo: {
      name: currentProduct.name,
      isGenuine: isGenuineProduct,
      description: currentProduct.description
    }
  };
};
