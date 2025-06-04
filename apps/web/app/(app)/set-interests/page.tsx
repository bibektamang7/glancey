"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Gamepad2,
	Plane,
	Flower,
	Trophy,
	Mountain,
	Palette,
	ChefHat,
	BookOpen,
	Zap,
	Laptop,
	Plus,
	Check,
} from "lucide-react";
import { Interest } from "@/types/user";

const interestIcons = {
	[Interest.TikTok]: Zap,
	[Interest.Video_Gaming]: Gamepad2,
	[Interest.Travel]: Plane,
	[Interest.Gardening]: Flower,
	[Interest.Sports]: Trophy,
	[Interest.Outdoor_Activity]: Mountain,
	[Interest.Arts_and_crafts]: Palette,
	[Interest.Cooking]: ChefHat,
	[Interest.Reading]: BookOpen,
	[Interest.Running]: Zap,
	[Interest.Technology]: Laptop,
	[Interest.Other]: Plus,
};

const SetInterests = () => {
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [customInterest, setCustomInterest] = useState("");
	const [error, setError] = useState("");

	const handleInterestToggle = (interest: string) => {
		setError("");

		if (selectedInterests.includes(interest)) {
			setSelectedInterests(selectedInterests.filter((i) => i !== interest));
			if (interest === Interest.Other) {
				setCustomInterest("");
			}
		} else {
			if (selectedInterests.length >= 3) {
				setError("You can select maximum 3 interests");
				return;
			}
			setSelectedInterests([...selectedInterests, interest]);
		}
	};

	const handleSubmit = () => {
		if (selectedInterests.length === 0) {
			setError("Please select at least one interest");
			return;
		}

		if (selectedInterests.includes(Interest.Other) && !customInterest.trim()) {
			setError("Please specify your custom interest");
			return;
		}

		// Handle form submission
		const finalInterests = selectedInterests.map((interest) =>
			interest === Interest.Other ? customInterest.trim() : interest
		);

		console.log("Selected interests:", finalInterests);
		// Add your submission logic here
	};

	const isSelected = (interest: string) => selectedInterests.includes(interest);
	const canSelectMore = selectedInterests.length < 3;

	return (
		<div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						What interests you?
					</h1>
					<p className="text-gray-400 text-lg">
						Select 1-3 interests that best describe what you're passionate about
					</p>
				</div>

				<Card className="bg-gray-900 border-gray-800">
					<CardHeader>
						<CardTitle className="text-white">Choose Your Interests</CardTitle>
						<CardDescription className="text-gray-400">
							Select at least 1 and maximum 3 interests
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{selectedInterests.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{selectedInterests.map((interest) => (
									<Badge
										key={interest}
										variant="secondary"
										className="bg-blue-600 text-white hover:bg-blue-700"
									>
										{interest === Interest.Other
											? customInterest || "Other"
											: interest}
										<button
											onClick={() => handleInterestToggle(interest)}
											className="ml-2 hover:text-red-300"
										>
											×
										</button>
									</Badge>
								))}
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{Object.values(Interest).map((interest) => {
								const Icon = interestIcons[interest];
								const selected = isSelected(interest);
								const disabled = !selected && !canSelectMore;

								return (
									<div
										key={interest}
										className="relative"
									>
										<Label
											htmlFor={interest}
											className={`
                        flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${
													selected
														? "border-blue-500 bg-blue-500/10 text-blue-400"
														: disabled
															? "border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed"
															: "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
												}
                      `}
										>
											<Checkbox
												id={interest}
												checked={selected}
												disabled={disabled}
												onCheckedChange={() => handleInterestToggle(interest)}
												className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
											/>
											<Icon className="w-5 h-5" />
											<span className="font-medium">{interest}</span>
											{selected && (
												<Check className="w-4 h-4 ml-auto text-blue-400" />
											)}
										</Label>
									</div>
								);
							})}
						</div>

						{selectedInterests.includes(Interest.Other) && (
							<div className="space-y-2">
								<Label
									htmlFor="custom-interest"
									className="text-white"
								>
									Specify your interest
								</Label>
								<Input
									id="custom-interest"
									placeholder="Enter your custom interest..."
									value={customInterest}
									onChange={(e) => setCustomInterest(e.target.value)}
									className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
								/>
							</div>
						)}

						{error && (
							<div className="text-red-400 text-sm font-medium">{error}</div>
						)}

						<div className="text-center text-gray-400 text-sm">
							{selectedInterests.length}/3 interests selected
						</div>

						<Button
							onClick={handleSubmit}
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
							size="lg"
						>
							Continue
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default SetInterests;
