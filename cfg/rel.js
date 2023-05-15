
var base = require('./util/base');
var rpc = require('./util/rpc');

module.exports = {
	...base,
	web3s: {
		GOERLI: rpc.GOERLI,
		ETHEREUM: rpc.ETHEREUM,
		MATIC: rpc.MATIC,
	},
	autoIndex: false,
	root: '/data/apps/smart-dao/smart-dao-new/out',
	publicURL: 'https://dao-rel.smartholder.jp',
	mbus: 'mqtt://127.0.0.1:1883',
	mbus_auth: 'nft_hardware_test:nft_hardware_test', // user:password
	mbus_topic: 'shs_default_rel',
	enable_auth: true,
	watch_meta: 'watch_indexer',
	env: 'rel',
	moreLog: true,
	mysql: {
		host: '127.0.0.1', port: 3306, user: 'smartdao', password: 'smartdao', database: 'smartdao', // rel inner
	},
	watchBlock: {
		mysql: {
			host: '172.16.2.46', port: 3306, user: 'smartdao', password: 'smartdao', database: 'smartdao',
		},
		redis: `redis://:${encodeURIComponent('HqNuWY8WRSG2G*&^%#NGRDfmj')}@172.16.3.114:6379/10`, // redis cfg
	},
	redis: `redis://:${encodeURIComponent('Jrn8JyGTEqsbmT(*&^%EZDXbZ')}@127.0.0.1:6379/10`, // redis cfg
};