export const calculateWaitingTime = ({
  patientsAhead,
  slotDurationMinutes,
}) => {
  const slot = slotDurationMinutes || 10;

  // Patient is next
  if (patientsAhead <= 0) {
    return {
        patientsAhead: 0,
        minMinutes:0,
        maxMinutes:0,
    };
  }

  const baseMinutes = patientsAhead * slot;

  // Conservative buffer (30–40%)
  const minMinutes = Math.ceil(baseMinutes);
  const maxMinutes = Math.ceil(baseMinutes * 1.4);

  return {
    minMinutes,
    maxMinutes,
    patientsAhead,
  };
};
