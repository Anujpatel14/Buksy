const { AsyncLocalStorage } = require("node:async_hooks");

const requestContext = new AsyncLocalStorage();

function getRequestStore() {
  return requestContext.getStore() || {};
}

function getCurrentUserId() {
  return getRequestStore().userId || null;
}

module.exports = {
  requestContext,
  getRequestStore,
  getCurrentUserId
};
