
const INDIA_TIME_ZONE = "Asia/Kolkata";

function getIndiaTime(date = new Date()) {
  const format = (options) =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: INDIA_TIME_ZONE,
      ...options,
    }).format(date);

  return {
    timestamp: date,

    date: format({
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),

    day: format({
      weekday: "long",
    }),

    time: format({
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),

    timezone: INDIA_TIME_ZONE,
  };
}

module.exports = {
  INDIA_TIME_ZONE,
  getIndiaTime,
};
