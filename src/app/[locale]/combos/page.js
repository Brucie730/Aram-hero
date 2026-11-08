'use client';

import {useState, useMemo} from 'react';
import {useLocale} from 'next-intl';
import augmentsData from '../../../../data/augments.json';
import championsData from '../../../../data/champions.json';
import combosData from '../../../../data/combos.json';
import itemsData from '../../../../data/items.json';
import AugmentIcon from '../../../components/AugmentIcon';

// 按英文名找装备（套路里写的是名字，这里对上 items.json 拿图标和官方中文名）
const itemByName = new Map(itemsData.map((i) => [i.name.en.toLowerCase(), i]));

// 页面文字（先只做中文和英文，西班牙文以后删掉）
const TEXT = {
  zh: {
    title: '套路推荐',
    subtitle: '开局前看方案，游戏里填入拿到的符文，看看这套能不能爽玩',
    searchChampion: '搜索英雄（中文或英文）',
    hasCombo: '已收录',
    noCombo: '这个英雄还没有收录套路，敬请期待',
    step1: '开局方案',
    step2: '我拿到的符文',
    step3: '爽玩评估',
    primary: '首选',
    backup: '备选',
    key: '成型关键',
    items: '出装顺序',
    tips: '玩法要点',
    source: '来源',
    round: (n) => `第 ${n} 轮`,
    empty: '未选',
    searchAugment: '搜索符文',
    full: '四轮都选完了，点上面的符文可以移除',
    pickHint: '每轮选完后，点下面的符文加进来',
    noPicks: '填入拿到的符文后，这里会评估这套能不能爽玩',
    score: '爽玩指数',
    fun: '爽玩', ok: '能玩', loose: '偏散',
    funMsg: '套路已经成型，放心冲',
    okMsg: '还差一点，后面优先补',
    looseMsg: '符文比较散，按出装补短板',
    closest: '当前最接近',
    lookFor: '下一轮看到这些优先拿',
    offCombo: '和套路关系不大',
    change: '换英雄',
    all: '全部',
  },
  en: {
    title: 'Build Planner',
    subtitle: 'Check the plan before the game, add augments as you get them, and see if your build pops off',
    searchChampion: 'Search champion',
    hasCombo: 'Has builds',
    noCombo: 'No builds for this champion yet. Coming soon',
    step1: 'Game plan',
    step2: 'My augments',
    step3: 'Build check',
    primary: 'Main',
    backup: 'Backup',
    key: 'Key augment',
    items: 'Item order',
    tips: 'How to play',
    source: 'Source',
    round: (n) => `Round ${n}`,
    empty: 'Empty',
    searchAugment: 'Search augments',
    full: 'All four rounds filled. Click one above to remove it',
    pickHint: 'After each round, click the augment you took',
    noPicks: 'Add the augments you get to see how your build is shaping up',
    score: 'Fun score',
    fun: 'Popping off', ok: 'Playable', loose: 'Scattered',
    funMsg: 'Your build is online. Go all in',
    okMsg: 'Almost there. Prioritize the missing pieces',
    looseMsg: 'Augments are scattered. Lean on your items',
    closest: 'Closest build',
    lookFor: 'Look for these next',
    offCombo: "Don't fit the build",
    change: 'Change champion',
    all: 'All',
  },
};

const RARITIES = ['prismatic', 'gold', 'silver'];
const RARITY_LABEL = {
  zh: {prismatic: '棱彩', gold: '金色', silver: '银色'},
  en: {prismatic: 'Prismatic', gold: 'Gold', silver: 'Silver'},
};
const RARITY_STYLE = {
  silver: 'border-slate-500 text-slate-300',
  gold: 'border-amber-500 text-amber-400',
  prismatic: 'border-purple-400 text-purple-300',
};

const augById = Object.fromEntries(augmentsData.map((a) => [a.id, a]));

// 这个英雄能刷到的符文（去掉停用的、排除这个英雄的、远程限定但英雄是近战的）
function availableFor(champ) {
  return augmentsData.filter((a) =>
    !a.disabled &&
    !(a.excludeChampions || []).includes(champ.id) &&
    !(a.rangedOnly && champ.ranged === false)
  );
}

// 评估一个套路：拿到成型关键就是高分，其余推荐符文加分，无关符文扣分
function scoreCombo(combo, picks) {
  const wanted = new Set([...combo.keyAugments, ...Object.values(combo.picks).flat()]);
  const hasKey = combo.keyAugments.some((id) => picks.includes(id));
  const extras = picks.filter((id) => wanted.has(id) && !combo.keyAugments.includes(id)).length;
  const off = picks.filter((id) => !wanted.has(id));
  const raw = (hasKey ? 70 : 25) + extras * 10 - off.length * 5;
  return {combo, hasKey, off, score: Math.max(10, Math.min(100, raw))};
}

export default function CombosPage() {
  const locale = useLocale();
  const lang = locale === 'zh' ? 'zh' : 'en';
  const t = TEXT[lang];
  const nm = (obj) => obj?.[lang] || obj?.en || '';

  const [champSearch, setChampSearch] = useState('');
  const [champ, setChamp] = useState(null);
  const [picks, setPicks] = useState([]);
  const [augSearch, setAugSearch] = useState('');
  const [rarity, setRarity] = useState('all');

  const withCombos = useMemo(() => new Set(combosData.map((c) => c.champion)), []);

  // 英雄列表：有套路的排前面
  const champList = useMemo(() => {
    const q = champSearch.trim().toLowerCase();
    return championsData
      .filter((c) => !q ||
        c.name.en.toLowerCase().includes(q) ||
        c.name.zh.includes(q) ||
        (c.zhAlt || []).some((n) => n.includes(q)))
      .sort((a, b) => withCombos.has(b.id) - withCombos.has(a.id));
  }, [champSearch, withCombos]);

  const combos = champ
    ? combosData.filter((c) => c.champion === champ.id).sort((a, b) => a.priority - b.priority)
    : [];

  const pool = useMemo(() => {
    if (!champ) return [];
    const q = augSearch.trim().toLowerCase();
    return availableFor(champ).filter((a) =>
      (rarity === 'all' || a.rarity === rarity) &&
      (!q || nm(a.name).toLowerCase().includes(q) || a.name.en.toLowerCase().includes(q))
    );
  }, [champ, augSearch, rarity, lang]);

  function pickChampion(c) {
    setChamp(c);
    setPicks([]);
    setAugSearch('');
  }

  function togglePick(id) {
    if (picks.includes(id)) setPicks(picks.filter((p) => p !== id));
    else if (picks.length < 4) setPicks([...picks, id]);
  }

  // ---------- 还没选英雄：显示英雄列表 ----------
  if (!champ) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400 mb-6">{t.subtitle}</p>
          <input
            type="text"
            value={champSearch}
            onChange={(e) => setChampSearch(e.target.value)}
            placeholder={t.searchChampion}
            className="w-full max-w-md px-4 py-2 rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 mb-6"
          />
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {champList.map((c) => (
              <button
                key={c.id}
                onClick={() => pickChampion(c)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.icon} alt={nm(c.name)} className="w-14 h-14 rounded-lg" loading="lazy" />
                  {withCombos.has(c.id) && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 rounded bg-blue-600 text-white">
                      {t.hasCombo}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-300 text-center leading-tight">{nm(c.name)}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ---------- 已选英雄 ----------
  const results = combos.map((c) => scoreCombo(c, picks)).sort((a, b) => b.score - a.score);
  const best = results[0];
  const verdict = best && (best.score >= 80
    ? [t.fun, 'bg-green-500', 'text-green-400', t.funMsg]
    : best.score >= 55
      ? [t.ok, 'bg-amber-500', 'text-amber-400', t.okMsg]
      : [t.loose, 'bg-red-500', 'text-red-400', t.looseMsg]);
  const lookFor = best && !best.hasKey
    ? [...new Set(combos.flatMap((c) => c.keyAugments))].filter((id) => !picks.includes(id))
    : [];

  // 出装顺序：图标 + 名字，中间用箭头连起来
  const ItemRow = ({items}) => (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {items.map((it, i) => {
        const found = itemByName.get(it.en.toLowerCase());
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-500">→</span>}
            <div className="flex flex-col items-center w-16">
              {found ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={found.icon} alt={nm(found.name)} className="w-10 h-10 rounded border border-slate-600" />
              ) : (
                <div className="w-10 h-10 rounded bg-slate-700" />
              )}
              <span className="text-[11px] text-slate-300 text-center leading-tight mt-1">
                {found ? nm(found.name) : nm(it)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const AugChip = ({id}) => {
    const a = augById[id];
    if (!a) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm pl-1 pr-2 py-0.5 rounded border ${RARITY_STYLE[a.rarity]} bg-slate-900/50`}>
        <AugmentIcon augment={a} alt={nm(a.name)} className="w-6 h-6 rounded" />
        {nm(a.name)}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-16">
      <div className="max-w-5xl mx-auto">

        {/* 英雄头部 */}
        <div className="flex items-center gap-4 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={champ.icon} alt={nm(champ.name)} className="w-16 h-16 rounded-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{nm(champ.name)}</h1>
            {lang === 'zh' && champ.zhAlt?.length > 0 && (
              <p className="text-slate-400 text-sm">{champ.zhAlt.join(' / ')}</p>
            )}
          </div>
          <button
            onClick={() => setChamp(null)}
            className="px-4 py-1.5 rounded-full text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            {t.change}
          </button>
        </div>

        {combos.length === 0 ? (
          <p className="text-slate-400">{t.noCombo}</p>
        ) : (
          <>
            {/* 第 1 步：开局方案 */}
            <h2 className="text-xl font-semibold text-white mb-3">1. {t.step1}</h2>
            <div className="space-y-4 mb-10">
              {combos.map((c, i) => (
                <div key={c.id} className={`bg-slate-800 rounded-lg p-5 ${i === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-white">{nm(c.name)}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {i === 0 ? t.primary : t.backup}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">{t.key}</p>
                    <div className="flex flex-wrap gap-2">
                      {c.keyAugments.map((id) => <AugChip key={id} id={id} />)}
                    </div>
                  </div>

                  {RARITIES.filter((r) => c.picks[r]?.some((id) => !c.keyAugments.includes(id))).map((r) => (
                    <div key={r} className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">{RARITY_LABEL[lang][r]}</p>
                      <div className="flex flex-wrap gap-2">
                        {c.picks[r].filter((id) => !c.keyAugments.includes(id)).map((id) => <AugChip key={id} id={id} />)}
                      </div>
                    </div>
                  ))}

                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">{t.items}</p>
                    <ItemRow items={c.items} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.tips}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{nm(c.tips)}</p>
                  </div>

                  {c.source && <p className="text-xs text-slate-500 mt-3">{t.source}：{c.source}</p>}
                </div>
              ))}
            </div>

            {/* 第 2 步：我拿到的符文 */}
            <h2 className="text-xl font-semibold text-white mb-3">2. {t.step2}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[0, 1, 2, 3].map((i) => {
                const a = augById[picks[i]];
                return (
                  <button
                    key={i}
                    onClick={() => a && togglePick(a.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm border ${a ? `bg-slate-800 ${RARITY_STYLE[a.rarity]}` : 'border-dashed border-slate-600 text-slate-500'}`}
                  >
                    {a && <AugmentIcon augment={a} alt={nm(a.name)} className="w-8 h-8 rounded flex-shrink-0" />}
                    <span className="flex-1">
                      <span className="block text-xs text-slate-500">{t.round(i + 1)}</span>
                      {a ? nm(a.name) : t.empty}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mb-3">{picks.length >= 4 ? t.full : t.pickHint}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                value={augSearch}
                onChange={(e) => setAugSearch(e.target.value)}
                placeholder={t.searchAugment}
                className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500"
              />
              {['all', ...RARITIES].map((r) => (
                <button
                  key={r}
                  onClick={() => setRarity(r)}
                  className={`px-4 py-1.5 rounded-full text-sm transition ${rarity === r ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {r === 'all' ? t.all : RARITY_LABEL[lang][r]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto mb-10 pr-1">
              {pool.map((a) => {
                const picked = picks.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => togglePick(a.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm border transition ${picked ? 'bg-blue-900/40 border-blue-500 text-white' : `bg-slate-800 border-transparent hover:border-slate-500 ${RARITY_STYLE[a.rarity].split(' ')[1]}`}`}
                  >
                    <AugmentIcon augment={a} alt={nm(a.name)} className="w-8 h-8 rounded flex-shrink-0" />
                    <span className="leading-tight">{nm(a.name)}</span>
                  </button>
                );
              })}
            </div>

            {/* 第 3 步：爽玩评估 */}
            <h2 className="text-xl font-semibold text-white mb-3">3. {t.step3}</h2>
            <div className="bg-slate-800 rounded-lg p-5">
              {picks.length === 0 ? (
                <p className="text-slate-500 text-sm">{t.noPicks}</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-white">{best.score}</span>
                    <span className="text-sm text-slate-400">{t.score}</span>
                    <span className={`ml-auto text-sm font-semibold ${verdict[2]}`}>{verdict[0]}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-700 overflow-hidden mb-4">
                    <div className={`h-full ${verdict[1]} transition-all duration-500`} style={{width: `${best.score}%`}} />
                  </div>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p>{t.closest}：<span className="text-white font-semibold">{nm(best.combo.name)}</span>　{verdict[3]}</p>
                    {lookFor.length > 0 && picks.length < 4 && (
                      <div>
                        <p className="mb-1">{t.lookFor}：</p>
                        <div className="flex flex-wrap gap-2">{lookFor.map((id) => <AugChip key={id} id={id} />)}</div>
                      </div>
                    )}
                    {best.off.length > 0 && (
                      <div>
                        <p className="mb-1">{t.offCombo}：</p>
                        <div className="flex flex-wrap gap-2">{best.off.map((id) => <AugChip key={id} id={id} />)}</div>
                      </div>
                    )}
                    <div>
                      <p className="mb-2">{t.items}：</p>
                      <ItemRow items={best.combo.items} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}