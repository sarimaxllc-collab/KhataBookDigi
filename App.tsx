
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Language, User } from './types';
import { TRANSLATIONS, INITIAL_TRANSACTIONS } from './constants';
import { getKhataAdvice } from './services/geminiService';
import LanguageToggle from './components/LanguageToggle';
import SummaryCard from './components/SummaryCard';
import TransactionModal from './components/TransactionModal';
import Auth from './components/Auth';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('EN');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.RECEIVABLE);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('khata_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }
    
    const savedUser = localStorage.getItem('khata_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Handle PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('khata_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.RECEIVABLE) acc.receive += t.amount;
        else acc.pay += t.amount;
        return acc;
      },
      { receive: 0, pay: 0 }
    );
  }, [transactions]);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('khata_user', JSON.stringify(userData));
  };

  const handleAddTransaction = (data: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...data,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTransactions([newTx, ...transactions]);
    setAiAdvice('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'RU' ? 'Kya aap is entry ko delete karna chahte hain?' : 'Are you sure you want to delete this entry?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      setAiAdvice('');
    }
  };

  const fetchAdvice = async () => {
    setIsAiLoading(true);
    try {
      const advice = await getKhataAdvice(transactions, lang);
      setAiAdvice(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const logout = () => {
    if (window.confirm(lang === 'RU' ? 'Logout karna chahte hain?' : 'Are you sure you want to logout?')) {
      setUser(null);
      localStorage.removeItem('khata_user');
    }
  };

  const t = (key: string) => TRANSLATIONS[key][lang];

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} lang={lang} onLanguageChange={setLang} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-32">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black shadow-md shadow-indigo-200">
              K
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('app_name')}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {deferredPrompt && (
              <button 
                onClick={handleInstallApp}
                className="hidden md:flex items-center text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <DownloadIcon />
                {t('install_app')}
              </button>
            )}
            <div className="hidden sm:block">
              <LanguageToggle current={lang} onToggle={setLang} />
            </div>
            <button 
              onClick={logout}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Mobile Install Prompt */}
        {deferredPrompt && (
          <div className="md:hidden bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-3">K</div>
              <p className="text-sm font-bold text-indigo-900">{lang === 'RU' ? 'App home screen pr add karein' : 'Add to Home Screen'}</p>
            </div>
            <button 
              onClick={handleInstallApp}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              {t('install_app')}
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{t('welcome_back')}</p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h2>
          </div>
          
          <button 
            onClick={fetchAdvice}
            disabled={isAiLoading || transactions.length === 0}
            className={`
              flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
              ${isAiLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95'
              }
              disabled:opacity-50 disabled:shadow-none
            `}
          >
            {isAiLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {lang === 'RU' ? 'Soch raha hoon...' : 'Analyzing...'}
              </span>
            ) : (
              <>
                <SparkleIcon />
                {t('ai_assistant')}
              </>
            )}
          </button>
        </div>

        <SummaryCard totalReceive={totals.receive} totalPay={totals.pay} lang={lang} />

        {aiAdvice && (
          <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <SparkleIcon />
                </div>
                <h4 className="font-black text-xl tracking-tight">{t('ai_advice')}</h4>
              </div>
              <div className="text-indigo-50 text-lg leading-relaxed font-medium">
                {aiAdvice}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-black text-gray-900 text-lg tracking-tight">{t('recent_transactions')}</h3>
            <div className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
              {transactions.length} Entries
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {transactions.length === 0 ? (
              <div className="px-8 py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium max-w-xs mx-auto">
                  {t('no_transactions')}
                </p>
              </div>
            ) : (
              transactions.map(item => (
                <div key={item.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-105 ${
                      item.type === TransactionType.RECEIVABLE 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {item.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{item.contactName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">{item.date}</span>
                        {item.note && (
                          <>
                            <span className="text-gray-200">•</span>
                            <span className="italic">"{item.note}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className={`text-xl font-black ${
                        item.type === TransactionType.RECEIVABLE ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.type === TransactionType.RECEIVABLE ? '+' : '-'} Rs. {item.amount.toLocaleString()}
                      </p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        item.type === TransactionType.RECEIVABLE ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {item.type === TransactionType.RECEIVABLE ? 'Lena Hai' : 'Dena Hai'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-8 left-0 right-0 px-6 z-40 pointer-events-none">
        <div className="max-w-md mx-auto flex gap-4 pointer-events-auto">
          <button
            onClick={() => { setModalType(TransactionType.RECEIVABLE); setIsModalOpen(true); }}
            className="flex-1 flex items-center justify-center space-x-2 py-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 font-black text-sm uppercase tracking-wide"
          >
            <PlusIcon />
            <span>{t('add_debtor')}</span>
          </button>
          <button
            onClick={() => { setModalType(TransactionType.PAYABLE); setIsModalOpen(true); }}
            className="flex-1 flex items-center justify-center space-x-2 py-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 font-black text-sm uppercase tracking-wide"
          >
            <PlusIcon />
            <span>{t('add_creditor')}</span>
          </button>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        type={modalType}
        lang={lang}
      />
    </div>
  );
};

export default App;
