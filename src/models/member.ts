/**
 * @copyright © 2022 Copyright ccl
 * @date 2022-07-21
 */

import db, {ChainType, Member} from '../db';
import * as dao_fn from './dao';
import {getLimit,newQuery} from './utils';
import {escape} from 'somes/db';

export const getMembersFrom = newQuery(async ({chain,host,owner,time}:{
	chain: ChainType, host: string, owner?: string, time?: number | number[]
},{orderBy,limit,total,out})=>{
	let dao = await dao_fn.getDAONoEmpty(chain, host);
	let sql = `select ${out} from member_${chain} where token=${escape(dao.member)} `;

	if (owner)
		sql += `and owner=${escape(owner)} `;
	if (time) {
		let [s,e] = Array.isArray(time) ? time: [time];
		sql += `and time>=${escape(s)} `;
		if(e)
			sql += `and time<=${escape(e)} `;
	}
	if (!total && orderBy)
		sql += `order by ${orderBy} `; // order by time desc
	if (limit)
		sql += `limit ${getLimit(limit).join(',')} `;

	return await db.query<Member>(sql);
}, 'getMembersFrom');
