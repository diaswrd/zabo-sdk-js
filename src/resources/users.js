/**
 * @Copyright (c) 2019-present, Zabo & Modular, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const { SDKError } = require('../err')

class Users {
  constructor(api) {
    this.api = api
  }

  async create(account) {

    if (!account.id) {
      throw new SDKError(400, '[Zabo] Missing `id` parameter in account object. See: https://zabo.com/docs#create-a-user')
    } else if (!account.token) {
      throw new SDKError(400, '[Zabo] Missing `token` parameter in account object. See: https://zabo.com/docs#create-a-user')
    }

    try {
      return this.api.request('POST', '/users', account)
    } catch (err) {
      throw new SDKError(err.error_type, err.message)
    }
  }

  async getUser(id) {
    if (!id) {
      throw new SDKError(400, '[Zabo] Missing `id` input. See: https://zabo.com/docs#get-a-user')
    }

    try {
      return this.api.request('GET', `/users/${id}`)
    } catch (err) {
      throw new SDKError(err.error_type, err.message)
    }
  }

  async getUsers({ limit = 25, cursor = '' } = {}) {
    try {
      return this.api.request('GET', `/users?limit=${limit}&cursor=${cursor}`)
    } catch (err) {
      throw new SDKError(err.error_type, err.message)
    }
  }

  async getBalances({ userId, accountId, tickers } = {}) {
    if (!userId) {
      throw new SDKError(400, '[Zabo] Missing `userId` parameter. See: https://zabo.com/docs#get-balances')
    } else if (!accountId) {
      throw new SDKError(400, '[Zabo] Missing `accountId` parameter. See: https://zabo.com/docs#get-balances')
    } else if (!tickers) {
      throw new SDKError(400, '[Zabo] Missing `tickers` parameter. See: https://zabo.com/docs#get-balances')
    }

    if (Array.isArray(tickers)) {
      tickers = tickers.join(',')
    }

    try {
      return this.api.request('GET', `/users/${userId}/accounts/${accountId}/balances?currency=${tickers}`)
    } catch (err) {
      throw new SDKError(err.error_type, err.message)
    }
  }
}

module.exports = (api) => {
  return new Users(api)
}
