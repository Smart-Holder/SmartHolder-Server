/**
 * @copyright © 2021 Copyright dphone.com
 * @date 2022-08-16
 */

import ApiController from '../api';
import {ChainType,SaleType} from '../models/def';
import * as opensea from '../models/opensea';
import { OrderComponents } from "seaport-smart/types";

export default class extends ApiController {
	
	getOrderParameters({chain,token,tokenId,amount,time}: {chain: ChainType, token: string, tokenId: string, amount: string, time?: number}) {
		return opensea.getOrderParameters(chain,token,tokenId,amount,time);
	}

	createOrder({chain,order,signature}: {chain: ChainType, order: OrderComponents, signature: string}) {
		return opensea.createOrder(chain,order,signature);
	}

	getOrder({chain, token, tokenId}: {chain: ChainType, token: string, tokenId: string}) {
		return opensea.getOrder(chain,token,tokenId);
	}

	getOrders({chain, token, tokenIds}: {chain: ChainType, token: string, tokenIds: string[]}) {
		return opensea.getOrders(chain,token,tokenIds);
	}

	getOrderState({chain, token, tokenId}: {chain: ChainType, token: string, tokenId: string}) {
		return opensea.getOrderState(chain,token,tokenId);
	}

	get_CROSS_CHAIN_SEAPORT_ADDRESS() { // 取消出售合约地址 seaport
		return opensea.get_CROSS_CHAIN_SEAPORT_ADDRESS();
	}

	get_CROSS_CHAIN_SEAPORT_ABI() { // 取消出售合约abi seaport
		return opensea.get_CROSS_CHAIN_SEAPORT_ABI();
	}

	get_OPENSEA_CONDUIT_ADDRESS() { // 调用合约授权资产权限给opensea
		return opensea.get_OPENSEA_CONDUIT_ADDRESS();
	}

	maskOrderClose({chain, token, tokenId}: {chain: ChainType, token: string, tokenId: string}) {
		return opensea.maskOrderClose(chain, token, tokenId);
	}

	getOpenseaContractJSON({host, chain, type, address}: {host: string, chain?: ChainType, type?: SaleType, address?: string}) {
		return opensea.getOpenseaContractJSON(host, chain, type, address);
	}

}