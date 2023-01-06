
import {ChainType} from '../src/models/define';
import * as asset from '../src/models/asset';

export default async function() {
	// return getOrderParameters(ChainType.RINKEBY, '0x7200CC8180DE111306D8A99E254381080dA48Fd7', '1', 1e16.toString());
	return asset.getAssetFrom(ChainType.RINKEBY, '0xD6C9b3cF6005d8addEA5B48D2a6C6bE1D9F5Bb83', '0x0689086d8884c287eec736cFB93D1713ea423D00');
}