
function getIndiaDateTime() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const value = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  const date = `${value("day")}/${value("month")}/${value("year")}`;
  const time = `${value("hour")}:${value("minute")}:${value("second")} ${value("dayPeriod")}`;

  const day = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(now);

  return {
    date,
    day,
    time,
    timestamp: now,
    timezone: "Asia/Kolkata",
  };
}

module.exports = { getIndiaDateTime };
