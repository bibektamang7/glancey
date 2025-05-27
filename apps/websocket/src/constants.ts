const MOVEMENT = "move";
const REQUEST_JOIN_CALL = "request_join_call";
const REQUEST_CHAT_MESSAGE = "request_chat_message";
const ACCEPT_JOIN_CALL = "accept_join_call";
const REJECT_JOIN_CALL = "reject_join_call";
const LEAVE_CALL = "leave_call";
const SEND_MESSAGE_IN_CHAT = "send_message_in_chat";
const DELETE_MESSAGE_FROM_CHAT = "delete_message_from_chat";
const REMOVE_USER_FROM_CHAT = "remove_user_from_chat";

const RECEIVE_MESSAGE_IN_CHAT = "recieve_message_in_chat";
const REMOVED_FROM_CHAT = "removed_from_chat";

const GET_ROUTER_RTP_CAPABILITIES = "get_router_rtp_capabilities";
const CREATE_PRODUCER_TRANSPORT = "create_producer_transport";
const CONNECT_PRODUCER_TRANSPORT = "connect_producer_transport";
const CONNECT_PRODUCER = "produce";
const CREATE_CONSUMER_TRANSPORT = "create_consumer_transport";
const CONNECT_CONSUMER_TRANSPORT = "connect_consumer_transport";
const CONNECT_CONSUMER = "consume";
const RESUME_TRANSPORT = "resumer";

export {
	MOVEMENT,
	REQUEST_JOIN_CALL,
	LEAVE_CALL,
	SEND_MESSAGE_IN_CHAT,
	DELETE_MESSAGE_FROM_CHAT,
	REMOVE_USER_FROM_CHAT,
	ACCEPT_JOIN_CALL,
	REJECT_JOIN_CALL,
	REQUEST_CHAT_MESSAGE,
	RECEIVE_MESSAGE_IN_CHAT,
	REMOVED_FROM_CHAT,
	GET_ROUTER_RTP_CAPABILITIES,
	CREATE_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CONNECT_CONSUMER,
	CONNECT_CONSUMER_TRANSPORT,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	RESUME_TRANSPORT
};
