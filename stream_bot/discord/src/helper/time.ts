export const timeStringToSeconds = (timeString: string): number => {
  const timeParts = timeString.split(':').reverse();
  let seconds = 0;

  for (let i = 0; i < timeParts.length; i += 1) {
    const timeUnit = parseFloat(timeParts[i]);

    if (Number.isNaN(timeUnit)) {
      return NaN;
    }

    switch (i) {
      case 0:
        seconds += timeUnit;
        break;
      case 1:
        seconds += timeUnit * 60;
        break;
      case 2:
        seconds += timeUnit * 3600;
        break;
      default:
        return NaN;
    }
  }

  return seconds;
};
