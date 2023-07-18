import {col} from "sequelize";
import InfoMap from '../models/view_info_map.js';
import Rotation from '../models/view_rotation.js';

const groupBy = (data, key) =>
    data.reduce(function (carry, el) {
        const group = el[key];

        if (carry[group] === undefined) {
            carry[group] = [];
        }

        carry[group].push(el);
        return carry;
    }, {});

export class rotationService {
    static selectRotationTL = async () =>
        await Rotation.findAll({
            include: [
                {
                    model: InfoMap,
                    required: true,
                    attributes: []
                }
            ],
            attributes: [
                "ROTATION_SLT_NO",
                "ROTATION_BGN_DT",
                "ROTATION_END_DT",
                "MAP_ID",
                "MAP_MDFS",
                [col("InfoMap.MAP_MD"), "MAP_MD"],
                [col("InfoMap.MAP_NM"), "MAP_NM"]],
            order: [["ROTATION_BGN_DT", "DESC"]],
            raw: true
        }).then(result => {
            return groupBy(result, "ROTATION_SLT_NO");
        });

    static selectRotationPL = async () =>
        await InfoMap.findAll({
            attributes: ["MAP_ID", "MAP_MD", "MAP_NM"],
            where: {
                ROTATION_PL_BOOL: true
            }
        }).then(result => {
            return groupBy(result, "MAP_MD");
        });
}