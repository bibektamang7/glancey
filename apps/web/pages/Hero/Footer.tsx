import { motion } from "motion/react";
import React from "react";

const Footer = () => {
	return (
		<footer className="!py-16 !px-4 border-t border-gray-800">
			<div className="max-w-6xl !mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<motion.div
						className="flex items-center !mb-8 md:!mb-0"
						whileHover={{ scale: 1.05 }}
					>
						<motion.div
							animate={{ rotate: 360 }}
							transition={{
								duration: 20,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}}
							className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center !mr-3"
						>
							{/* <Globe className="w-6 h-6 text-white" /> */}
						</motion.div>
						<span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
							Glancey
						</span>
					</motion.div>

					<div className="flex !space-x-8 text-gray-400">
						<a
							href="#"
							className="hover:text-indigo-400 transition-colors"
						>
							Privacy
						</a>
						<a
							href="#"
							className="hover:text-indigo-400 transition-colors"
						>
							Terms
						</a>
						<a
							href="#"
							className="hover:text-indigo-400 transition-colors"
						>
							Support
						</a>
						<a
							href="#"
							className="hover:text-indigo-400 transition-colors"
						>
							Contact
						</a>
					</div>
				</div>

				<div className="!mt-8 !pt-8 border-t border-gray-800 text-center text-gray-400">
					<p>
						&copy; 2024 Glancey. All rights reserved. Connect wherever you are.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
