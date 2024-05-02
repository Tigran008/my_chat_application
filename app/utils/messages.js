const moment = require("moment");
const formatMessages = (username, text) => {
  return {
    text: text,
    username: username,
    time: moment().format("h:mm a"),
  };
};
module.exports = formatMessages;
