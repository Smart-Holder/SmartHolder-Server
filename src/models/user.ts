/**
 * @copyright © 2022 Copyright ccl
 * @date 2023-01-12
 */

import db, {ChainType, User,DAO,UserLikeDAO} from '../db';
import {fillMemberObjs,getDAONoEmpty} from './dao';
import { DAOExtend } from './define_ext';
import auth from '../auth';
import somes from 'somes';

export async function getUser({id,address}:{address?: string, id?: number}) {
	let defaultValue: User = {
		id: id || 0,
		nickname: '', description: '',
		image: '',  likes: 0,
		address: '', time: 0, modify: 0,
	}
	if (!id && !address)
		return defaultValue;
	
	let user = await db.selectOne<User>(`user`, {id,address});
	if (user)
		return user;

	if (address) {
		let au = await auth.getFromRef(address);
		if (au) {
			user = await db.selectOne<User>(`user`, {id:au.id});
			if (user)
				return user;
		}
	}

	return defaultValue;
}

async function setUser1(id: number, user: Partial<User>) {
	if (await db.selectOne(`user`, {id})) {
		let {id:_,time,...obj} = user;
		await db.update(`user`, {...obj, modify: Date.now()}, {id});
	} else {
		await db.insert(`user`, {...user, id, modify: Date.now(), time: Date.now()});
	}
}

export async function setUser(id: number, user: Partial<User>) {
	let {likes, ...obj} = user; // skip like
	return setUser1(id, obj);
}

export async function addLikeDAO(chain: ChainType, uid: number, dao_id?: number, host?: string) {
	if (!dao_id) {
		somes.assert(host, '#user.addLikeDAO dao_id and host no is empty');
		dao_id = (await getDAONoEmpty(chain, host!)).id;
	}
	let user_like_dao = await db.selectOne<UserLikeDAO>(`user_like_dao`, {user_id: uid, dao_id, chain});

	if ( ! user_like_dao || user_like_dao.state != 0 ) { // add
		let user = await getUser({id: uid});
		let dao = (await db.selectOne<DAO>(`dao_${chain}`, {id: dao_id}))!;

		await db.transaction(async db=>{
			if (user_like_dao) {
				await db.update(`user_like_dao`, {state: 0, time: Date.now()}, {id: user_like_dao.id});
			} else {
				await db.insert(`user_like_dao`, {user_id: uid, dao_id, chain, time: Date.now()});
			}
			await setUser1(uid, {likes: user.likes + 1});
			await db.update(`dao_${chain}`, {likes: dao.likes + 1}, {id: dao_id});
		})
	}
}

export async function deleteLikeDAO(chain: ChainType, id: number, dao_id?: number, host?: string) {
	if (!dao_id) {
		somes.assert(host, '#user.deleteLikeDAO dao_id and host no is empty');
		dao_id = (await getDAONoEmpty(chain, host!)).id;
	}
	let user_like_dao = await db.selectOne<UserLikeDAO>(`user_like_dao`, {user_id: id, dao_id, chain});

	if (user_like_dao && user_like_dao.state == 0) { // delete
		let user = await getUser({id});
		let dao = (await db.selectOne<DAO>(`dao_${chain}`, {id: dao_id}))!;

		await db.transaction(async db=>{
			await db.update(`user_like_dao`, {state: 1, time: Date.now()}, {id: user_like_dao!.id});
			await setUser1(id, {likes: user.likes - 1});
			await db.update(`dao_${chain}`, {likes: dao.likes - 1}, {id: dao_id});
		});
	}
}

export async function getUserLikeDAOs(id: number, chain?: ChainType, memberObjs?: number) {
	let DAOsIDs: Dict<number[]> = {};
	let DAOs = [] as DAOExtend[];

	for (let like of await db.select<UserLikeDAO>(`user_like_dao`, {user_id: id, chain, state: 0})) {
		let IDs = DAOsIDs[like.chain] || (DAOsIDs[like.chain] = []);
		IDs.push(like.dao_id);
	}

	for (let [chain,IDs] of Object.entries(DAOsIDs)) {
		let ls = await db.query<DAO>(
			`select * from dao_${chain} where id in (${IDs.join(',')})`);
		await fillMemberObjs(Number(chain), memberObjs, DAOs);
		DAOs.push(...ls);
	}

	return DAOs;
}