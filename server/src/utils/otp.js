export const generateOtp = () => {
  return Math.floor(1000000 + Math.random() * 900000).toString();
};
