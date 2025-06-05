import { BellRing } from "lucide-react";

const NotificationsPage = () => {
	return (
		<div className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<BellRing className="h-6 w-6" />
				<h1 className="text-2xl font-bold">Notifications</h1>
			</div>
			<div className="space-y-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="p-4 border rounded-lg flex items-start gap-3"
					>
						<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
						<div>
							<h3 className="font-semibold">Notification {i}</h3>
							<p className="text-sm text-gray-600">
								Notification content here...
							</p>
							<p className="text-xs text-gray-400 mt-1">2 hours ago</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default NotificationsPage;
