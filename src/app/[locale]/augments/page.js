'use client';

import {useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import augmentsData from '../../../../data/augments.json';
import AugmentIcon from '../../../components/AugmentIcon';

const rarityStyles = {
  silver: 'border-slate-500 text-slate-300',
  gold: 'border-amber-500 text-amber-400',
  prismatic: 'border-purple-400 text-purple-300',
};

export default function AugmentsPage() {
  const t = useTranslations('Augments');
  const locale = useLocale();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredAugments = augmentsData.filter((augment) => {
    if (augment.disabled) return false; // 停用的符文不显示
    const matchesRarity = activeFilter === 'all' || augment.rarity === activeFilter;
    const nameInCurrentLocale = augment.name[locale] || augment.name.en;
    const matchesSearch = nameInCurrentLocale.toLowerCase().includes(searchText.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  const filters = [
    {key: 'all', label: t('filterAll')},
    {key: 'silver', label: t('filterSilver')},
    {key: 'gold', label: t('filterGold')},
    {key: 'prismatic', label: t('filterPrismatic')},
  ];

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-16">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-white mb-6">{t('pageTitle')}</h1>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full max-w-md px-4 py-2 rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 mb-4"
        />

        <div className="flex gap-2 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-1.5 rounded-full text-sm transition ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAugments.map((augment) => (
            <div
              key={augment.id}
              className={`bg-slate-800 rounded-lg p-4 border-l-4 ${rarityStyles[augment.rarity]}`}
            >
              <div className="flex items-start gap-3 mb-2">
                <AugmentIcon
                  augment={augment}
                  alt={augment.name[locale] || augment.name.en}
                />
                <div className="flex-1 flex justify-between items-start">
                  <h3 className="text-white font-semibold">
                    {augment.name[locale] || augment.name.en}
                  </h3>
                  <span className={`text-xs uppercase ${rarityStyles[augment.rarity]}`}>
                    {augment.rarity}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                {augment.description[locale] || augment.description.en}
              </p>
            </div>
          ))}
        </div>

        {filteredAugments.length === 0 && (
          <p className="text-slate-500 text-center mt-10">No augments found.</p>
        )}

      </div>
    </main>
  );
}