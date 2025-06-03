"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { Globe, MapPin, MessageCircle, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { globeConfig, sampleArcs, sectionVariant } from "@/data/Hero";

const World = dynamic(
	() => import("@/components/ui/globe").then((m) => m.World),
	{
		ssr: false,
		loading: () => <p>Loading...</p>,
	}
);

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
				<motion.div
					style={{ right: globeRight, width: globeWidth, left: globeLeft }}
					className="fixed right-0 top-0 !w-full h-screen hidden lg:block z-10"
				>
					<World
						globeConfig={globeConfig}
						data={sampleArcs}
						scrollProgress={globeProgress}
						cameraZ={z}
					/>
				</motion.div>
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
								className="text-5xl tracking-tighter lg:text-7xl font-bold text-white mb-6 leading-tighter"
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
								className="text-sm lg:text-lg !my-4 text-gray-400 !mb-6 leading-tight tracking-tighter"
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
								className="text-3xl lg:text-6xl font-bold text-slate-100 mb-8"
							>
								Discover Your
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-400">
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
										<h3 className="text-lg font-semibold text-white mb-2">
											Location-Based Discovery
										</h3>
										<p className="text-gray-300 tracking-tighter">
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
										<p className="text-gray-300 tracking-tighter ">
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
										<p className="text-gray-300  tracking-tighter">
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
								className="text-3xl lg:text-5xl font-bold text-white !mb-8"
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
									<p className="text-gray-300 tracking-tight !mt-2">
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
										<h3 className="text-lg font-semibold text-white tracking-tight leading-tight">
											Privacy First
										</h3>
									</div>
									<p className="text-gray-300 tracking-tight !mt-2">
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
									<p className="text-gray-300 tracking-tight !mt-2">
										Optimized algorithms for instant user discovery and message
										delivery. Connect with nearby users in milliseconds.
									</p>
								</motion.div>
							</motion.div>
						</motion.div>
					</section>
				</div>
			</div>
			<div
				ref={globeTriggerRef}
				className="h-[300vh]"
			></div>
			<motion.section
				style={{ opacity: finalSectionOpacity }}
				className="min-h-screen relative flex items-center justify-center px-6 lg:px-12 !z-[100]"
			>
				<Spotlight
					className="-top-40 left-0 md:-top-20 md:left-60"
					fill="white"
				/>
				<motion.div
					animate={{ scale: 1.3 }}
					className="max-w-2xl text-center !space-y-4"
				>
					<motion.h2
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 1 }}
						className="text-4xl lg:text-6xl font-semibold text-white mb-6"
					>
						Ready to
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
							{" "}
							Connect?
						</span>
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 1 }}
						className=" text-gray-500 mb-8"
					>
						Join thousands of users already connecting with their local
						communities. Start building meaningful relationships today.
					</motion.p>
					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 1 }}
						className="flex flex-col sm:flex-row gap-4 justify-center"
					>
						<Button className="bg-blue-700 text-white !px-12 py-4 hover:cursor-pointer">
							Download App
						</Button>
						<Button
							variant="outline"
							className="border-gray-600 text-black hover:bg-slate-300 hover:cursor-pointer !px-12 py-4"
						>
							View Demo
						</Button>
					</motion.div>
					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 1 }}
						className="mt-12 grid grid-cols-3 gap-8 text-center"
					>
						<div>
							<div className="text-lg text-white">50K+</div>
							<div className="text-gray-400 text-sm">Active Users</div>
						</div>
						<div>
							<div className="text-lg text-white">100+</div>
							<div className="text-gray-400 text-sm">Cities</div>
						</div>
						<div>
							<div className="text-lg text-white">1M+</div>
							<div className="text-gray-400 text-sm">Connections Made</div>
						</div>
					</motion.div>
				</motion.div>
			</motion.section>
		</>
	);
};

export default Hero;
