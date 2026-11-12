export const C = {
  bg: "#F2F5F3",
  card: "#FFFFFF",
  ink: "#16231D",
  muted: "#66756D",
  line: "#E1E8E4",
  green: "#0F5C4D",
  warnBg: "#FFF4DE",
  warnText: "#9A5B00",
  red: "#B3372A",
  redBg: "#FBE7E4",
};

export const money = (n) =>
  "₱" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const errorText = (err) =>
  err.response?.data?.message ?? "The server is not responding";