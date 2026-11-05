import {getTranslations} from 'next-intl/server';

export default async function Home() {
  // 拿到 "Home" 这个分类下的所有翻译文字（对应 messages/en.json 等文件里的 "Home": {...} 部分）
  const t = await getTranslations('Home');

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center px-4 py-20">

      {/* 之前是写死的中文文字，现在改成 t('对应的键名')，会根据当前语言自动换 */}
      <h1 className="text-4xl font-bold text-white mb-2">
        {t('title')}
      </h1>
      <p className="text-slate-400 mb-10">
        {t('subtitle')}
      </p>

      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        className="w-full max-w-xl px-5 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 mb-14"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">

        <a
          href="/champions"
          className="bg-slate-800 hover:bg-slate-700 transition rounded-xl p-6 text-center border border-slate-700"
        >
          <div className="text-3xl mb-3">⚔️</div>
          <div className="text-white text-lg font-semibold">{t('championsTitle')}</div>
          <div className="text-slate-400 text-sm mt-1">{t('championsDesc')}</div>
        </a>

        <a
          href="/augments"
          className="bg-slate-800 hover:bg-slate-700 transition rounded-xl p-6 text-center border border-slate-700"
        >
          <div className="text-3xl mb-3">✨</div>
          <div className="text-white text-lg font-semibold">{t('augmentsTitle')}</div>
          <div className="text-slate-400 text-sm mt-1">{t('augmentsDesc')}</div>
        </a>

        <a
          href="/items"
          className="bg-slate-800 hover:bg-slate-700 transition rounded-xl p-6 text-center border border-slate-700"
        >
          <div className="text-3xl mb-3">🛡️</div>
          <div className="text-white text-lg font-semibold">{t('itemsTitle')}</div>
          <div className="text-slate-400 text-sm mt-1">{t('itemsDesc')}</div>
        </a>

      </div>
    </main>
  );
}