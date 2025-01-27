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
 * 
 * @description: Zabo API communication library
 */

'use strict'

const axios = require('axios')
const constants = require('./constants')
const utils = require('./utils')
const resources = require('./resources')

const { SDKError } = require('./err')

// Main API class definition
class API {
  constructor(options) {
    Object.assign(this, options)

    let urls = constants(options.baseUrl, options.connectUrl)[this.env]
    this.baseUrl = urls.API_BASE_URL
    this.axios = axios
    this.axios.defaults.baseURL = this.baseUrl
    if (utils.isNode()) {
      this.axios.defaults.headers.common['X-Zabo-Key'] = this.apiKey
    } else {
      this.interfaces = {}
      this.connectUrl = urls.CONNECT_BASE_URL
      this._setEventListeners()
      if (utils.getZaboSession()) {
        this.resources = resources(this, false, '')
      }
    }
  }

  async connect(interfaceType, attachTo) {
    let appID
    let isNode = utils.isNode()
    if (isNode) {
      try {
        let res = await this.request('GET', '/applications/id')
        appID = res.id

        if (!appID) {
          throw new SDKError(500, 'Something went wrong on our end. Please note the time and let us know')
        }
      } catch (err) {
        throw err
      }
    } else {
      const url = `${this.connectUrl}/connect?clientId=${this.clientId}&origin=${encodeURIComponent(window.location.host)}&zabo_env=${this.env}`
      this.isWaitingForConnector = true
      if (interfaceType == 'iframe') {
        this.connector = document.createElement('iframe')
        this.connector.src = url
        document.querySelector(attachTo).appendChild(this.connector)
      } else {
        this.connector = window.open(url, 'Zabo Connect', 'width=600,height=960,resizable,scrollbars=yes,status=1')
      }
    }

    this.resources = resources(this, isNode, appID)
  }

  async request(method, path, data) {
    let timestamp = Date.now()
    let url = this.baseUrl + path
    let body = data ? JSON.stringify(data) : ''
    let headers
    if (utils.isNode()) {
      let signature = utils.generateHMACSignature(this.secretKey, url, body, timestamp)
      headers = {
        'X-Zabo-Sig': signature,
        'X-Zabo-Timestamp': timestamp
      }
    } else {
      headers = { 'Authorization': 'Bearer ' + utils.getZaboSession() }
    }
    method = method.toLowerCase()

    try {
      let response = await this.axios({ method, url, data, headers })
      return response.data
    } catch (err) {
      throw new SDKError(err.response.status, err.response.data.message)
    }
  }

  _setEventListeners() {
    window.addEventListener('message', this._onPostMessage.bind(this), false)
  }

  _onPostMessage(event) {
    if (event.data.zabo) {
      this.isWaitingForConnector = false
      if (event.origin !== this.connectUrl) {
        throw new SDKError(401, 'Unauthorized attempt to call SDK from origin: ' + event.origin + '. Call can only come from: ' + this.connectUrl)
      }
    }

    if (event.data.zabo && event.data.eventName == 'connectSuccess') {
      if (event.data.account && event.data.account.token) {
        this._setSession({
          key: 'zabosession',
          value: event.data.account.token,
          exp_time: event.data.account.exp_time
        })
      }

      if (event.data.account.wallet_provider_name == 'metamask') {
        this.interfaces.metamask = new require('./resources/metamask')()
        if (this.interfaces.metamask.isSupported()) {
          this.interfaces.metamask.onConnect(event.data.account)
        } else {
          if (this._onError) {
            this._onError({ error_type: 400, message: "Connection attempted with MetaMask, but MetaMask not found." })
          } else {
            throw new SDKError(400, "Connection attempted with MetaMask, but MetaMask not found.")
          }
        }
      } else if (event.data.account.wallet_provider_name == 'ledger') {
        this.interfaces.ledger = new require('./resources/ledger')()
        this.interfaces.ledger.onConnect(event.data.account)
      }

      if (this.account) {
        this.account._setAccount(event.data.account)
        this.transactions._setAccount(event.data.account)
      }

      if (this._onConnection) {
        this._onConnection(event.data.account)
      }
    }

    if (event.data.zabo && event.data.eventName == 'connectError') {
      if (this._onError) {
        this._onError({ error_type: 400, message: "Error in the connection process: " + event.data.error.message })
      } else {
        throw new SDKError(400, "Error in the connection process: " + event.data.error.message)
      }
    }
  }

  _setSession(cookie) {
    let sExpires = "; expires=" + cookie.exp_time
    document.cookie = encodeURIComponent(cookie.key) + "=" + encodeURIComponent(cookie.value) + sExpires
    return true;
  }
}

// Export API class
module.exports = API
