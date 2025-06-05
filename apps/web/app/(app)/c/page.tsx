import { MessageCircleMore } from "lucide-react";

const ChatsPage = () => {
	return (
		<div className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<MessageCircleMore className="h-6 w-6" />
				<h1 className="text-2xl font-bold">Chats</h1>
			</div>
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="p-4 border rounded-lg"
					>
						<h3 className="font-semibold">Chat {i}</h3>
						<p className="text-sm text-gray-600">Last message preview...</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default ChatsPage;
