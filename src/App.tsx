/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Bike, 
  User, 
  Send, 
  Phone, 
  Navigation, 
  CircleAlert,
  CheckCircle2,
  Share2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // 'client' = Le client partage sa position, 'driver' = Le livreur demande la position
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client'); 
  
  const [clientPhone, setClientPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Registration of Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker enregistré avec succès: ', registration.scope);
          },
          (err) => {
            console.log('Échec de l\'enregistrement du Service Worker: ', err);
          }
        );
      });
    }
  }, []);

  // Nettoyage et formatage du numéro pour WhatsApp (+221)
  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('7')) return `221${cleaned}`;
    if (cleaned.startsWith('+221')) return cleaned.replace('+', '');
    // Handle cases where user might put 00221
    if (cleaned.startsWith('00221')) return cleaned.slice(2);
    return cleaned;
  };

  // FLUX 1 : Le client localise et envoie au livreur
  const handleClientShare = () => {
    setError('');
    setSuccess(false);
    
    if (!clientPhone || !driverPhone) {
      setError('Veuillez remplir les numéros de téléphone.');
      return;
    }

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLoading(false);

        const formattedDriver = formatPhone(driverPhone);
        const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        
        let message = `Bonjour, voici ma position exacte pour la livraison ALGS :\n📍 Lien de guidage : ${googleMapsLink}`;
        if (addressDetails.trim() !== '') message += `\n🏠 Repère : ${addressDetails}`;
        message += `\n📞 Client : +221${clientPhone.replace(/\s+/g, '')}`;

        window.open(`https://wa.me/${formattedDriver}?text=${encodeURIComponent(message)}`, '_blank');
        setSuccess(true);
      },
      (err) => {
        setLoading(false);
        setError("Impossible d'obtenir la position. Assurez-vous d'avoir activé le GPS.");
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // FLUX 2 : Le livreur demande la position au client
  const handleDriverRequest = () => {
    setError('');
    setSuccess(false);
    
    if (!clientPhone) {
      setError('Veuillez renseigner le numéro du client.');
      return;
    }

    const formattedClient = formatPhone(clientPhone);
    // Lien de l'appli en production où le client pourra cliquer
    const appUrl = window.location.origin; 
    
    const message = `Bonjour, c'est votre livreur ALGS. 🏍️\nPourriez-vous cliquer sur le lien ci-dessous pour me partager votre position exacte en 1 clic et faciliter votre livraison ?\n\n👉 Cliquez ici : ${appUrl}`;

    window.open(`https://wa.me/${formattedClient}?text=${encodeURIComponent(message)}`, '_blank');
    setSuccess(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="w-full max-w-md text-center py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black tracking-tighter text-slate-950">
              AL<span className="text-[#FF7A00]">G</span>S
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-2">
            La livraison précise au Sénégal
          </p>
        </motion.div>
      </div>

      {/* Main Container */}
      <motion.div 
        layout
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 border border-slate-100 flex flex-col"
      >
        {/* Tabs Selection */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 relative">
          <button 
            onClick={() => { setActiveTab('client'); setError(''); setSuccess(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all z-10 ${activeTab === 'client' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={14} />
            Espace Client
          </button>
          <button 
            onClick={() => { setActiveTab('driver'); setError(''); setSuccess(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all z-10 ${activeTab === 'driver' ? 'bg-white text-[#FF7A00] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Bike size={16} />
            Espace Livreur
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl mb-6 font-medium border border-red-100 flex items-center gap-2"
            >
              <CircleAlert size={14} className="shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 text-emerald-700 text-xs px-4 py-3 rounded-xl mb-6 font-medium border border-emerald-100 flex items-center gap-2"
            >
              <CheckCircle2 size={14} className="shrink-0" />
              WhatsApp ouvert avec succès !
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* FORMULAIRE MODE CLIENT */}
            {activeTab === 'client' ? (
              <motion.div 
                key="client-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Phone size={12} /> Mon Numéro WhatsApp
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                    <input 
                      type="tel" 
                      placeholder="77 000 00 00" 
                      value={clientPhone} 
                      onChange={(e) => setClientPhone(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-18 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Bike size={12} /> Numéro du Livreur
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                    <input 
                      type="tel" 
                      placeholder="76 000 00 00" 
                      value={driverPhone} 
                      onChange={(e) => setDriverPhone(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-18 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} /> Complément d'adresse
                  </label>
                  <textarea 
                    placeholder="Ex: Près de la mosquée, devant le portail gris..." 
                    rows={3} 
                    value={addressDetails} 
                    onChange={(e) => setAddressDetails(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] resize-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </motion.div>
            ) : (
              /* FORMULAIRE MODE LIVREUR */
              <motion.div 
                key="driver-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <Clock className="text-orange-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-orange-950">Astuce Livreur</p>
                      <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                        Entrez le numéro du client ci-dessous. Nous préparerons un message WhatsApp avec le lien direct vers cette application pour qu'il puisse vous envoyer sa position exacte.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User size={12} /> Numéro WhatsApp du Client
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                    <input 
                      type="tel" 
                      placeholder="77 000 00 00" 
                      value={clientPhone} 
                      onChange={(e) => setClientPhone(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-18 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={activeTab === 'client' ? handleClientShare : handleDriverRequest}
            disabled={loading}
            id={activeTab === 'client' ? 'share-location-btn' : 'request-location-btn'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'client' 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 active:bg-emerald-700' 
                : 'bg-[#FF7A00] hover:bg-[#e66e00] shadow-orange-100 active:bg-[#cc6200]'
            }`}
          >
            {loading ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Clock size={20} />
                </motion.div>
                Récupération GPS...
              </>
            ) : activeTab === 'client' ? (
              <>
                <Share2 size={18} />
                Partager ma position
              </>
            ) : (
              <>
                <Send size={18} />
                Demander la position
              </>
            )}
          </motion.button>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 opacity-30">
              <div className="w-1 h-1 rounded-full bg-slate-900"></div>
              <div className="w-1 h-1 rounded-full bg-slate-900"></div>
              <div className="w-1 h-1 rounded-full bg-slate-900"></div>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Trust Badge */}
      <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-slate-200/40 rounded-full">
        <Navigation size={12} className="text-slate-400" />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">
          Dakar • Thiès • Saint-Louis • Mbour
        </span>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mt-auto py-6">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            ALGS © 2026 • Livraison Intelligente
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a href="#" className="text-[9px] font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase">Confidentialité</a>
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <a href="#" className="text-[9px] font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
