
const today = new Date();
today.setHours(0, 0, 0, 0);

function calculateNewTime(scheduledTime: string, delayMinutes: number) {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const date = new Date(today);
    date.setHours(hours, minutes + delayMinutes);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

console.log('09:30 + 15m:', calculateNewTime('09:30', 15));
console.log('09:30 - 15m:', calculateNewTime('09:30', -15));
console.log('00:10 - 20m (prev day?):', calculateNewTime('00:10', -20));
console.log('23:50 + 20m (next day?):', calculateNewTime('23:50', 20));
