export const getEstimatedDeliveryDate = (daysFromNow: number = 2): string => {
  const today = new Date();
  today.setDate(today.getDate() + daysFromNow);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };

  return today.toLocaleDateString('en-IN', options); // Example: "Saturday, 28 September"
};
