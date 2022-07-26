/**
 * @copyright © 2020 Copyright ccl
 * @date 2020-11-28
 */

import {ErrnoList as SysErrnoList} from 'bclib/errno';

export class ErrnoList extends SysErrnoList {
	ERR_DUPLICATE_AUTH_NAME: ErrnoCode = [100307, `ERR_DUPLICATE_AUTH_NAME`]
	ERR_HTTP_STATUS_404: ErrnoCode = [100317, 'ERR_HTTP_STATUS_404']
	ERR_SYNC_WAIT_BLOCK_TIMEOUT: ErrnoCode = [100325, `ERR_SYNC_WAIT_BLOCK_TIMEOUT`]
	ERR_TASK_STEP_EXEC_TIMEOUIT: ErrnoCode = [100326, `ERR_TASK_STEP_EXEC_TIMEOUIT`]
	ERR_TASK_ALREADY_EXISTS: ErrnoCode = [100327, `ERR_TASK_ALREADY_EXISTS`]
	ERR_TASK_NOT_EXISTS: ErrnoCode = [100328, `ERR_TASK_NOT_EXISTS`]
	ERR_TASK_BEEN_CLOSED: ErrnoCode = [100329, `ERR_TASK_BEEN_CLOSED`]
	ERR_DAO_NAME_EXISTS: ErrnoCode = [100330, `ERR_DAO_NAME_EXISTS`]
	ERR_DAO_ADDRESS_NOT_EXISTS: ErrnoCode = [100331, `ERR_DAO_ADDRESS_NOT_EXISTS`]
	ERR_DAO_IS_BEING_CREATED: ErrnoCode = [100332, `ERR_DAO_IS_BEING_CREATED`]

	// A Dao is being created
}

export default new ErrnoList;