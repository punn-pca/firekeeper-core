import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  db,
  getIsFirestoreQuotaExhausted
} from '../lib/firebase';

export interface PcaDecision {
  id: string;
  title: string;
  time: string;
  status: 'VERIFIED' | 'ADVISORY' | 'CRITICAL';
  statusColor: string;
  timestamp?: any;
  fullLog?: any;
}

export function useRecentDecisions(userId: string | null) {
  const [decisions, setDecisions] = useState<PcaDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || getIsFirestoreQuotaExhausted()) {
      setLoading(false);
      return;
    }

    const logsRef = collection(db, 'users', userId, 'pca_audit_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
        
        // Map status
        const confidence = data.confidence?.global_score || 0.8;
        let status: PcaDecision['status'] = 'VERIFIED';
        let statusColor = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
        
        if (confidence < 0.6) {
          status = 'CRITICAL';
          statusColor = 'border-rose-500/30 text-rose-400 bg-rose-500/5';
        } else if (confidence < 0.8) {
          status = 'ADVISORY';
          statusColor = 'border-amber-500/30 text-amber-400 bg-amber-500/5';
        }

        return {
          id: doc.id,
          title: data.input_summary?.intent || 'Analysis Session',
          time: timestamp.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          status,
          statusColor,
          timestamp: data.timestamp,
          fullLog: data
        } as PcaDecision;
      });
      setDecisions(docs);
      setLoading(false);
    }, (err) => {
      console.warn('[useRecentDecisions] Error fetching logs:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { decisions, loading };
}
