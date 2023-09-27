const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto'
});

const DIVISIONS: Array<{ amount: number, name: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' }
];

export const formatTimeAgo = (date: Date): string => {
    let duration = (date.getTime() - new Date().getTime()) / 1000;

    for (let i = 0; i <= DIVISIONS.length; i++) {
        const division = DIVISIONS[i] as typeof DIVISIONS[number];
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }
    return date.toDateString();
};