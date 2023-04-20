/**
 * @copyright © 2021 Copyright ccl
 * @date 2022-07-20
 */

import db, {LedgerType,LedgerReleaseLog} from '../db';
import {formatHex,HandleEventData} from './scaner';
import {ModuleScaner} from './asset';
import * as opensea from '../models/opensea';

export class Ledger extends ModuleScaner {
	events = {
		// event Receive(address indexed from, uint256 balance);
		// event ReleaseLog(address indexed operator, uint256 balance, string log);
		// event Deposit(address indexed from, uint256 balance, string name, string description);
		// event Withdraw(address indexed target, uint256 balance, string description);
		// event Release(uint256 indexed member, address indexed to, uint256 balance);
		// event AssetIncome(
		// 	address indexed token, uint256 indexed tokenId,
		// 	address indexed source, address to, uint256 balance, uint256 price, IAssetShell.SaleType saleType
		// );

		Change: {
			handle: (data: HandleEventData)=>this.onChange(data),
		},

		Receive: {
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {from,balance} = e.returnValues;
				let txHash = e.transactionHash;
				let type = LedgerType.Receive;

				// id           int primary key auto_increment,
				// host         varchar (64)                 not null, -- dao host
				// address      varchar (64)                 not null, -- 合约地址
				// txHash       varchar (72)                 not null, -- tx hash
				// type         int             default (0)  not null, -- 0保留,1进账-无名接收存入,2进账-存入,3出账-取出,4出账-成员分成
				// name         varchar (64)    default ('') not null, -- 转账名目
				// description     varchar (1024)  default ('') not null, -- 详细
				// target       varchar (64)                 not null, -- 转账目标,进账为打款人,出账为接收人
				// member_id    varchar (72)    default ('') not null, -- 成员出账id,如果为成员分成才会存在
				// balance      varchar (72)                 not null, -- 金额
				// time         bigint                       not null, -- 时间
				// blockNumber  int                          not null  -- 区块

				if ( ! await db.selectOne(`ledger_${this.chain}`, { address: this.address, txHash, type, member_id: ''}) ) {
					await db.insert(`ledger_${this.chain}`, {
						host: await this.host(),
						address: this.address,
						txHash: txHash,
						type: type,
						target: from,
						balance: formatHex(balance,0),
						time,
						blockNumber: Number(e.blockNumber) || 0,
					});
				}
			},
		},

		ReleaseLog: {
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {operator,balance,log} = e.returnValues;
				let txHash = e.transactionHash;

				// id           int primary key auto_increment,
				// address      varchar (64)                 not null, -- 合约地址
				// operator     varchar (64)                 not null,
				// txHash       varchar (72)                 not null, -- tx hash
				// log          varchar (1024)               not null,
				// time         bigint                       not null,
				// blockNumber  int                          not null

				if ( ! await db.selectOne(`ledger_release_log_${this.chain}`, { address: this.address, txHash }) ) {
					await db.insert(`ledger_release_log_${this.chain}`, {
						address: this.address,
						operator,
						balance: formatHex(balance,0),
						log,
						time,
						blockNumber: Number(e.blockNumber) || 0,
						txHash,
					});
					await db.update(`ledger_${this.chain}`, { description: log }, { address: this.address, txHash, });
				}
			},
		},

		Deposit: {
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {from,balance,name,description} = e.returnValues;
				let txHash = e.transactionHash;
				let type = LedgerType.Deposit;
				if ( ! await db.selectOne(`ledger_${this.chain}`, { address: this.address, txHash, type, member_id: ''}) ) {
					await db.insert(`ledger_${this.chain}`, {
						host: await this.host(),
						address: this.address,
						txHash: txHash,
						type: type,
						target: from,
						balance: formatHex(balance,0),
						name: name,
						description: description,
						time,
						blockNumber: Number(e.blockNumber) || 0,
					});
				}
			},
		},

		AssetIncome: {
			// event AssetIncome(
			// 	address indexed token, uint256 indexed tokenId,
			// 	address indexed source, address from, address to, uint256 balance, 
			//  uint256 price, uint256 count, IAssetShell.SaleType saleType
			// );
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {token,source,from,to,saleType} = e.returnValues;
				let txHash = e.transactionHash;
				let type = LedgerType.AssetIncome;
				if ( ! await db.selectOne(`ledger_${this.chain}`, { address: this.address, txHash, type, member_id: ''}) ) {
					let tokenId = formatHex(e.returnValues.tokenId, 32);
					let blockNumber = Number(e.blockNumber) || 0;
					let balance = formatHex(e.returnValues.balance, 0);
					let price = formatHex(e.returnValues.price, 0);
					let count = formatHex(e.returnValues.count, 0);

					let ledger_id = await db.insert(`ledger_${this.chain}`, {
						host: await this.host(),
						address: this.address,
						txHash: txHash,
						type: type,
						target: source,
						balance,
						name: '',
						description: '',
						time,
						blockNumber,
					});

					let assetIncome_id = await db.insert(`ledger_asset_income_${this.chain}`, {
						ledger_id, token, tokenId, source, balance, price,
						fromAddress: from, toAddress: to, count, saleType, blockNumber, time
					});

					await db.update(`ledger_${this.chain}`, {assetIncome_id}, {id: ledger_id});
					await opensea.maskOrderSold(this.chain, token, tokenId, this.db);
				}
			},
		},

		Withdraw: {
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {target,balance,description} = e.returnValues;
				let txHash = e.transactionHash;
				let type = LedgerType.Withdraw;
				if ( ! await db.selectOne(`ledger_${this.chain}`, { address: this.address, txHash, type, member_id: ''}) ) {
					await db.insert(`ledger_${this.chain}`, {
						host: await this.host(),
						address: this.address,
						txHash: txHash,
						type: type,
						balance: formatHex(balance,0),
						target: target,
						description: description,
						time,
						blockNumber: Number(e.blockNumber) || 0,
					});
				}
			},
		},

		Release: {
			handle: async ({event:e,blockTime: time}: HandleEventData)=>{
				let db = this.db;
				let {member,to,balance} = e.returnValues;
				let txHash = e.transactionHash;
				let type = LedgerType.Release;
				let member_id = formatHex(member);
				if ( ! await db.selectOne(`ledger_${this.chain}`, { address: this.address, txHash, type, member_id}) ) {
					let log = await db.selectOne<LedgerReleaseLog>(`ledger_release_log_${this.chain}`, { address: this.address, txHash });

					await db.insert(`ledger_${this.chain}`, {
						host: await this.host(),
						address: this.address,
						txHash: txHash,
						type: type,
						target: to,
						balance: formatHex(balance,0),
						description: log?.log || '',
						member_id,
						time,
						blockNumber: Number(e.blockNumber) || 0,
					});
				}
			},
		},
	};

	protected async onDescription({blockTime: modify}: HandleEventData, desc: string) {
		//await db.update(`dao_${this.chain}`, { description: desc, modify }, { address: this.address });
	}

	protected async onOperator({blockTime:modify}: HandleEventData, addr: string) {
		//await db.update(`dao_${this.chain}`, { operator: addr, modify }, { address: this.address });
	}

	protected async onUpgrade(data: HandleEventData, addr: string) {
		// noop
	}

}
