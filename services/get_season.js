import Season from '../models/season.js';

export default async () => {

    const recentSeason = await Season.findOne({
        raw: true,
        order: [['start_date', 'DESC']],
    }).then(async result => {
        if (result === null) {
            await Season.create({
                id: '10',
                start_date: '2022-01-03T18:00:00.000Z',
                end_date: '2022-03-07T17:50:00.000Z',
            });

            return await Season.findOne({
                raw: true,
                order: [['start_date', 'DESC']],
            }).then((result) => {
                return result;
            });
        } else {
            return result
        }
    });

    if (new Date().getTime() > new Date(recentSeason.end_date).getTime()) {
        const id = `${parseInt(recentSeason.id) + 1}`;
        let startDate = new Date(recentSeason.start_date);
        let endDate = new Date(recentSeason.end_date);
        startDate = new Date(startDate.setMonth(startDate.getMonth() + 2));
        endDate = new Date(endDate.setMonth(endDate.getMonth() + 2));

        console.log(startDate, endDate, startDate.getDay(), endDate.getDay());

        if (startDate.getMonth() % 2 === 0 && startDate.getDate() <= 7 && startDate.getDay() !== 2) {
            startDate = startDate.setDate(startDate.getDate() + ((7 + 2) - startDate.getDay()) % 7);
        } else {
            startDate = startDate.setDate(startDate.getDate() + ((-7 + 2) - startDate.getDay()) % 7);
        }

        if (endDate.getMonth() % 2 === 0 && endDate.getDate() <= 7 && endDate.getDay() !== 2) {
            endDate = endDate.setDate(endDate.getDate() + ((7 + 2) - endDate.getDay()) % 7)
        } else {
            endDate = endDate.setDate(endDate.getDate() + ((-7 + 2) - endDate.getDay()) % 7)
        }

        recentSeason.id = id;
        recentSeason.start_date = startDate;
        recentSeason.end_date = endDate;

        await Season.create({
            id: id,
            start_date: startDate,
            end_date: endDate,
        });
    }
}
