/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Smartphone,
  X,
  Compass,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { TrackingMap } from './components/TrackingMap';

const TrackingView = ({ deliveryId }: { deliveryId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!deliveryId) return;

    const unsub = onSnapshot(doc(db, 'deliveries', deliveryId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
        setLoading(false);
      } else {
        setError('Livraison introuvable');
        setLoading(false);
      }
    }, (err) => {
      setError('Erreur de connexion : ' + err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [deliveryId]);

  useEffect(() => {
    if (!isDriver || !deliveryId) return;

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateDoc(doc(db, 'deliveries', deliveryId), {
            driverLocation: { lat: latitude, lng: longitude },
            updatedAt: serverTimestamp()
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isDriver, deliveryId]);

  if (loading) return (
    <div className="w-full max-w-md bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 italic font-medium text-slate-400">
      <Clock className="animate-spin mx-auto mb-4 text-emerald-500" size={32} />
      Chargement du suivi ALGS...
    </div>
  );
  
  if (error) return (
    <div className="w-full max-w-md bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100">
      <CircleAlert className="mx-auto mb-4 text-red-500" size={32} />
      <p className="text-red-500 font-bold">{error}</p>
      <button onClick={() => window.location.hash = '#/'} className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400 underline">Retour</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-slate-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Suivi ALGS</h2>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">ID: {deliveryId.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            data.status === 'en_route' ? 'bg-emerald-100 text-emerald-600' : 
            data.status === 'pending' ? 'bg-orange-100 text-orange-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {data.status === 'en_route' ? 'En livraison' : 
             data.status === 'pending' ? 'En attente' :
             data.status}
          </div>
          {eta && (
            <div className="flex items-center gap-1.5 text-orange-600 font-black text-[10px] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
              <Clock size={10} />
              Arrivée : {eta}
            </div>
          )}
        </div>
      </div>

      <TrackingMap 
        clientLocation={data.clientLocation} 
        driverLocation={data.driverLocation}
        showDriver={true}
        onEtaUpdate={setEta}
        isDriverView={isDriver}
      />

      <div className="mt-6 space-y-4">
        <div className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <MapPin size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Destination</p>
            <p className="text-sm font-bold text-slate-800 leading-tight mt-1">{data.addressDetails || 'Position partagée par GPS'}</p>
          </div>
        </div>

        {eta && (
          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <Bike size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Temps d'arrivée estimé</p>
                <p className="text-base font-black text-orange-600 leading-tight mt-0.5">{eta}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-slate-300">Basé sur le trafic</p>
            </div>
          </div>
        )}

        {!isDriver ? (
          <button 
            onClick={() => setShowConfirmation(true)}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bike size={16} className="relative z-10 transition-transform group-hover:-rotate-12" />
            <span className="relative z-10">Je suis le livreur</span>
          </button>
        ) : (
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-200">
              <Compass size={16} className="animate-spin-slow" />
            </div>
            <p className="text-xs font-bold text-orange-900 leading-tight">
              Tracking actif. Votre position est partagée avec le client en temps réel.
            </p>
          </div>
        )}

        <AnimatePresence>
          {showConfirmation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-slate-100 text-center"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-6">
                  <Navigation size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Activer le suivi ?</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  En acceptant, votre position GPS sera partagée en direct avec le client pour faciliter la livraison.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setIsDriver(true);
                      setShowConfirmation(false);
                      // Update status to en_route
                      updateDoc(doc(db, 'deliveries', deliveryId), {
                        status: 'en_route',
                        updatedAt: serverTimestamp()
                      }).catch(err => console.error("Error updating status:", err));
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                  >
                    Démarrer le trajet
                  </button>
                  <button 
                    onClick={() => setShowConfirmation(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-400"
                  >
                    Plus tard
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => window.location.hash = '#/'}
        className="mt-6 w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors"
      >
        Quitter le suivi
      </button>
    </motion.div>
  );
};

export default function App() {
  // 'client' = Le client partage sa position, 'driver' = Le livreur demande la position
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client'); 
  
  const [clientPhone, setClientPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPreShareConfirm, setShowPreShareConfirm] = useState(false);
  
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'stabilizing'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  // Tracking Data State
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [isDriverView, setIsDriverView] = useState(false);
  
  // Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'other'>('other');

  // Registration of Service Worker and PWA Logic
  useEffect(() => {
    // Check if already installed/standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) setPlatform('ios');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker enregistré successfully:', registration.scope);
            
            // Check for updates periodically or on registration
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show toast
                    setShowUpdateToast(true);
                  }
                };
              }
            };
          }
        ).catch(err => console.log('SW registration failed:', err));
      });

      // Reload page when new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hash control
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0); // Reset scroll on navigation
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    // If iOS and not standalone, show the banner manually after a delay
    if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as any).standalone) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // Nettoyage et formatage du numéro pour WhatsApp (+221)
  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('7')) return `221${cleaned}`;
    if (cleaned.startsWith('+221')) return cleaned.replace('+', '');
    // Handle cases where user might put 00221
    if (cleaned.startsWith('00221')) return cleaned.slice(2);
    return cleaned;
  };

  const resetForm = () => {
    setClientPhone('');
    setDriverPhone('');
    setAddressDetails('');
    setError('');
    setSuccess(false);
    setGpsAccuracy(null);
    setGpsStatus('idle');
  };

  // FLUX 1 : Le client localise et envoie au livreur
  const shareLocation = async () => {
    setError('');
    setSuccess(false);
    
    if (!clientPhone || !driverPhone) {
      setError('Veuillez remplir les numéros de téléphone.');
      return;
    }

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce téléphone.");
      return;
    }

    setLoading(true);
    setGpsStatus('searching');
    setGpsAccuracy(null);
    
    // Configuration GPS stricte pour précision SIM/Matérielle maximale
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 30000, 
      maximumAge: 0
    };

    let watchId: number;
    let stabilizedPos: GeolocationPosition | null = null;
    let attempts = 0;
    let finished = false;

    const stopAndProceed = async (pos: GeolocationPosition) => {
      if (finished) return;
      finished = true;
      
      if (watchId) navigator.geolocation.clearWatch(watchId);
      
      setGpsStatus('stabilizing');
      try {
        const { latitude, longitude } = pos.coords;
        
        // Sauvegarde dans Firestore pour le tracking temps réel
        const deliveryRef = await addDoc(collection(db, 'deliveries'), {
          clientPhone: clientPhone,
          driverPhone: driverPhone,
          clientLocation: { lat: latitude, lng: longitude },
          addressDetails: addressDetails,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const formattedDriver = formatPhone(driverPhone);
        const trackingLink = `${window.location.origin}/#/track/${deliveryRef.id}`;
        const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        
        let message = `Bonjour, voici ma position exacte pour la livraison ALGS :\n\n`;
        message += `📍 Suivi ALGS en direct : ${trackingLink}\n`;
        message += `🏍️ Cliquez ici pour lancer l'itinéraire : ${googleMapsLink}\n\n`;
        
        if (addressDetails.trim() !== '') {
          message += `🏠 Repère : ${addressDetails}\n`;
        }
        message += `📞 Client : +221${clientPhone.replace(/\s+/g, '')}`;

        // Utilisation de location.href pour éviter le blocage des popups sur mobile comme conseillé
        window.location.href = `https://wa.me/${formattedDriver}?text=${encodeURIComponent(message)}`;
        setSuccess(true);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
        setGpsStatus('idle');
      } catch (err: any) {
        setLoading(false);
        setGpsStatus('idle');
        setError("Erreur : " + err.message);
      }
    };

    // On utilise watchPosition pour "homing" sur la meilleure précision (SIM + GPS)
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        attempts++;
        const accuracy = Math.round(position.coords.accuracy);
        setGpsAccuracy(accuracy);
        stabilizedPos = position;

        // Si la précision est excellente (< 20m) ou après 4 tentatives, on valide
        if (accuracy < 20 || attempts > 4) {
          stopAndProceed(position);
        }
      },
      (err) => {
        if (stabilizedPos) {
          stopAndProceed(stabilizedPos);
        } else {
          setLoading(false);
          setGpsStatus('idle');
          if (err.code === 1) {
            setError("Permission refusée. Veuillez autoriser l'accès au GPS dans les réglages de votre navigateur.");
          } else if (err.code === 3) {
            setError("Délai GPS expiré. Veuillez vous mettre à découvert ou vérifier votre connexion.");
          } else {
            setError("Impossible de capter votre GPS. Vérifiez que la localisation est activée sur votre téléphone.");
          }
          console.error("Erreur GPS :", err);
          if (watchId) navigator.geolocation.clearWatch(watchId);
        }
      },
      geoOptions
    );

    // Sécurité : au bout de 12 secondes, on prend ce qu'on a de mieux
    setTimeout(() => {
      if (loading && stabilizedPos && gpsStatus !== 'idle') {
        stopAndProceed(stabilizedPos);
      }
    }, 12000);
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

  const renderTracking = () => {
    const deliveryId = currentHash.split('/track/')[1];
    
    if (!deliveryId) {
      return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center">
          <CircleAlert className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black mb-2">ID de livraison manquant</h2>
          <button onClick={() => window.location.hash = '#/'} className="text-emerald-500 font-bold">Retour</button>
        </div>
      );
    }

    return <TrackingView deliveryId={deliveryId} />;
  };

  const renderHome = () => (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
            className="flex flex-col gap-2 mb-6"
          >
            <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-medium border border-red-100 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5">
                <CircleAlert size={18} className="shrink-0 text-red-500" />
                {error}
              </div>
              <button 
                onClick={() => setError('')}
                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 mb-6"
          >
            <div className="bg-emerald-50 text-emerald-900 text-sm px-4 py-3 rounded-xl font-bold border border-emerald-200 flex items-center justify-between gap-2 shadow-md">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                Votre position a été envoyée avec succès !
              </motion.div>
              <button 
                onClick={resetForm}
                className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800 transition-colors"
                id="reset-form-btn-top"
              >
                Réinitialiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
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
                  rows={2} 
                  value={addressDetails} 
                  onChange={(e) => setAddressDetails(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] resize-none transition-all placeholder:text-slate-300"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!clientPhone || !driverPhone) {
                    setError('Veuillez remplir les numéros de téléphone.');
                    return;
                  }
                  setShowPreShareConfirm(true);
                }}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-slate-900 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all mt-2 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock size={16} className="animate-spin" />
                    En cours...
                  </span>
                ) : (
                  <>
                    <Share2 size={18} />
                    Partager ma position
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
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

      <div className="pt-8">
        {success ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={resetForm}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-[#FF7A00] border-2 border-orange-100 bg-orange-50/30 flex items-center justify-center gap-3 transition-all"
          >
            <Clock size={18} />
            Nouvelle opération
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (activeTab === 'client') {
                if (!clientPhone || !driverPhone) {
                  setError('Veuillez remplir les numéros de téléphone.');
                  return;
                }
                setShowPreShareConfirm(true);
              } else {
                handleDriverRequest();
              }
            }}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'client' 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                : 'bg-[#FF7A00] hover:bg-[#e66e00] shadow-orange-100'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Clock size={20} />
                  </motion.div>
                  <span>{gpsStatus === 'searching' ? 'Recherche Satellite...' : 'Précision GPS...'}</span>
                  {gpsAccuracy !== null && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
                      {gpsAccuracy}m
                    </span>
                  )}
                </div>
                <p className="text-[8px] opacity-70 normal-case tracking-normal font-medium">Capture haute précision en cours</p>
              </div>
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
        )}
      </div>
    </motion.div>
  );

  const renderAbout = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100"
    >
      <h2 className="text-2xl font-black text-slate-950 mb-6">À propos d'ALGS</h2>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          ALGS (Alioune Livraison Gestion Service) est née d'un constat simple : il est souvent difficile de trouver une adresse exacte au Sénégal.
        </p>
        <p>
          Notre mission est de simplifier la rencontre entre les livreurs et les clients grâce à la puissance de la géolocalisation précise, sans avoir à s'échanger des appels interminables pour expliquer son chemin.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-6">
          <p className="text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nos Valeurs</p>
          <ul className="space-y-2 font-bold text-slate-800">
            <li className="flex items-center gap-2 italic">🚀 Rapidité</li>
            <li className="flex items-center gap-2 italic">📍 Précision</li>
            <li className="flex items-center gap-2 italic">🇸🇳 Innovation locale</li>
          </ul>
        </div>
      </div>
      <button 
        onClick={() => { window.location.hash = '#/'; }}
        className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-[#FF7A00] border-2 border-orange-50 rounded-2xl hover:bg-orange-50 transition-colors"
      >
        Retour à l'accueil
      </button>
    </motion.div>
  );

  const renderContact = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100 text-center"
    >
      <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-[#FF7A00] mx-auto mb-6">
        <Phone size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-950 mb-2">Contactez-nous</h2>
      <p className="text-sm text-slate-500 mb-8 px-4">Besoin d'aide ou d'un partenariat ? Notre équipe est à votre écoute.</p>
      
      <div className="space-y-3">
        <a 
          href="https://wa.me/221770000000" 
          className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:border-emerald-300 transition-all"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">WhatsApp Support</span>
            <span className="text-sm font-bold text-slate-800">+221 77 ... .. ..</span>
          </div>
          <Send size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </a>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
            <span className="text-sm font-bold text-slate-800">contact@algs.sn</span>
          </div>
          <X size={18} className="text-slate-300" />
        </div>
      </div>

      <button 
        onClick={() => { window.location.hash = '#/'; }}
        className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-[#FF7A00] border-2 border-orange-50 rounded-2xl hover:bg-orange-50 transition-colors"
      >
        Retour à l'accueil
      </button>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800">
      
      <AnimatePresence>
        {showPreShareConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <MapPin size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Partager ma position ?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                ALGS va récupérer votre position GPS actuelle pour l'envoyer au livreur via WhatsApp. C'est sécurisé et permet une livraison plus rapide.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowPreShareConfirm(false);
                    shareLocation();
                  }}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
                >
                  Confirmer et Partager
                </button>
                <button 
                  onClick={() => setShowPreShareConfirm(false)}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-400"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[340px] bg-emerald-600 text-white rounded-2xl p-4 shadow-2xl z-[60] flex items-center gap-3 border border-emerald-400"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-100">Succès</p>
              <p className="text-xs font-bold text-white">Votre position a été envoyée !</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[340px] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-[60] flex items-center justify-between gap-4 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Mise à jour</p>
                <p className="text-xs font-bold">Nouvelle version disponible</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Actualiser
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full max-w-md bg-white border-b border-emerald-100 p-4 mb-4 shadow-xl shadow-emerald-900/5 flex flex-col gap-3 z-50 sticky top-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                  <Smartphone size={22} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">Installer ALGS</p>
                  <p className="text-xs font-bold text-slate-700">Accès rapide comme une application</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-2 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-50 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {platform === 'ios' ? (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold leading-tight">
                  Pour installer : Appuyez sur <Share2 size={12} className="inline mx-0.5" /> puis sur <span className="underline">"Sur l'écran d'accueil"</span>
                </p>
              </div>
            ) : (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-emerald-500 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-emerald-200"
              >
                Ajouter à l'écran d'accueil
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-md text-center py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
          onClick={() => { window.location.hash = '#/'; }}
          style={{ cursor: 'pointer' }}
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

      {/* Main Content Router */}
      <AnimatePresence mode="wait">
        {currentHash.includes('#/track/') ? (
          <React.Fragment key="tracking">{renderTracking()}</React.Fragment>
        ) : currentHash === '#/about' ? (
          <React.Fragment key="about">{renderAbout()}</React.Fragment>
        ) : currentHash === '#/contact' ? (
          <React.Fragment key="contact">{renderContact()}</React.Fragment>
        ) : (
          <React.Fragment key="home">{renderHome()}</React.Fragment>
        )}
      </AnimatePresence>

      {/* Trust Badge */}

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
            <a 
              href="#/about" 
              className={`text-[9px] font-bold transition-colors uppercase ${currentHash === '#/about' ? 'text-slate-950 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'}`}
            >
              À propos
            </a>
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <a 
              href="#/contact" 
              className={`text-[9px] font-bold transition-colors uppercase ${currentHash === '#/contact' ? 'text-slate-950 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'}`}
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
