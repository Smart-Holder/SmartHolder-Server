
var base = require('./util/base');
var rpc = require('./util/rpc');

module.exports = {
	...base,
	web3s: {
		GOERLI: rpc.GOERLI.slice(1), // skip local
		ETHEREUM: rpc.ETHEREUM.slice(1,2), // only use local
	},
	autoIndex: false,
	root: '/data/apps/smart-dao/smart-dao',
	publicURL: 'https://dao.smartholder.jp',
	mbus: 'mqtt://172.16.3.114:1883',
	mbus_auth: 'smartholder:xWhL#BP4QjsmartholderdSQGq%sKcM', // user:password
	mbus_topic: 'shs_default_prod',
	enable_auth: true,
	env: 'prod', // dev|prod
	mysql: {
		host: '172.16.2.46', port: 3306, user: 'smartdao', password: 'smartdao', database: 'smartdao',
	},
	redis: `redis://:${encodeURIComponent('HqNuWY8WRSG2G*&^%#NGRDfmj')}@172.16.3.114:6379/10`, // redis cfg
	atomicLock: 'http://172.16.3.114:9802', // atomic lock service
};
