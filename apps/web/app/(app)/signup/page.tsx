import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { ChevronLeft } from "lucide-react";

const Signup = () => {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
			<Link
				href="/"
				className="absolute left-8 top-8 flex items-center justify-center gap-1 group"
			>
				<ChevronLeft
					className="text-white group-hover:text-slate-400"
					size={20}
				/>
				<span className="font-bold text-sm text-white group-hover:text-slate-400">
					Back
				</span>
			</Link>
			<Card className="w-full max-w-md bg-zinc-900 border-zinc-800 !p-4">
				<CardHeader className="!space-y-1">
					<CardTitle className="text-2xl font-bold text-white">
						Sign up
					</CardTitle>
					<CardDescription className="text-zinc-400">
						Create an account with Google to get started with Glancey
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center">
					<AuthButton type="Sign up" />
					<div className="!mt-4 text-center text-sm text-zinc-400 tracking-wider">
						By signing up, you agree to our{" "}
						<Link
							href="/terms"
							className="!text-purple-400 hover:!text-purple-300 hover:underline"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							href="/privacy"
							className="!text-purple-400 hover:!text-purple-300 hover:underline"
						>
							Privacy Policy
						</Link>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col !space-y-4">
					<Separator className="bg-zinc-800" />
					<div className="text-center text-zinc-400">
						Already have an account?{" "}
						<Link
							href="/login"
							className="!text-blue-400 hover:!text-blue-300 hover:underline"
						>
							Log in
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default Signup;
