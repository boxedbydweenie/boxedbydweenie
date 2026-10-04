export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export const formatDayMonth = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" });
