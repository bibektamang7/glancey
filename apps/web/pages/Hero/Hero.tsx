"use client";
import React, { useEffect, useRef, useState } from "react";
import {
	motion,
	useMotionValue,
	useMotionValueEvent,
	useScroll,
	useSpring,
	useTransform,
} from "motion/react";
import dynamic from "next/dynamic";
import {
	Badge,
	Globe,
	MapPin,
	MessageCircle,
	Shield,
	Users,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const World = dynamic(
	() => import("@/components/ui/globe").then((m) => m.World),
	{
		ssr: false,
	}
);

const colors = ["#06b6d4", "#3b82f6", "#6366f1"];
const sampleArcs = [
	{
		order: 1,
		startLat: -19.885592,
		startLng: -43.951191,
		endLat: -22.9068,
		endLng: -43.1729,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 1,
		startLat: 28.6139,
		startLng: 77.209,
		endLat: 3.139,
		endLng: 101.6869,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 1,
		startLat: -19.885592,
		startLng: -43.951191,
		endLat: -1.303396,
		endLng: 36.852443,
		arcAlt: 0.5,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 2,
		startLat: 1.3521,
		startLng: 103.8198,
		endLat: 35.6762,
		endLng: 139.6503,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 2,
		startLat: 51.5072,
		startLng: -0.1276,
		endLat: 3.139,
		endLng: 101.6869,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 2,
		startLat: -15.785493,
		startLng: -47.909029,
		endLat: 36.162809,
		endLng: -115.119411,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 3,
		startLat: -33.8688,
		startLng: 151.2093,
		endLat: 22.3193,
		endLng: 114.1694,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 3,
		startLat: 21.3099,
		startLng: -157.8581,
		endLat: 40.7128,
		endLng: -74.006,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 3,
		startLat: -6.2088,
		startLng: 106.8456,
		endLat: 51.5072,
		endLng: -0.1276,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 4,
		startLat: 11.986597,
		startLng: 8.571831,
		endLat: -15.595412,
		endLng: -56.05918,
		arcAlt: 0.5,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 4,
		startLat: -34.6037,
		startLng: -58.3816,
		endLat: 22.3193,
		endLng: 114.1694,
		arcAlt: 0.7,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 4,
		startLat: 51.5072,
		startLng: -0.1276,
		endLat: 48.8566,
		endLng: -2.3522,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 5,
		startLat: 14.5995,
		startLng: 120.9842,
		endLat: 51.5072,
		endLng: -0.1276,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 5,
		startLat: 1.3521,
		startLng: 103.8198,
		endLat: -33.8688,
		endLng: 151.2093,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 5,
		startLat: 34.0522,
		startLng: -118.2437,
		endLat: 48.8566,
		endLng: -2.3522,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 6,
		startLat: -15.432563,
		startLng: 28.315853,
		endLat: 1.094136,
		endLng: -63.34546,
		arcAlt: 0.7,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 6,
		startLat: 37.5665,
		startLng: 126.978,
		endLat: 35.6762,
		endLng: 139.6503,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 6,
		startLat: 22.3193,
		startLng: 114.1694,
		endLat: 51.5072,
		endLng: -0.1276,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 7,
		startLat: -19.885592,
		startLng: -43.951191,
		endLat: -15.595412,
		endLng: -56.05918,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 7,
		startLat: 48.8566,
		startLng: -2.3522,
		endLat: 52.52,
		endLng: 13.405,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 7,
		startLat: 52.52,
		startLng: 13.405,
		endLat: 34.0522,
		endLng: -118.2437,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 8,
		startLat: -8.833221,
		startLng: 13.264837,
		endLat: -33.936138,
		endLng: 18.436529,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 8,
		startLat: 49.2827,
		startLng: -123.1207,
		endLat: 52.3676,
		endLng: 4.9041,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 8,
		startLat: 1.3521,
		startLng: 103.8198,
		endLat: 40.7128,
		endLng: -74.006,
		arcAlt: 0.5,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 9,
		startLat: 51.5072,
		startLng: -0.1276,
		endLat: 34.0522,
		endLng: -118.2437,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 9,
		startLat: 22.3193,
		startLng: 114.1694,
		endLat: -22.9068,
		endLng: -43.1729,
		arcAlt: 0.7,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 9,
		startLat: 1.3521,
		startLng: 103.8198,
		endLat: -34.6037,
		endLng: -58.3816,
		arcAlt: 0.5,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 10,
		startLat: -22.9068,
		startLng: -43.1729,
		endLat: 28.6139,
		endLng: 77.209,
		arcAlt: 0.7,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 10,
		startLat: 34.0522,
		startLng: -118.2437,
		endLat: 31.2304,
		endLng: 121.4737,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 10,
		startLat: -6.2088,
		startLng: 106.8456,
		endLat: 52.3676,
		endLng: 4.9041,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 11,
		startLat: 41.9028,
		startLng: 12.4964,
		endLat: 34.0522,
		endLng: -118.2437,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 11,
		startLat: -6.2088,
		startLng: 106.8456,
		endLat: 31.2304,
		endLng: 121.4737,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 11,
		startLat: 22.3193,
		startLng: 114.1694,
		endLat: 1.3521,
		endLng: 103.8198,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 12,
		startLat: 34.0522,
		startLng: -118.2437,
		endLat: 37.7749,
		endLng: -122.4194,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 12,
		startLat: 35.6762,
		startLng: 139.6503,
		endLat: 22.3193,
		endLng: 114.1694,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 12,
		startLat: 22.3193,
		startLng: 114.1694,
		endLat: 34.0522,
		endLng: -118.2437,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 13,
		startLat: 52.52,
		startLng: 13.405,
		endLat: 22.3193,
		endLng: 114.1694,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 13,
		startLat: 11.986597,
		startLng: 8.571831,
		endLat: 35.6762,
		endLng: 139.6503,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 13,
		startLat: -22.9068,
		startLng: -43.1729,
		endLat: -34.6037,
		endLng: -58.3816,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
	{
		order: 14,
		startLat: -33.936138,
		startLng: 18.436529,
		endLat: 21.395643,
		endLng: 39.883798,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * (colors.length - 1))] ?? "#87cefa",
	},
];

const globeConfig = {
	pointSize: 4,
	globeColor: "#062056",
	showAtmosphere: true,
	atmosphereColor: "#FFFFFF",
	atmosphereAltitude: 0.1,
	emissive: "#062056",
	emissiveIntensity: 0.1,
	shininess: 0.9,
	polygonColor: "rgba(255,255,255,0.7)",
	ambientLight: "#38bdf8",
	directionalLeftLight: "#ffffff",
	directionalTopLight: "#ffffff",
	pointLight: "#ffffff",
	arcTime: 1000,
	arcLength: 0.9,
	rings: 1,
	maxRings: 3,
	initialPosition: { lat: 22.3193, lng: 114.1694 },
	autoRotate: true,
	autoRotateSpeed: 0.5,
};

const Hero = () => {
	const containerRef = useRef(null);
	const globeTriggerRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	});
	const smoothProgress = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001,
	});
	const { scrollYProgress: globeScrollYProgress } = useScroll({
		target: globeTriggerRef,
		offset: ["start start", "end end"],
	});
	const value = useTransform(globeScrollYProgress, [0, 1], [300, 0]);

	const z = useSpring(value, {
		stiffness: 200,
		damping: 60,
		mass: 1.2,
		velocity: 2,
		restSpeed: 0.01,
		restDelta: 0.001,
	});
	const globeRight = useTransform(
		globeScrollYProgress,
		[0, 0.01, 0.5],
		["0px", "0px", "50%"]
	);
	const globeLeft = useTransform(
		globeScrollYProgress,
		[0, 0.01, 0.5],
		["25%", "50%", "0px"]
	);
	const globeWidth = useTransform(
		globeScrollYProgress,
		[0, 0.01, 0.5],
		["50%", "50%", "100%"]
	);
	const finalSectionOpacity = useTransform(
		globeScrollYProgress,
		[0.7, 1],
		[0, 1]
	);

	const [globeProgress, setGlobeProgress] = useState(0);

	useMotionValueEvent(z, "change", (latest) => {
		console.log("this is trigger of globe", latest);
	});

	useEffect(() => {
		const unsubscribe = smoothProgress.on("change", (latest) => {
			setGlobeProgress(latest);
		});
		return () => unsubscribe();
	}, [smoothProgress]);

	return (
		<>
			<div
				ref={containerRef}
				className="min-h-screen h-full dark relative "
			>
				{/* Globe */}
				<motion.div
					style={{ right: globeRight, width: globeWidth, left: globeLeft }}
					className="fixed right-0 top-0 !w-full h-screen hidden lg:block"
				>
					<World
						globeConfig={globeConfig}
						data={sampleArcs}
						scrollProgress={globeProgress}
						cameraZ={z}
					/>
				</motion.div>
				{/* This is hide */}
				<div className="relative z-20 lg:w-1/2 text-white !px-12">
					<section className="h-screen flex items-center justify-center px-6 lg:px-12">
						<motion.div
							variants={sectionVariant}
							initial="initial"
							animate="animate"
							exit="exit"
							className="max-w-2xl"
						>
							<motion.h1
								initial={{ opacity: 0 }}
								whileInView={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="text-5xl tracking-tighter lg:text-5xl font-bold text-white mb-6 leading-tighter"
							>
								Connect with
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
									{" "}
									People{" "}
								</span>
								Around You
							</motion.h1>
							<motion.p
								initial={{ opacity: 0 }}
								whileInView={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 0.4 }}
								className="text-sm !my-2 text-gray-400 !mb-6 leading-tight tracking-tighter"
							>
								Discover and communicate with users in your vicinity. Break
								geographical barriers and build meaningful connections with
								people nearby.
							</motion.p>
							<motion.div
								initial={{ opacity: 0 }}
								whileInView={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 0.6 }}
								className="flex flex-col sm:flex-row gap-4 "
							>
								<Button className="bg-blue-800 hover:bg-blue-700 text-white !px-8 py-3">
									Get Started
								</Button>
								<Button
									variant="outline"
									className="border-gray-600 text-gray-300 hover:bg-gray-800 !px-8 py-3"
								>
									Learn More
								</Button>
							</motion.div>
						</motion.div>
					</section>

					<section className="min-h-screen flex items-center justify-center px-6 lg:px-12">
						<motion.div
							variants={sectionVariant}
							initial="initial"
							animate="animate"
							exit="exit"
							className="max-w-2xl"
						>
							<motion.h2
								initial={{ opacity: 0.2 }}
								whileInView={{ opacity: 1 }}
								transition={{ duration: 1.5, delay: 0.3 }}
								animate={{}}
								className="text-3xl lg:text-4xl font-bold text-white mb-8"
							>
								Discover Your
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
									{" "}
									Local Network
								</span>
							</motion.h2>
							<div className="!space-y-8 !mt-4">
								<motion.div
									whileInView={{ opacity: 1, x: 0 }}
									initial={{ opacity: 0, x: -50 }}
									transition={{ duration: 0.6, delay: 0.1 }}
									className="flex items-start space-x-4 gap-2"
								>
									<div className="bg-blue-500/20 p-3 rounded-lg">
										<MapPin className="w-4 h-4 text-blue-400" />
									</div>
									<div>
										<h3 className="text-normal font-semibold text-white mb-2">
											Location-Based Discovery
										</h3>
										<p className="text-gray-300 text-sm tracking-tighter leading-tight">
											Find and connect with users within your specified radius.
											Our advanced geolocation technology ensures accurate
											proximity matching.
										</p>
									</div>
								</motion.div>
								<motion.div
									whileInView={{ opacity: 1, x: 0 }}
									initial={{ opacity: 0, x: -50 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="flex items-start space-x-4 gap-2"
								>
									<div className="bg-purple-500/20 p-3 rounded-lg">
										<Users className="w-4 h-4 text-purple-400" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-white mb-2">
											Community Building
										</h3>
										<p className="text-gray-300 text-sm tracking-tighter leading-tight">
											Create local communities, organize events, and build
											lasting relationships with people in your area.
										</p>
									</div>
								</motion.div>
								<motion.div
									whileInView={{ opacity: 1, x: 0 }}
									initial={{ opacity: 0, x: -50 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="flex items-start space-x-4 gap-2"
								>
									<div className="bg-cyan-500/20 p-3 rounded-lg">
										<MessageCircle className="w-4 h-4 text-cyan-400" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-white mb-2">
											Real-time Messaging
										</h3>
										<p className="text-gray-300 text-sm tracking-tighter leading-tight">
											Instant messaging with nearby users. Share thoughts,
											coordinate meetups, and stay connected in real-time.
										</p>
									</div>
								</motion.div>
							</div>
						</motion.div>
					</section>

					<section className="min-h-screen flex items-center justify-center px-6 lg:px-12">
						<motion.div
							variants={sectionVariant}
							initial="initial"
							animate="animate"
							exit="exit"
							className="max-w-2xl"
						>
							<motion.h2
								initial={{ opacity: 0.2 }}
								whileInView={{ opacity: 1 }}
								transition={{ duration: 1.6, delay: 0.3, ease: "easeInOut" }}
								className="text-3xl lg:text-4xl font-bold text-white !mb-8"
							>
								Powered by
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
									{" "}
									Advanced Technology
								</span>
							</motion.h2>
							<motion.div
								whileInView={{ opacity: 1, x: 0 }}
								initial={{ opacity: 0, x: -50 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className="grid gap-6"
							>
								<div className="bg-gray-800/50 rounded-xl border border-gray-700 !p-4">
									<div className="flex items-center space-x-3 gap-2">
										<Globe className="w-4 h-4 text-green-400" />
										<h3 className="text-lg font-semibold text-white tracking-tighter leading-tight">
											Global Infrastructure
										</h3>
									</div>
									<p className="text-gray-300 text-sm tracking-tighter leading-tight !mt-2">
										Our worldwide network ensures fast, reliable connections no
										matter where you are. Low latency communication across
										continents.
									</p>
								</div>
								<motion.div
									whileInView={{ opacity: 1, x: 0 }}
									initial={{ opacity: 0, x: -50 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="bg-gray-800/50 !p-4 rounded-xl border border-gray-700"
								>
									<div className="flex items-center space-x-3 mb-4 gap-2">
										<Shield className="w-4 h-4 text-blue-400" />
										<h3 className="text-lg font-semibold text-white tracking-tighter leading-tight">
											Privacy First
										</h3>
									</div>
									<p className="text-gray-300 text-sm leading-tight tracking-tighter !mt-2">
										End-to-end encryption and privacy controls. Your location
										data is secure and only shared with your explicit consent.
									</p>
								</motion.div>
								<motion.div
									whileInView={{ opacity: 1, x: 0 }}
									initial={{ opacity: 0, x: -50 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="bg-gray-800/50 !p-4 rounded-xl border border-gray-700"
								>
									<div className="flex items-center space-x-3 mb-4 gap-2">
										<Zap className="w-4 h-4 text-yellow-400" />
										<h3 className="text-lg font-semibold text-white tracking-tighter leading-tight">
											Lightning Fast
										</h3>
									</div>
									<p className="text-gray-300 text-sm tracking-tighter leading-tight !mt-2">
										Optimized algorithms for instant user discovery and message
										delivery. Connect with nearby users in milliseconds.
									</p>
								</motion.div>
							</motion.div>
						</motion.div>
					</section>
				</div>
			</div>
			{/* Trigger at this div */}
			<div
				ref={globeTriggerRef}
				className="h-[300vh]"
			></div>
			{/* Show after finish */}
			<motion.section
				style={{ opacity: finalSectionOpacity }}
				className="min-h-screen flex items-center justify-center px-6 lg:px-12"
			>
				<div className="max-w-2xl text-center">
					<h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
						Ready to
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
							{" "}
							Connect?
						</span>
					</h2>
					<p className="text-xl text-gray-300 mb-8">
						Join thousands of users already connecting with their local
						communities. Start building meaningful relationships today.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							size="lg"
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg"
						>
							Download App
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="border-gray-600 text-gray-300 hover:bg-gray-800 px-12 py-4 text-lg"
						>
							View Demo
						</Button>
					</div>
					<div className="mt-12 grid grid-cols-3 gap-8 text-center">
						<div>
							<div className="text-3xl font-bold text-white">50K+</div>
							<div className="text-gray-400">Active Users</div>
						</div>
						<div>
							<div className="text-3xl font-bold text-white">100+</div>
							<div className="text-gray-400">Cities</div>
						</div>
						<div>
							<div className="text-3xl font-bold text-white">1M+</div>
							<div className="text-gray-400">Connections Made</div>
						</div>
					</div>
				</div>
			</motion.section>
		</>
	);
};
const sectionVariant = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			duration: 0.6,
			ease: "easeInOut",
			staggerChildren: 0.2,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.4,
			ease: "easeInOut",
		},
	},
};

export default Hero;
