const MOVEMENT = "move";

// call
const REQUEST_START_CALL = "request_start_call";
const ACCEPT_START_CALL = "accept_start_call";
const REJECT_START_CALL = "reject_start_call";
const REQUEST_JOIN_CALL = "request_join_call";
const ACCEPT_JOIN_CALL = "accept_join_call";
const REJECT_JOIN_CALL = "reject_join_call";
const LEAVE_CALL = "leave_call";
const INCOMING_CALL = "incoming_call";
const INCOMING_CALL_ACCEPTED = "incoming_call_accepted";
const INCOMING_CALL_REJECTED = "incoming_call_rejected";
const INCOMING_CALL_JOIN_REQUEST = "incoming_call_join_request";
const INCOMING_CALL_JOIN_ACCEPTED = "incoming_call_join_accepted";
const REJECT_INCOMING_CALL_JOIN_REQUEST = "reject_incoming_call_join_request";

// message
const REQUEST_CHAT_MESSAGE = "request_chat_message";
const SEND_MESSAGE_IN_CHAT = "send_message_in_chat";
const DELETE_MESSAGE_FROM_CHAT = "delete_message_from_chat";
const REMOVE_USER_FROM_CHAT = "remove_user_from_chat";

const RECEIVE_MESSAGE_IN_CHAT = "recieve_message_in_chat";
const REMOVED_FROM_CHAT = "removed_from_chat";

// mediasoup
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

	// message
	SEND_MESSAGE_IN_CHAT,
	DELETE_MESSAGE_FROM_CHAT,
	REMOVE_USER_FROM_CHAT,
	REQUEST_CHAT_MESSAGE,
	RECEIVE_MESSAGE_IN_CHAT,
	REMOVED_FROM_CHAT,

	// call
	INCOMING_CALL,
	INCOMING_CALL_ACCEPTED,
	INCOMING_CALL_REJECTED,
	INCOMING_CALL_JOIN_REQUEST,
	INCOMING_CALL_JOIN_ACCEPTED,
	REJECT_INCOMING_CALL_JOIN_REQUEST,
	REQUEST_START_CALL,
	ACCEPT_START_CALL,
	REJECT_START_CALL,
	REQUEST_JOIN_CALL,
	ACCEPT_JOIN_CALL,
	REJECT_JOIN_CALL,
	LEAVE_CALL,

	//Media soup
	GET_ROUTER_RTP_CAPABILITIES,
	CREATE_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CONNECT_CONSUMER,
	CONNECT_CONSUMER_TRANSPORT,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	RESUME_TRANSPORT,
};
