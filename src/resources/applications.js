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

class Applications {
  constructor(api, appId) {
    this.api = api
    this.id = appId
  }

  async getApplication() {
    if (!this.id) {
      throw new SDKError(400, '[Zabo] SDK not properly initialized.')
    }
    try {
      return this.api.request('GET', `/applications/${this.id}`)
    } catch (err) {
      throw new SDKError(err.error_type, err.message)
    }
  }
}

module.exports = (api, appId) => {
  return new Applications(api, appId)
}