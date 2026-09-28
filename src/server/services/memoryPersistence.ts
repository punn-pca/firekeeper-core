/** Ownership is checked inside the same Firestore transaction that deletes the record. */
export async function deleteOwnedMemory(db: any, userId: string, memoryId: string): Promise<boolean> {
  if (!userId || !memoryId) return false;
  const ref = db.collection('memories').doc(memoryId);
  return db.runTransaction(async (tx: any) => {
    const record = await tx.get(ref);
    if (!record.exists || record.data()?.userId !== userId) return false;
    tx.delete(ref);
    return true;
  });
}
