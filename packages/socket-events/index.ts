const MOVEMENT = "move";

// call
const REQUEST_AUDIO_CALL = "request_audio_call";
const INCOMING_AUDIO_CALL = "incoming_audio_call";
const REJECT_AUDIO_CALL = "reject_audio_call";
const REJECT_INCOMING_AUDIO_CALL = "reject_incoming_audio_call";
const ACCEPT_INCOMING_AUDIO_CALL = "accept_incoming_audio_call";
const ACCEPT_AUDIO_CALL = "accept_audio_call";
const AUDIO_CALL_ACCEPTED = "audio_call_accepted";
const AUDIO_CALL_REJECTED = "audio_call_rejected";

const INCOMING_VIDEO_CALL = "incoming_video_call";
const REQUEST_VIDEO_CALL = "request_video_call";
const ACCEPT_INCOMING_VIDEO_CALL = "accept_incoming_video_call";
const ACCEPT_VIDEO_CALL = "accept_video_call";
const REJECT_INCOMING_VIDEO_CALL = "reject_incoming_video_call";
const REJECT_VIDEO_CALL = "reject_video_call";
const VIDEO_CALL_ACCEPTED = "video_call_accepted";
const VIDEO_CALL_REJECTED = "video_call_rejected";

const LEAVE_CALL = "leave_call";

// message
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
const RESUME_TRANSPORT = "resume";

// Location
const SET_INTERESTS_AND_LOCATION = "set_interests_and_location";
const USER_MOVEMENT = "user_movement";
const USERS_NEAR_YOU = "users_near_you";

export {
	SET_INTERESTS_AND_LOCATION,
	USERS_NEAR_YOU,
	USER_MOVEMENT,
	MOVEMENT,

	// message
	SEND_MESSAGE_IN_CHAT,
	DELETE_MESSAGE_FROM_CHAT,
	REMOVE_USER_FROM_CHAT,
	RECEIVE_MESSAGE_IN_CHAT,
	REMOVED_FROM_CHAT,

	// call
	AUDIO_CALL_REJECTED,
	VIDEO_CALL_REJECTED,

	AUDIO_CALL_ACCEPTED,
	VIDEO_CALL_ACCEPTED,
	INCOMING_AUDIO_CALL,
	ACCEPT_INCOMING_AUDIO_CALL,
	REJECT_INCOMING_AUDIO_CALL,
	REQUEST_AUDIO_CALL,
	ACCEPT_AUDIO_CALL,
	REJECT_AUDIO_CALL,
	INCOMING_VIDEO_CALL,
	ACCEPT_INCOMING_VIDEO_CALL,
	REJECT_INCOMING_VIDEO_CALL,
	REQUEST_VIDEO_CALL,
	ACCEPT_VIDEO_CALL,
	REJECT_VIDEO_CALL,
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
