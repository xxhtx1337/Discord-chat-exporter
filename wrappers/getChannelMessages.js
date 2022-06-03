import axios from "axios";
import { sleep } from "../utils/utils.js";
import { getChannelName, getChannels } from "./getChannels.js";
import { getChannelTag } from "./getTag.js";
import { getMessages} from "./getMessages.js";
import fs from "fs";

const getMessagesAmount = async (token, channelid) => {
  let { data } = await axios.get(
    `https://discord.com/api/v9/channels/${channelid}/messages/search?min_id=88392440217600000`,
    { headers: { authorization: token, "content-type": "application/json" } }
  );
  if (data?.code === 110000) {
    console.log(`Channel not indexed, retrying in 5 seconds...`);
    await sleep(27000);
    ({ data } = await axios.get(
      `https://discord.com/api/v9/channels/${channelid}/messages/search?min_id=88392440217600000`,
      { headers: { authorization: token, "content-type": "application/json" } }
    ));
    if (data?.code === 110000) {
      console.log(`Failed to get channel messages`);
      await sleep(17000);
    }
    return data.total_results;
  }
  return data.total_results;
};

const getChannelMessages = async (token, channelid) => {
  const channelname = await getChannelName(token, channelid);
  const totalMessages = await getMessagesAmount(token, channelid);
  const channeltag = await getChannelTag(token, channelid);
  const getMessagess = await getMessages(token, channelid);
  console.log(`${totalMessages} messages found  ID: ${channelname} | Tag: ${channeltag}`);
  let fetchedMessages = [];
  let { data } = await axios.get(
    `https://discord.com/api/v9/channels/${channelid}/messages?limit=100`,
    { headers: { authorization: token, "content-type": "application/json" } }
  );
  fetchedMessages.push(...data);

  let progress = 0;
  if(0 === data.length) {
  return fetchedMessages;
}
if(0 === channelname) {
  return fetchedMessages;
}
  let lastMessage = data.slice(-1)[0].id;
  
  for (let i = 0; i < Math.ceil(totalMessages / 100) - 1; i++) {
    ({ data } = await axios.get(
      `https://discord.com/api/v9/channels/${channelid}/messages?before=${lastMessage}&limit=100`,
      { headers: { authorization: token, "content-type": "application/json" } }
    ));
    fetchedMessages.push(...data);
    lastMessage = data.slice(-1)[0].id;
    progress += 100;
  console.log(`Exported ${progress} of ${totalMessages} ID: ${channelname} | Tag: ${channeltag}`);
  }

  //Removes duplicates caused by last fetch
  const ids = fetchedMessages.map((o) => o.id);
  fetchedMessages = fetchedMessages.filter(
    ({ id }, index) => !ids.includes(id, index + 1)
  );

  return fetchedMessages;
};

export { getChannelMessages };