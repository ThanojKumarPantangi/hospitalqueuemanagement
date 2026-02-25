export const getQueueKey = (departmentId, date) => {
  const d = date.toISOString().slice(0, 10);
  return `queue:${departmentId}:${d}`;
};

export const getScore = (priorityRank, tokenNumber) =>
  priorityRank * 100000 - tokenNumber;