import { format } from 'date-fns';
import { de, enUS, it } from 'date-fns/locale';

export default function localizedDate(timestamp: string | number, localeCode: string, hoursOnly: boolean = false) {
    // const date: Date = dateFromTimestamp(ts);

    if (typeof timestamp === 'string') {
        const ts = timestamp;
        let date: Date = new Date(ts);
        switch (localeCode) {
            case 'de':
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy, HH:mm', { locale: de });
            case 'it':
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy, HH:mm', { locale: it });
            case 'en':
                return format(date, hoursOnly ? 'HH:mm' : 'yyyy MMM dd, HH:mm', { locale: enUS });
            default:
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy', { locale: de });

        }
    } else if (typeof (timestamp) === 'number') {
        const ts = timestamp * 1000;
        let date: Date = new Date();
        date.setTime(ts);
        switch (localeCode) {
            case 'de':
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy, HH:mm', { locale: de });
            case 'it':
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy, HH:mm', { locale: it });
            case 'en':
                return format(date, hoursOnly ? 'HH:mm' : 'yyyy MMM dd, HH:mm', { locale: enUS });
            default:
                return format(date, hoursOnly ? 'HH:mm' : 'dd. MMM yyyy', { locale: de });
        }
    } else {
        return timestamp;
    }
}