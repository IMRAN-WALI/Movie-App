if (typeof global.DOMException === "undefined") {
  class DOMExceptionPolyfill extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || "DOMException";
    }
  }
  global.DOMException = DOMExceptionPolyfill;
}

if (typeof global.navigator === "undefined") {
  global.navigator = {};
}
if (typeof global.navigator.userAgent === "undefined") {
  global.navigator.userAgent = "react-native";
}
