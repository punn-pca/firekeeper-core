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
        
        let dateObj: Date;
        if (data.timestamp?.toDate) {
          dateObj = data.timestamp.toDate();
        } else if (data.timestamp) {
          dateObj = new Date(data.timestamp);
        } else if (data.start_time) {
          dateObj = new Date(data.start_time);
        } else {
          dateObj = new Date();
        }

        const isToday = new Date().toDateString() === dateObj.toDateString();
        const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        const displayTime = isToday ? timeStr : `${dateStr} ${timeStr}`;
        
        // Map status based on either structured confidence object, confidence string, or legacy metric
        const confidenceVal = data.confidence;
        let status: PcaDecision['status'] = 'VERIFIED';
        let statusColor = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
        
        let extractedConfStr = '';
        let extractedScore = 0.8;

        if (typeof confidenceVal === 'string') {
          extractedConfStr = confidenceVal;
        } else if (confidenceVal && typeof confidenceVal === 'object') {
          if (typeof confidenceVal.calibrated_level === 'string') {
            extractedConfStr = confidenceVal.calibrated_level;
          }
          if (typeof confidenceVal.global_score === 'number') {
            extractedScore = confidenceVal.global_score;
          } else if (typeof confidenceVal.posterior_score === 'number') {
            extractedScore = confidenceVal.posterior_score;
          }
        }

        if (extractedConfStr) {
          const lowerConf = extractedConfStr.toLowerCase();
          if (lowerConf === 'ต่ำ' || lowerConf === 'low') {
            status = 'CRITICAL';
            statusColor = 'border-rose-500/30 text-rose-400 bg-rose-500/5';
          } else if (lowerConf === 'ปานกลาง' || lowerConf === 'medium' || lowerConf === 'ไม่สามารถประเมินได้' || lowerConf === 'unknown') {
            status = 'ADVISORY';
            statusColor = 'border-amber-500/30 text-amber-400 bg-amber-500/5';
          }
        } else if (extractedScore !== undefined) {
          if (extractedScore < 0.6) {
            status = 'CRITICAL';
            statusColor = 'border-rose-500/30 text-rose-400 bg-rose-500/5';
          } else if (extractedScore < 0.8) {
            status = 'ADVISORY';
            statusColor = 'border-amber-500/30 text-amber-400 bg-amber-500/5';
          }
        }

        const title = data.input_summary?.topic_preview || data.question || data.user_input || data.purpose || data.input_summary?.intent || 'Analysis Session';

        return {
          id: doc.id,
          title,
          time: displayTime,
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
