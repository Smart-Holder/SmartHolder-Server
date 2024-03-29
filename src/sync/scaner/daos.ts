/**
 * @copyright © 2021 Copyright ccl
 * @date 2023-01-05
 */

import {ContractType,ContractInfo,MemberInfo} from '../../models/define';
import {ContractScaner,HandleEventData,formatHex} from '.';
import {storage} from '../../db';
import * as DAO from '../../../abi/DAO.json';
import * as constants from './../constants';
import {IndexerPool} from './../indexer';
import * as crypto from 'crypto-tx';

export class DAOs extends ContractScaner {

	events = {
		// event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
		// event Created(address indexed dao);

		OwnershipTransferred: {
			handle: async ({event,blockTime: time}: HandleEventData)=>{
				console.log('OwnershipTransferred', event.signature, time);
			}
		},

		Created: {
			handle: async ({event,blockTime: time, tx}: HandleEventData)=>{
				let host = event.returnValues.dao as string;
				let chain = this.chain;
				let blockNumber = Number(event.blockNumber);
				let web3 = this.web3;

				console.log('DAOs.Created', tx.blockNumber);

				if ( await this.db.selectOne(`dao_${chain}`, { address: host }) )
					return;

				let dao    = web3.createContract(host, DAO.abi as any);
				let Root   = await dao.methods.root().call() as string;
				let Member = await dao.methods.module(constants.Module_MEMBER_ID).call() as string;
				let Asset  = await dao.methods.module(constants.Module_ASSET_ID).call() as string;
				let First  = await dao.methods.module(constants.Module_ASSET_First_ID).call() as string;
				let Second = await dao.methods.module(constants.Module_ASSET_Second_ID).call() as string;
				let Ledger = await dao.methods.module(constants.Module_LEDGER_ID).call() as string;
				let Share  = await dao.methods.module(constants.Module_SHARE_ID).call() as string;

				// id           int primary key auto_increment,
				// host         varchar (64)                       not null, -- dao host or self address
				// address      varchar (64)                       not null,
				// name         varchar (64)                       not null,
				// mission      varchar (1024)                     not null,
				// description  varchar (1024)                     not null,
				// root         varchar (64)                       not null,
				// operator     varchar (64)                       not null,
				// member       varchar (64)                       not null,
				// ledger       varchar (64)                       not null,
				// first        varchar (64)                       not null, -- opensea first
				// second       varchar (64)                       not null, -- opensea second
				// asset        varchar (64)                       not null,
				// time         bigint                             not null,
				// modify       bigint                             not null,
				// blockNumber  int                                not null,
				// assetIssuanceTax    int          default (0)    not null,
				// assetCirculationTax int          default (0)    not null,
				// defaultVoteTime     bigint       default (0)    not null,
				// memberBaseName      varchar (32) default ('')   not null,

				let assetIssuanceTax = 0;
				let assetCirculationTax = 0;
				let defaultVoteTime = 0;
				let memberBaseName = '';

				const addressZero = '0x0000000000000000000000000000000000000000';

				let addIndexer = ()=>{
					let ds: (Partial<ContractInfo> & {address: string, exclude?: boolean} | null)[] = [
						{ address: host, host, type: ContractType.DAO, time },
						Root   != addressZero ? { host, address: Root, type: ContractType.VotePool, time }: null,
						Member != addressZero ? { host, address: Member, type: ContractType.Member, time }: null,
						Asset  != addressZero ? { host, address: Asset, type: ContractType.Asset, time, exclude: true }: null,
						First  != addressZero ? { host, address: First, type: ContractType.AssetShell, time }: null,
						Second != addressZero ? { host, address: Second, type: ContractType.AssetShell, time }: null,
						Ledger != addressZero ? { host, address: Ledger, type: ContractType.Ledger, time }: null,
						Share  != addressZero ? { host, address: Share, type: ContractType.Share, time }: null,
					];
					return IndexerPool.addIndexer(chain, host, blockNumber,
						ds.filter(e=>e) as Partial<ContractInfo> & {address: string}[]);
				};
				let after = await addIndexer(); // add indexer data watch

				if (Member != addressZero) {
					memberBaseName = await (await web3.contract(Member)).methods.name().call();
				}
				if (First != addressZero) {
					assetIssuanceTax = await (await web3.contract(First)).methods.seller_fee_basis_points().call();
				}
				if (Second != addressZero) {
					assetCirculationTax = await (await web3.contract(Second)).methods.seller_fee_basis_points().call();
				}
				if (Root != addressZero) {
					defaultVoteTime = Number(await (await web3.contract(Root)).methods.lifespan().call());
				}
				let image = await dao.methods.image().call();
				let extend = crypto.toBuffer(await dao.methods.extend().call());

				await this.db.insert(`dao_${chain}`, {
					address: host,
					host,
					name: await dao.methods.name().call(),
					mission: await dao.methods.mission().call(),
					description: await dao.methods.description().call(),
					root: Root,
					operator: await dao.methods.operator().call(),
					member: Member,
					ledger: Ledger,
					asset: Asset,
					first: First,
					second: Second,
					share: Share,
					time,
					modify: time,
					blockNumber,
					assetIssuanceTax, // 资产发行税,一手交易
					assetCirculationTax, // 资产流转税,二手交易
					defaultVoteTime,  // 默认投票时间
					memberBaseName, // 成员base名称
					createdBy: tx.from,
					image,
					extend,
				});

				if (Member != addressZero) {
					let member = await web3.contract(Member);
					let total = Number(await member.methods.total().call());
					// insert members
					for (let i = 0; i < total; i++) {
						let info = await member.methods.indexAt(i).call() as MemberInfo;
						// id           int primary key auto_increment,
						// host         varchar (64)               not null, -- dao host
						// token        varchar (64)               not null, -- address
						// tokenId      varchar (72)               not null, -- id
						// owner        varchar (64)               not null, -- owner address
						// name         varchar (64)               not null, -- member name
						// description  varchar (512)              not null, -- member description
						// image       varchar (512)              not null, -- member head portrait
						// votes        int           default (0)  not null, -- default > 0
						// time         bigint                     not null,
						// modify       bigint                     not null
						let mbr = await this.db.selectOne(`member_${chain}`, { token: Member, tokenId: info.id });
						if (!mbr) {
							let tokenId = formatHex(info.id);
							let owner = await member.methods.ownerOf(tokenId).call();
							let permissions = [];

							if (await member.methods.isPermissionFrom(tokenId, constants.Action_VotePool_Create).call())
								permissions.push(constants.Action_VotePool_Create);
							if (await member.methods.isPermissionFrom(tokenId, constants.Action_VotePool_Vote).call())
								permissions.push(constants.Action_VotePool_Vote);

							this.db.insert(`member_${chain}`, {
								host, token: Member, tokenId, owner,
								name: info.name, description: info.description,
								image: info.image, votes: info.votes, time, modify: time,
								permissions,
							});
						}
					}

					await this.db.update(`dao_${chain}`, {members: total}, { address: host });
					await storage.set(`member_${chain}_${Member}_total`, total);
				} // if (Member != addressZero)

				after.setTimeout(2e3); // delay 2s call notice message
				// ---- handle end ----
			},
		},
	};

}
