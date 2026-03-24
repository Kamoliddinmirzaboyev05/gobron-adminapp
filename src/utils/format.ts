export const formatPrice = (price: number): string => {
  return price.toLocaleString('uz-UZ') + " so'm";
};

export const formatPriceShort = (price: number): string => {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  return price.toLocaleString('uz-UZ');
};

export const formatTime = (time: string): string => time;

export const getTimeAgo = (createdAt: string): string => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
};
